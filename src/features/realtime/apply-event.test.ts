import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Cart, Nft, Order } from '@/contracts'
import { qk } from '@/lib/query-keys'
import { applyRealtimeEvent } from './apply-event'
import { clearEventLedger, recordResourceVersion } from './event-ledger'

const NFT_ID = 'emerald-ape-042'

const nft = {
  id: NFT_ID,
  title: 'Emerald Ape #042',
  priceFrom: '1.19',
  version: 3,
  editions: [
    { id: 'e-10', name: '1/10', price: '1.49', supply: 10, available: 2, maxPerOrder: 2 },
    { id: 'e-50', name: '1/50', price: '1.19', supply: 50, available: 12, maxPerOrder: 5 },
  ],
} as Nft

function nftUpdated(version: number, price: string, overrides: Record<string, unknown> = {}) {
  return {
    eventId: `evt-${version}-${price}`,
    type: 'nft.updated',
    resource: { kind: 'nft', id: NFT_ID },
    version,
    occurredAt: '2026-10-16T12:00:00.000Z',
    data: {
      editions: [
        { id: 'e-10', price: '1.49', available: 2 },
        { id: 'e-50', price, available: 12 },
      ],
      priceFrom: price,
    },
    ...overrides,
  }
}

function orderUpdated(userId: string, version: number) {
  return {
    eventId: `order-evt-${userId}-${version}`,
    type: 'order.updated',
    resource: { kind: 'order', id: 'order-1' },
    version,
    occurredAt: '2026-10-16T12:00:00.000Z',
    userId,
    data: { status: 'confirmed', rejectionReason: null, transaction: null },
  }
}

let queryClient: QueryClient

function watchDetail(): () => void {
  const observer = new QueryObserver(queryClient, {
    queryKey: qk.nfts.detail(NFT_ID),
    queryFn: () => nft,
    staleTime: Infinity,
  })
  return observer.subscribe(() => undefined)
}

function detailPrice(): string | undefined {
  return queryClient.getQueryData<Nft>(qk.nfts.detail(NFT_ID))?.editions[1]?.price
}

beforeEach(() => {
  clearEventLedger()
  queryClient = new QueryClient()
  queryClient.setQueryData(qk.nfts.detail(NFT_ID), nft)
  recordResourceVersion('nft', NFT_ID, nft.version)
})

describe('applyRealtimeEvent', () => {
  it('patches the detail, the cached lists and the favorites with the new prices', () => {
    queryClient.setQueryData(qk.nfts.featured(), { items: [nft] })
    queryClient.setQueryData(qk.user('marina').favorites(), { nftIds: [NFT_ID], items: [nft] })

    expect(applyRealtimeEvent(queryClient, nftUpdated(4, '1.35'), null)).not.toBeNull()

    expect(detailPrice()).toBe('1.35')
    expect(queryClient.getQueryData<Nft>(qk.nfts.detail(NFT_ID))?.version).toBe(4)
    const featured = queryClient.getQueryData<{ items: Nft[] }>(qk.nfts.featured())
    expect(featured?.items[0]?.priceFrom).toBe('1.35')
    const favorites = queryClient.getQueryData<{ items: Nft[] }>(qk.user('marina').favorites())
    expect(favorites?.items[0]?.priceFrom).toBe('1.35')
  })

  it('drops a duplicate, an older version and a malformed payload without touching the cache', () => {
    const event = nftUpdated(4, '1.35')
    expect(applyRealtimeEvent(queryClient, event, null)).not.toBeNull()
    expect(applyRealtimeEvent(queryClient, event, null)).toBeNull()
    expect(applyRealtimeEvent(queryClient, nftUpdated(3, '0.5'), null)).toBeNull()
    expect(applyRealtimeEvent(queryClient, { ...nftUpdated(5, '9'), version: 'five' }, null)).toBe(
      null,
    )
    expect(detailPrice()).toBe('1.35')
  })

  it('keeps a newer cached version even after the ledger was cleared', () => {
    queryClient.setQueryData(qk.nfts.detail(NFT_ID), { ...nft, version: 6 })
    clearEventLedger()
    expect(applyRealtimeEvent(queryClient, nftUpdated(5, '0.5'), null)).not.toBeNull()
    expect(detailPrice()).toBe('1.19')
  })

  it('announces only what is on screen or in the cart', () => {
    expect(applyRealtimeEvent(queryClient, nftUpdated(4, '1.35'), null)?.announcements).toEqual([])

    const stop = watchDetail()
    expect(applyRealtimeEvent(queryClient, nftUpdated(5, '1.4'), null)?.announcements).toEqual([
      'O preço de Emerald Ape #042 (1/50) mudou para 1.40 ETH',
    ])
    stop()

    queryClient.setQueryData<Cart>(qk.cart('guest:g1'), {
      id: 'cart-1',
      owner: { kind: 'guest' },
      couponCode: null,
      version: 1,
      items: [
        {
          id: 'item-1',
          nftId: NFT_ID,
          editionId: 'e-50',
          title: 'Emerald Ape #042',
          tokenId: '0042',
          editionName: '1/50',
          image: '/images/nfts/emerald-1.webp',
          quantity: 1,
          unitPrice: '1.4',
          unitPriceWhenAdded: '1.19',
          available: 12,
          maxPerOrder: 5,
          nftVersion: 5,
        },
      ],
    })
    const soldOut = nftUpdated(6, '1.4')
    soldOut.data.editions[1] = { id: 'e-50', price: '1.4', available: 0 }
    expect(applyRealtimeEvent(queryClient, soldOut, null)?.announcements).toEqual([
      'Emerald Ape #042 (1/50) esgotou',
    ])
    expect(queryClient.getQueryState(qk.cart('guest:g1'))?.isInvalidated).toBe(true)
  })

  it("ignores another user's order event and updates the owner's order", () => {
    const order = { id: 'order-1', status: 'pending', version: 1 } as Order
    queryClient.setQueryData(qk.user('marina').order('order-1'), order)

    expect(applyRealtimeEvent(queryClient, orderUpdated('rafael', 2), 'marina')).toBeNull()
    expect(applyRealtimeEvent(queryClient, orderUpdated('marina', 2), null)).toBeNull()
    expect(queryClient.getQueryData<Order>(qk.user('marina').order('order-1'))?.status).toBe(
      'pending',
    )

    expect(applyRealtimeEvent(queryClient, orderUpdated('marina', 2), 'marina')).not.toBeNull()
    expect(queryClient.getQueryData<Order>(qk.user('marina').order('order-1'))).toMatchObject({
      status: 'confirmed',
      version: 2,
    })
  })
})
