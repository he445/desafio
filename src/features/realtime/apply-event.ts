import type { QueryClient } from '@tanstack/react-query'
import {
  RealtimeEventSchema,
  type Cart,
  type Nft,
  type NftUpdatedEvent,
  type Order,
  type OrderUpdatedEvent,
  type RealtimeEvent,
} from '@/contracts'
import { copy } from '@/content/copy'
import { formatEthNumberDisplay } from '@/lib/format'
import { qk } from '@/lib/query-keys'
import { shouldAcceptEvent } from './event-ledger'
import { clearCheckoutAttempt } from '@/features/orders/attempt'

interface AppliedEvent {
  event: RealtimeEvent
  announcements: string[]
}

// Each cache keeps its own version check: the ledger can be cleared on logout while the public
// catalog stays cached, and an older event must still not overwrite newer data.
function patchNft(nft: Nft, event: NftUpdatedEvent): Nft {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft
  const next = new Map(event.data.editions.map((edition) => [edition.id, edition]))
  return {
    ...nft,
    priceFrom: event.data.priceFrom,
    version: event.version,
    editions: nft.editions.map((edition) => {
      const update = next.get(edition.id)
      return update ? { ...edition, price: update.price, available: update.available } : edition
    }),
  }
}

function patchItems<T extends { items: Nft[] }>(data: T | undefined, event: NftUpdatedEvent) {
  if (!data || !data.items.some((nft) => nft.id === event.resource.id)) return data
  return { ...data, items: data.items.map((nft) => patchNft(nft, event)) }
}

interface WatchedEdition {
  title: string
  editionName: string
  price: string
  available: number
}

// Only what the person is looking at or about to buy is worth interrupting a screen reader:
// the editions in a cached cart and every edition of a detail page on screen.
function watchedEditions(queryClient: QueryClient, nftId: string): Map<string, WatchedEdition> {
  const watched = new Map<string, WatchedEdition>()
  const detailQuery = queryClient.getQueryCache().find<Nft>({ queryKey: qk.nfts.detail(nftId) })
  const detail = detailQuery?.state.data
  if (detail && detailQuery.isActive()) {
    for (const edition of detail.editions) {
      watched.set(edition.id, {
        title: detail.title,
        editionName: edition.name,
        price: edition.price,
        available: edition.available,
      })
    }
  }
  for (const [, cart] of queryClient.getQueriesData<Cart>({ queryKey: ['cart'] })) {
    for (const item of cart?.items ?? []) {
      if (item.nftId !== nftId || watched.has(item.editionId)) continue
      watched.set(item.editionId, {
        title: item.title,
        editionName: item.editionName,
        price: item.unitPrice,
        available: item.available,
      })
    }
  }
  return watched
}

function describeNftChanges(
  watched: Map<string, WatchedEdition>,
  event: NftUpdatedEvent,
): string[] {
  const messages: string[] = []
  for (const update of event.data.editions) {
    const before = watched.get(update.id)
    if (!before) continue
    const label = `${before.title} (${before.editionName})`
    if (formatEthNumberDisplay(update.price) !== formatEthNumberDisplay(before.price)) {
      messages.push(copy.realtime.priceChanged(label, formatEthNumberDisplay(update.price)))
    }
    if (before.available > 0 && update.available === 0) {
      messages.push(copy.realtime.soldOut(label))
    }
  }
  return messages
}

function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): string[] {
  const nftId = event.resource.id
  const announcements = describeNftChanges(watchedEditions(queryClient, nftId), event)

  queryClient.setQueryData<Nft>(qk.nfts.detail(nftId), (nft) => nft && patchNft(nft, event))
  queryClient.setQueriesData<{ items: Nft[] }>({ queryKey: ['nfts', 'list'] }, (data) =>
    patchItems(data, event),
  )
  queryClient.setQueryData<{ items: Nft[] }>(qk.nfts.featured(), (data) => patchItems(data, event))
  queryClient.setQueriesData<{ items: Nft[] }>(
    { predicate: ({ queryKey }) => queryKey[0] === 'user' && queryKey[2] === 'favorites' },
    (data) => patchItems(data, event),
  )
  // A patched page may no longer match its filter or order; the next visit refetches it.
  void queryClient.invalidateQueries({ queryKey: ['nfts', 'list'], refetchType: 'none' })

  const inCart = queryClient
    .getQueriesData<Cart>({ queryKey: ['cart'] })
    .some(([, cart]) => cart?.items.some((item) => item.nftId === nftId))
  if (inCart) {
    // Prices and limits in the cart are the server's to recalculate, never the client's.
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['quote'] })
  }
  return announcements
}

function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent): void {
  const keys = qk.user(event.userId)
  queryClient.setQueryData<Order>(keys.order(event.resource.id), (order) =>
    order && order.version < event.version
      ? { ...order, ...event.data, version: event.version }
      : order,
  )
  void queryClient.invalidateQueries({ queryKey: keys.pendingOrders() })
  if (event.data.status !== 'pending') {
    // A finished order frees its key: the next confirmation is a new purchase.
    clearCheckoutAttempt(event.userId)
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
  }
}

// Schema, owner, duplicate and version gates run before anything touches the cache.
export function applyRealtimeEvent(
  queryClient: QueryClient,
  payload: unknown,
  sessionUserId: string | null,
): AppliedEvent | null {
  const parsed = RealtimeEventSchema.safeParse(payload)
  if (!parsed.success) return null
  const event = parsed.data
  if (event.userId !== undefined && event.userId !== sessionUserId) return null
  const accepted = shouldAcceptEvent({
    eventId: event.eventId,
    kind: event.resource.kind,
    id: event.resource.id,
    version: event.version,
  })
  if (!accepted) return null

  if (event.type === 'nft.updated') {
    return { event, announcements: applyNftUpdated(queryClient, event) }
  }
  applyOrderUpdated(queryClient, event)
  return { event, announcements: [] }
}
