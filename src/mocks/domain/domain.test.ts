import { describe, expect, it } from 'vitest'
import { createSeedDb, MARINA_PASSWORD_HASH, MARINA_PASSWORD_SALT } from '@/mocks/db/seed'
import { hashPassword } from './crypto'
import { changeNftEdition, getFeaturedNfts, queryNfts } from './catalog'
import {
  addCartItem,
  applyCouponToCart,
  createQuoteForCart,
  mergeGuestCartIntoUserCart,
} from './cart'
import { createOrderFromQuote, createWalletConnection, transitionOrderState } from './orders'
import { loginUser, registerUser } from './session'

describe('mock domain', () => {
  it('verifies precomputed seed password hash matches Web Crypto PBKDF2', async () => {
    const computed = await hashPassword('Senha@1234', MARINA_PASSWORD_SALT)
    expect(computed).toBe(MARINA_PASSWORD_HASH)
  })

  it('seeds 48 NFTs with 6 featured, 12 trending, 8 rare, 6 collections, 9 categories, and 3 networks', () => {
    const db = createSeedDb('default')
    expect(db.nfts.length).toBe(48)
    expect(getFeaturedNfts(db).length).toBe(6)
    expect(db.nfts.filter((n) => n.trending).length).toBe(12)
    expect(db.nfts.filter((n) => n.rare).length).toBe(8)

    const result = queryNfts(db, { page: 1, pageSize: 9 })
    expect(result.items.length).toBe(9)
    expect(result.items[0]?.id).toBe('emerald-ape-042')
    expect(Object.keys(result.facets.categories).length).toBe(9)
    expect(Object.keys(result.facets.networks).length).toBe(3)
    expect(Object.keys(result.facets.collections).length).toBe(6)
  })

  it('registers, logs in, merges guest cart, applies coupon, creates idempotent order, and subtracts only bought items on confirmation', async () => {
    const db = createSeedDb('default')
    const auth = await loginUser(db, {
      email: 'marina@nftmarket.test',
      password: 'Senha@1234',
    })
    expect(auth.user.username).toBe('marina')

    // Guest adds 2 units of Emerald Ape #042 (1/50)
    addCartItem(
      db,
      { kind: 'guest' },
      {
        nftId: 'emerald-ape-042',
        editionId: 'emerald-ape-042-1-50',
        quantity: 2,
      },
      'guest-123',
    )
    applyCouponToCart(db, { kind: 'guest' }, 'BEMVINDO10', 'guest-123')

    const merged = mergeGuestCartIntoUserCart(db, auth.user.id, 'guest-123')
    expect(merged.cart.items.length).toBe(1)
    expect(merged.cart.items[0]?.quantity).toBe(2)
    expect(merged.cart.couponCode).toBe('BEMVINDO10')

    const quote = createQuoteForCart(db, { kind: 'user', userId: auth.user.id }, 'ethereum')
    expect(quote.subtotal).toBe('2.38')
    expect(quote.discount).toBe('0.238')
    expect(quote.networkFee).toBe('0.016')
    expect(quote.total).toBe('2.158')

    // Add an extra item to cart AFTER quote is created (should not invalidate quote and should survive confirmation)
    addCartItem(
      db,
      { kind: 'user', userId: auth.user.id },
      {
        nftId: 'sage-nomad-009',
        editionId: 'sage-nomad-009-1-50',
        quantity: 1,
      },
    )

    const conn = createWalletConnection(db, auth.user.id, {
      walletId: 'wallet-marina-primary',
      network: 'ethereum',
      provider: 'metamask',
    })

    const buyer = {
      displayName: 'Marina Costa',
      username: 'marina',
      profileName: 'marina',
      email: 'marina@nftmarket.test',
      ensName: 'nova.kurio',
      referralCode: 'KURIO-2048',
      note: null,
    }

    const firstAttempt = await createOrderFromQuote(db, auth.user.id, 'idem-key-1', {
      quoteId: quote.id,
      connectionId: conn.connectionId,
      buyer,
    })
    expect(firstAttempt.reused).toBe(false)
    expect(firstAttempt.order.status).toBe('pending')

    // Retry with same idempotency key returns same order
    const secondAttempt = await createOrderFromQuote(db, auth.user.id, 'idem-key-1', {
      quoteId: quote.id,
      connectionId: conn.connectionId,
      buyer,
    })
    expect(secondAttempt.reused).toBe(true)
    expect(secondAttempt.order.id).toBe(firstAttempt.order.id)

    // Confirm order: only the quoted item is subtracted from cart; extra item remains
    const confirmed = transitionOrderState(db, firstAttempt.order.id, 'confirmed')
    expect(confirmed?.order.status).toBe('confirmed')
    expect(confirmed?.order.transaction?.hash).toMatch(/^0x[a-f0-9]{64}$/)

    // Subsequent transition on terminal order is ignored
    expect(transitionOrderState(db, firstAttempt.order.id, 'rejected')).toBeNull()

    const userCartAfter = db.carts[`user:${auth.user.id}`]!
    expect(userCartAfter.items.length).toBe(1)
    expect(userCartAfter.items[0]?.nftId).toBe('sage-nomad-009')

    // Catalog price change does not alter receipt snapshot
    changeNftEdition(db, {
      nftId: 'emerald-ape-042',
      editionId: 'emerald-ape-042-1-50',
      price: '9.99',
    })
    expect(db.orders[firstAttempt.order.id]?.receipt.lines[0]?.unitPrice).toBe('1.19')
  })

  it('rejects duplicate email on registration', async () => {
    const db = createSeedDb('default')
    await expect(
      registerUser(db, {
        username: 'nova',
        email: 'marina@nftmarket.test',
        password: 'Password123',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
    })
  })
})
