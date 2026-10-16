import { describe, expect, it } from 'vitest'
import type { CreateOrderInput } from '@/contracts'
import { createSeedDb } from '@/mocks/db/seed'
import { addCartItem, createQuoteForCart } from '@/mocks/domain/cart'
import { createOrderFromQuote, createWalletConnection } from '@/mocks/domain/orders'
import { disruptFirstOrder, settlementOutcome } from './checkout'

const MARINA = 'user-marina'

function prepareOrder() {
  const db = createSeedDb()
  const owner = { kind: 'user', userId: MARINA } as const
  addCartItem(db, owner, {
    nftId: 'golden-beat-207',
    editionId: 'golden-beat-207-1-50',
    quantity: 1,
  })
  const quote = createQuoteForCart(db, owner, 'ethereum')
  const { connectionId } = createWalletConnection(db, MARINA, {
    walletId: 'wallet-marina-primary',
    network: 'ethereum',
    provider: 'metamask',
  })
  const input: CreateOrderInput = {
    quoteId: quote.id,
    connectionId,
    buyer: {
      displayName: 'Marina Costa',
      username: 'marina',
      profileName: 'marina',
      email: 'marina@nftmarket.test',
      ensName: 'nova.kurio',
      referralCode: 'KURIO-2048',
      note: null,
    },
  }
  return { db, input }
}

describe('checkout scenarios', () => {
  it('price-change-checkout outdates only the first order attempt', async () => {
    const { db, input } = prepareOrder()
    const [changed] = disruptFirstOrder(db, MARINA, input, 'price-change-checkout')
    expect(changed?.editions.find((edition) => edition.id === 'golden-beat-207-1-50')?.price).toBe(
      '1.14',
    )

    const failure = await createOrderFromQuote(db, MARINA, 'k1', input).catch((error) => error)
    expect(failure).toMatchObject({ code: 'QUOTE_OUTDATED' })

    const retry = { ...input, quoteId: failure.details.quote.id }
    expect(disruptFirstOrder(db, MARINA, retry, 'price-change-checkout')).toEqual([])
    await expect(createOrderFromQuote(db, MARINA, 'k2', retry)).resolves.toMatchObject({
      reused: false,
    })
  })

  it('sold-out-checkout empties the first quoted edition before validation', async () => {
    const { db, input } = prepareOrder()
    disruptFirstOrder(db, MARINA, input, 'sold-out-checkout')
    await expect(createOrderFromQuote(db, MARINA, 'k1', input)).rejects.toMatchObject({
      code: 'AVAILABILITY_CONFLICT',
    })
  })

  it('wallet-disconnect drops the connection once', async () => {
    const { db, input } = prepareOrder()
    disruptFirstOrder(db, MARINA, input, 'wallet-disconnect')
    await expect(createOrderFromQuote(db, MARINA, 'k1', input)).rejects.toMatchObject({
      code: 'WALLET_DISCONNECTED',
    })

    const { connectionId } = createWalletConnection(db, MARINA, {
      walletId: 'wallet-marina-primary',
      network: 'ethereum',
      provider: 'metamask',
    })
    const reconnected = { ...input, connectionId }
    disruptFirstOrder(db, MARINA, reconnected, 'wallet-disconnect')
    await expect(createOrderFromQuote(db, MARINA, 'k2', reconnected)).resolves.toMatchObject({
      reused: false,
    })
  })

  it('payment-declined settles as insufficient funds', () => {
    expect(settlementOutcome('payment-declined')).toEqual({
      status: 'rejected',
      rejectionReason: 'insufficient_funds',
    })
    expect(settlementOutcome('default').status).toBe('confirmed')
  })
})
