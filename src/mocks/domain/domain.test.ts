import { describe, expect, it } from 'vitest'
import type { Buyer, CartOwner, CreateOrderInput } from '@/contracts'
import { formatEth, parseEth } from '@/lib/eth'
import type { MockDb } from '@/mocks/db/schema'
import {
  createSeedDb,
  MARINA_PASSWORD_HASH,
  MARINA_PASSWORD_SALT,
  RAFAEL_PASSWORD_HASH,
  RAFAEL_PASSWORD_SALT,
} from '@/mocks/db/seed'
import { createWalletForUser } from './account'
import {
  addCartItem,
  applyCouponToCart,
  createQuoteForCart,
  getOrCreateCart,
  mergeGuestCartIntoUserCart,
  removeCouponFromCart,
} from './cart'
import { getFeaturedNfts, getNftById, queryNfts } from './catalog'
import { hashPassword } from './crypto'
import { getFavoritesForUser } from './favorites'
import { changeNftEdition } from './inventory'
import {
  createOrderFromQuote,
  createWalletConnection,
  deleteWalletConnection,
  planSettlement,
  settleDueOrders,
  transitionOrderState,
} from './orders'
import { getAuthenticatedUser, loginUser, registerUser } from './session'

const MARINA = 'user-marina'
const marinaCart: CartOwner = { kind: 'user', userId: MARINA }
const buyer: Buyer = {
  displayName: 'Marina Costa',
  username: 'marina',
  profileName: 'marina',
  email: 'marina@nftmarket.test',
  ensName: 'nova.kurio',
  referralCode: 'KURIO-2048',
  note: null,
}

function editionOf(db: MockDb, editionId: string) {
  const nft = db.nfts.find((candidate) => candidate.editions.some((e) => e.id === editionId))!
  return { nft, edition: nft.editions.find((e) => e.id === editionId)! }
}

function checkout(db: MockDb, quantity = 2) {
  addCartItem(db, marinaCart, {
    nftId: 'emerald-ape-042',
    editionId: 'emerald-ape-042-1-50',
    quantity,
  })
  const quote = createQuoteForCart(db, marinaCart, 'ethereum')
  const connection = createWalletConnection(db, MARINA, {
    walletId: 'wallet-marina-primary',
    network: 'ethereum',
    provider: 'metamask',
  })
  const input: CreateOrderInput = {
    quoteId: quote.id,
    connectionId: connection.connectionId,
    buyer,
  }
  return { quote, connection, input }
}

describe('seed', () => {
  it('stores PBKDF2 hashes that match Senha@1234', async () => {
    expect(await hashPassword('Senha@1234', MARINA_PASSWORD_SALT)).toBe(MARINA_PASSWORD_HASH)
    expect(await hashPassword('Senha@1234', RAFAEL_PASSWORD_SALT)).toBe(RAFAEL_PASSWORD_HASH)
  })

  it('has the catalog shape the scenarios rely on', () => {
    const db = createSeedDb()
    const all = queryNfts(db, { pageSize: 48 })
    expect(db.nfts).toHaveLength(48)
    expect(
      getFeaturedNfts(db)
        .map((nft) => nft.id)
        .slice(0, 4),
    ).toEqual(['emerald-ape-042', 'ivory-baron-088', 'golden-beat-207', 'sage-nomad-009'])
    expect(getFeaturedNfts(db)).toHaveLength(6)
    expect(db.nfts.filter((nft) => nft.trending)).toHaveLength(12)
    expect(db.nfts.filter((nft) => nft.rare)).toHaveLength(8)
    expect(Object.keys(all.facets.categories)).toHaveLength(9)
    expect(Object.keys(all.facets.networks)).toHaveLength(3)
    expect(Object.keys(all.facets.collections)).toHaveLength(6)
    expect(all.facets.priceRange).toEqual({ min: '0.02', max: '12.3' })
    expect(new Set(db.nfts.map((nft) => nft.editions.length))).toEqual(new Set([1, 2, 3, 4]))
    expect(db.nfts.some((nft) => nft.editions.every((edition) => edition.available === 0))).toBe(
      true,
    )
  })

  it('lists the nine Figma NFTs first under "recent", in the Figma order', () => {
    const page = queryNfts(createSeedDb(), { sort: 'recent', page: 1, pageSize: 9 })
    expect(page.items.map((nft) => nft.title)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #009',
      'Neon Vessel #552',
      'Cosmic Bloom #118',
      'Violet Nomad #314',
      'Ivory Baron #088',
      'Golden Beat #207',
      'Golden Pulse #188',
      'Golden Signal #160',
    ])
    expect(page.items[0]?.editions.map((edition) => edition.name)).toEqual([
      '1/1',
      '1/10',
      '1/50',
      'ABERTA',
    ])
  })

  it('round-trips every ETH amount of the fixtures through bigint', () => {
    const db = createSeedDb()
    const amounts = [
      ...db.nfts.flatMap((nft) => [
        nft.priceFrom,
        ...(nft.compareAtPrice ? [nft.compareAtPrice] : []),
        ...nft.editions.map((edition) => edition.price),
      ]),
      ...Object.values(db.coupons).flatMap((coupon) =>
        coupon.kind === 'fixed' ? [coupon.amount, coupon.minSubtotal] : [],
      ),
      ...Object.values(db.orders).flatMap((order) => [
        order.receipt.subtotal,
        order.receipt.total,
        order.receipt.networkFee,
      ]),
    ]
    for (const amount of amounts) expect(formatEth(parseEth(amount))).toBe(amount)
  })

  it('reports favorites only for NFTs that exist', () => {
    const favorites = getFavoritesForUser(createSeedDb({ emptyCatalog: true }), MARINA)
    expect(favorites).toEqual({ nftIds: [], items: [] })
  })
})

describe('session', () => {
  it('rejects a taken e-mail and a reserved username with field errors', async () => {
    const db = createSeedDb()
    await expect(
      registerUser(db, { username: 'nova', email: 'MARINA@nftmarket.test', password: 'Senha1234' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      fieldErrors: { email: [expect.any(String)] },
    })
    await expect(
      registerUser(db, { username: 'Admin', email: 'nova@nftmarket.test', password: 'Senha1234' }),
    ).rejects.toMatchObject({ status: 409, code: 'USERNAME_TAKEN' })
  })

  it('issues sessions with the requested TTL and flags them once expired', async () => {
    const db = createSeedDb()
    const now = Date.parse('2026-10-15T12:00:00Z')
    const auth = await loginUser(
      db,
      { email: 'marina@nftmarket.test', password: 'Senha@1234' },
      { now, ttlMs: 60_000 },
    )
    const header = `Bearer ${auth.session.token}`
    expect(getAuthenticatedUser(db, header, now + 59_000).user.id).toBe(MARINA)
    expect(() => getAuthenticatedUser(db, header, now + 60_000)).toThrow(
      expect.objectContaining({ code: 'SESSION_EXPIRED' }),
    )
    expect(() => getAuthenticatedUser(db, 'Bearer unknown')).toThrow(
      expect.objectContaining({ code: 'UNAUTHENTICATED' }),
    )
  })
})

describe('cart and quote', () => {
  it('gives each guest without an id a cart of its own', () => {
    const db = createSeedDb()
    const first = getOrCreateCart(db, { kind: 'guest' })
    const second = getOrCreateCart(db, { kind: 'guest' })
    expect(first.id).not.toBe(second.id)
    expect(getOrCreateCart(db, { kind: 'guest' }, first.id)).toBe(first)
  })

  it('merges the guest cart capped by stock and keeps the coupon', () => {
    const db = createSeedDb()
    const guest = { kind: 'guest' } as const
    addCartItem(
      db,
      guest,
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-10', quantity: 2 },
      'g1',
    )
    applyCouponToCart(db, guest, 'bemvindo10', 'g1')
    addCartItem(db, marinaCart, {
      nftId: 'emerald-ape-042',
      editionId: 'emerald-ape-042-1-10',
      quantity: 1,
    })

    const merged = mergeGuestCartIntoUserCart(db, MARINA, 'g1')
    expect(merged.cart.items[0]?.quantity).toBe(2)
    expect(merged.cart.couponCode).toBe('BEMVINDO10')
    expect(merged.adjustments).toEqual([
      expect.objectContaining({ previousQuantity: 3, newQuantity: 2, reason: 'capped_by_stock' }),
    ])
    expect(db.carts['guest:g1']).toBeUndefined()
  })

  it('prices the quote on the server and answers 409 CART_EMPTY for an empty cart', () => {
    const db = createSeedDb()
    expect(() => createQuoteForCart(db, marinaCart, 'ethereum')).toThrow(
      expect.objectContaining({ status: 409, code: 'CART_EMPTY' }),
    )

    const { quote } = checkout(db)
    applyCouponToCart(db, marinaCart, 'BEMVINDO10')
    const withCoupon = createQuoteForCart(db, marinaCart, 'polygon')
    expect(quote).toMatchObject({
      subtotal: '2.38',
      discount: '0',
      networkFee: '0.016',
      total: '2.396',
    })
    expect(withCoupon).toMatchObject({ discount: '0.238', networkFee: '0.002', total: '2.144' })
  })

  it('reports a price change against the price seen when the item was added', () => {
    const db = createSeedDb()
    checkout(db, 1)
    const { nft } = editionOf(db, 'emerald-ape-042-1-50')
    changeNftEdition(db, nft, { editionId: 'emerald-ape-042-1-50', price: '1.190' })
    expect(createQuoteForCart(db, marinaCart, 'ethereum').issues).toEqual([])

    changeNftEdition(db, nft, { editionId: 'emerald-ape-042-1-50', price: '1.25' })
    expect(createQuoteForCart(db, marinaCart, 'ethereum').issues).toEqual([
      expect.objectContaining({
        code: 'PRICE_CHANGED',
        previousPrice: '1.19',
        currentPrice: '1.25',
      }),
    ])
  })
})

describe('orders', () => {
  it('returns the same order for a repeated key and rejects the key with another body', async () => {
    const db = createSeedDb()
    const { input } = checkout(db)
    const first = await createOrderFromQuote(db, MARINA, 'key-1', input)
    const retry = await createOrderFromQuote(db, MARINA, 'key-1', input)
    expect(retry).toMatchObject({ reused: true, order: { id: first.order.id } })
    await expect(
      createOrderFromQuote(db, MARINA, 'key-1', { ...input, buyer: { ...buyer, note: 'outra' } }),
    ).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_KEY_REUSED' })
  })

  it('reserves stock on creation, returns it on rejection and ignores later transitions', async () => {
    const db = createSeedDb()
    const { input } = checkout(db)
    const { order } = await createOrderFromQuote(db, MARINA, 'key-1', input)
    expect(editionOf(db, 'emerald-ape-042-1-50').edition.available).toBe(10)

    expect(transitionOrderState(db, order.id, 'rejected')?.order.status).toBe('rejected')
    expect(editionOf(db, 'emerald-ape-042-1-50').edition.available).toBe(12)
    expect(transitionOrderState(db, order.id, 'confirmed')).toBeNull()
    expect(getOrCreateCart(db, marinaCart).items).toHaveLength(1)
  })

  it('keeps items added after the quote and snapshots the receipt', async () => {
    const db = createSeedDb()
    const { input } = checkout(db)
    addCartItem(db, marinaCart, {
      nftId: 'sage-nomad-009',
      editionId: 'sage-nomad-009-1-50',
      quantity: 1,
    })
    const { order } = await createOrderFromQuote(db, MARINA, 'key-1', input)

    const confirmed = transitionOrderState(db, order.id, 'confirmed')
    expect(confirmed?.order.transaction?.hash).toMatch(/^0x[a-f0-9]{64}$/)
    expect(confirmed?.order.transaction?.explorerUrl).toContain('https://etherscan.io/tx/0x')
    expect(getOrCreateCart(db, marinaCart).items.map((item) => item.nftId)).toEqual([
      'sage-nomad-009',
    ])

    changeNftEdition(db, getNftById(db, 'emerald-ape-042'), {
      editionId: 'emerald-ape-042-1-50',
      price: '9.99',
    })
    expect(db.orders[order.id]?.receipt.lines[0]?.unitPrice).toBe('1.19')
  })

  it('answers QUOTE_OUTDATED with a fresh quote when price, coupon or network changed', async () => {
    const changed = createSeedDb()
    const priceCase = checkout(changed)
    changeNftEdition(changed, getNftById(changed, 'emerald-ape-042'), {
      editionId: 'emerald-ape-042-1-50',
      price: '1.29',
    })
    await expect(createOrderFromQuote(changed, MARINA, 'k', priceCase.input)).rejects.toMatchObject(
      {
        code: 'QUOTE_OUTDATED',
        details: { quote: expect.objectContaining({ subtotal: '2.58' }) },
      },
    )

    const couponDb = createSeedDb()
    applyCouponToCart(couponDb, marinaCart, 'BEMVINDO10')
    const couponCase = checkout(couponDb)
    removeCouponFromCart(couponDb, marinaCart)
    await expect(
      createOrderFromQuote(couponDb, MARINA, 'k', couponCase.input),
    ).rejects.toMatchObject({
      code: 'QUOTE_OUTDATED',
    })

    const networkDb = createSeedDb()
    const networkCase = checkout(networkDb)
    const polygon = createWalletConnection(networkDb, MARINA, {
      walletId: 'wallet-marina-secondary',
      network: 'polygon',
      provider: 'coinbase',
    })
    await expect(
      createOrderFromQuote(networkDb, MARINA, 'k', {
        ...networkCase.input,
        connectionId: polygon.connectionId,
      }),
    ).rejects.toMatchObject({
      code: 'QUOTE_OUTDATED',
      details: { quote: expect.objectContaining({ network: 'polygon', networkFee: '0.002' }) },
    })
  })

  it('answers AVAILABILITY_CONFLICT when the stock dropped below the quoted quantity', async () => {
    const db = createSeedDb()
    const { input } = checkout(db)
    changeNftEdition(db, getNftById(db, 'emerald-ape-042'), {
      editionId: 'emerald-ape-042-1-50',
      available: 1,
    })
    await expect(createOrderFromQuote(db, MARINA, 'k', input)).rejects.toMatchObject({
      status: 409,
      code: 'AVAILABILITY_CONFLICT',
    })
  })

  it('settles only the orders that are due', async () => {
    const db = createSeedDb()
    const { input } = checkout(db)
    const { order } = await createOrderFromQuote(db, MARINA, 'key-1', input)
    const now = Date.now()
    planSettlement(db, {
      orderId: order.id,
      dueAt: new Date(now + 1500).toISOString(),
      status: 'confirmed',
      rejectionReason: null,
    })

    expect(settleDueOrders(db, now + 1000)).toEqual([])
    expect(settleDueOrders(db, now + 1500).map(({ order: settled }) => settled.status)).toEqual([
      'confirmed',
    ])
    expect(db.settlements).toEqual({})
  })
})

describe('wallets', () => {
  it('connects a wallet only on its own network and only its owner disconnects it', async () => {
    const db = createSeedDb()
    expect(() =>
      createWalletConnection(db, MARINA, {
        walletId: 'wallet-marina-primary',
        network: 'polygon',
        provider: 'metamask',
      }),
    ).toThrow(
      expect.objectContaining({ status: 422, fieldErrors: { network: [expect.any(String)] } }),
    )

    const connection = createWalletConnection(db, MARINA, {
      walletId: 'wallet-marina-primary',
      network: 'ethereum',
      provider: 'metamask',
    })
    expect(() => deleteWalletConnection(db, 'user-rafael', connection.connectionId)).toThrow(
      expect.objectContaining({ status: 403 }),
    )
    deleteWalletConnection(db, MARINA, connection.connectionId)
    expect(db.walletConnections[connection.connectionId]).toBeUndefined()
  })

  it('compares EVM addresses without case and Solana addresses with case', () => {
    const db = createSeedDb()
    const holder = {
      displayName: 'Rafael Mendes',
      profileName: 'rafael',
      email: 'rafael@nftmarket.test',
      ensName: 'rafael',
      referralCode: 'KURIO-7712',
    }
    const solana = 'So1anaWa11etAddressXXXXXXXXXXXXXXXXXXXXXXX'
    createWalletForUser(db, 'user-rafael', {
      label: 'Sol',
      address: solana,
      ens: null,
      network: 'solana',
      provider: 'walletconnect',
      role: 'primary',
      holder,
    })
    expect(() =>
      createWalletForUser(db, 'user-rafael', {
        label: 'Sol 2',
        address: solana.toLowerCase(),
        ens: null,
        network: 'solana',
        provider: 'walletconnect',
        role: 'secondary',
        holder,
      }),
    ).not.toThrow()

    expect(() =>
      createWalletForUser(db, MARINA, {
        label: 'Cópia',
        address: '0xa91f3b7c2d9e0f4a6b8c1d3e5f7a9b0c2d4ee82c',
        ens: null,
        network: 'polygon',
        provider: 'metamask',
        role: 'secondary',
        holder,
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'WALLET_CONFLICT',
        fieldErrors: { address: [expect.any(String)] },
      }),
    )
  })
})
