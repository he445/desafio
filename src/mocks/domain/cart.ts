import {
  VALIDATION_MESSAGES,
  type AddCartItemInput,
  type Cart,
  type CartItem,
  type CartMergeAdjustment,
  type CartOwner,
  type Edition,
  type EthAmount,
  type MergeCartResponse,
  type NetworkId,
  type Nft,
  type Quote,
  type QuoteIssue,
  type QuoteLine,
} from '@/contracts'
import {
  calculateFixedDiscount,
  calculatePercentDiscount,
  calculateQuoteTotals,
  compareEth,
  multiplyEth,
} from '@/lib/eth'
import type { MockDb } from '@/mocks/db/schema'
import { getNftById } from './catalog'
import { MockHttpError } from './errors'
import { findEdition } from './inventory'

export const NETWORK_FEES: Record<NetworkId, EthAmount> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}

export const QUOTE_TTL_MS = 10 * 60_000

export function cartStorageKey(owner: CartOwner, guestCartId: string): string {
  return owner.kind === 'user' ? `user:${owner.userId}` : `guest:${guestCartId}`
}

export function getOrCreateCart(db: MockDb, owner: CartOwner, guestCartId?: string): Cart {
  const cartId =
    owner.kind === 'user'
      ? `cart-user-${owner.userId}`
      : guestCartId || `guest-${crypto.randomUUID()}`
  const key = cartStorageKey(owner, cartId)
  const existing = db.carts[key]
  if (existing) return existing

  const fresh: Cart = { id: cartId, owner, items: [], couponCode: null, version: 1 }
  db.carts[key] = fresh
  return fresh
}

function assertQuantityAllowed(edition: Edition, quantity: number): void {
  const maxAllowed = Math.min(edition.available, edition.maxPerOrder)
  if (edition.available > 0 && quantity <= maxAllowed) return
  throw new MockHttpError({
    status: 409,
    code: 'AVAILABILITY_CONFLICT',
    message:
      edition.available <= 0
        ? 'Esta edição está esgotada.'
        : `Limite disponível para esta edição: ${maxAllowed}.`,
    details: { available: edition.available, maxPerOrder: edition.maxPerOrder, maxAllowed },
  })
}

function newCartItem(nft: Nft, edition: Edition, quantity: number, priceWhenAdded: EthAmount) {
  const item: CartItem = {
    id: `ci-${crypto.randomUUID().slice(0, 8)}`,
    nftId: nft.id,
    editionId: edition.id,
    title: nft.title,
    tokenId: nft.tokenId,
    editionName: edition.name,
    image: nft.images[0]?.src ?? '',
    quantity,
    unitPrice: edition.price,
    unitPriceWhenAdded: priceWhenAdded,
    available: edition.available,
    maxPerOrder: edition.maxPerOrder,
    nftVersion: nft.version,
  }
  return item
}

function findCartItem(cart: Cart, itemId: string): CartItem {
  const item = cart.items.find((candidate) => candidate.id === itemId)
  if (!item) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Item não encontrado no carrinho.',
    })
  }
  return item
}

export function addCartItem(
  db: MockDb,
  owner: CartOwner,
  input: AddCartItemInput,
  guestCartId?: string,
): Cart {
  const cart = getOrCreateCart(db, owner, guestCartId)
  const nft = getNftById(db, input.nftId)
  const edition = findEdition(nft, input.editionId)
  const existing = cart.items.find((item) => item.editionId === edition.id)
  const nextQuantity = (existing?.quantity ?? 0) + input.quantity
  assertQuantityAllowed(edition, nextQuantity)

  if (existing) {
    existing.quantity = nextQuantity
  } else {
    cart.items.push(newCartItem(nft, edition, input.quantity, edition.price))
  }
  cart.version += 1
  return cart
}

export function updateCartItemQuantity(
  db: MockDb,
  owner: CartOwner,
  itemId: string,
  quantity: number,
  guestCartId?: string,
): Cart {
  const cart = getOrCreateCart(db, owner, guestCartId)
  const item = findCartItem(cart, itemId)
  assertQuantityAllowed(findEdition(getNftById(db, item.nftId), item.editionId), quantity)

  item.quantity = quantity
  cart.version += 1
  return cart
}

export function removeCartItem(
  db: MockDb,
  owner: CartOwner,
  itemId: string,
  guestCartId?: string,
): Cart {
  const cart = getOrCreateCart(db, owner, guestCartId)
  const item = findCartItem(cart, itemId)
  cart.items = cart.items.filter((candidate) => candidate !== item)
  cart.version += 1
  return cart
}

export function resolveCouponDiscount(
  db: MockDb,
  couponCode: string | null,
  subtotal: EthAmount,
  now = Date.now(),
): { discount: EthAmount; issue?: QuoteIssue } {
  if (!couponCode) return { discount: '0' }
  const coupon = db.coupons[couponCode]
  if (!coupon) {
    return {
      discount: '0',
      issue: { code: 'COUPON_INVALID', message: VALIDATION_MESSAGES.couponInvalid },
    }
  }
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now) {
    return {
      discount: '0',
      issue: { code: 'COUPON_EXPIRED', message: VALIDATION_MESSAGES.couponExpired },
    }
  }
  return {
    discount:
      coupon.kind === 'percent'
        ? calculatePercentDiscount(subtotal, coupon.bps)
        : calculateFixedDiscount(subtotal, coupon.amount, coupon.minSubtotal),
  }
}

export function applyCouponToCart(
  db: MockDb,
  owner: CartOwner,
  rawCode: string,
  guestCartId?: string,
  now = Date.now(),
): Cart {
  const cart = getOrCreateCart(db, owner, guestCartId)
  const code = rawCode.trim().toUpperCase()
  const { issue } = resolveCouponDiscount(db, code, '0', now)
  if (issue) {
    const message = issue.message ?? VALIDATION_MESSAGES.couponInvalid
    throw new MockHttpError({
      status: 422,
      code: issue.code,
      message,
      fieldErrors: { code: [message] },
    })
  }

  cart.couponCode = code
  cart.version += 1
  return cart
}

export function removeCouponFromCart(db: MockDb, owner: CartOwner, guestCartId?: string): Cart {
  const cart = getOrCreateCart(db, owner, guestCartId)
  cart.couponCode = null
  cart.version += 1
  return cart
}

export function mergeGuestCartIntoUserCart(
  db: MockDb,
  userId: string,
  guestCartId: string,
): MergeCartResponse {
  const userCart = getOrCreateCart(db, { kind: 'user', userId })
  const guestKey = cartStorageKey({ kind: 'guest' }, guestCartId)
  const guestCart = db.carts[guestKey]
  const adjustments: CartMergeAdjustment[] = []
  delete db.carts[guestKey]

  if (!guestCart || guestCart.items.length === 0) {
    return { cart: userCart, adjustments }
  }

  for (const guestItem of guestCart.items) {
    const nft = db.nfts.find((candidate) => candidate.id === guestItem.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === guestItem.editionId)
    if (!nft || !edition) continue

    const maxAllowed = Math.min(edition.available, edition.maxPerOrder)
    const existing = userCart.items.find((item) => item.editionId === edition.id)
    const desired = (existing?.quantity ?? 0) + guestItem.quantity
    const finalQuantity = Math.min(desired, maxAllowed)

    if (finalQuantity < desired) {
      adjustments.push({
        nftId: nft.id,
        editionId: edition.id,
        title: nft.title,
        previousQuantity: desired,
        newQuantity: finalQuantity,
        reason: finalQuantity === 0 ? 'removed_sold_out' : 'capped_by_stock',
      })
    }

    if (finalQuantity === 0) {
      userCart.items = userCart.items.filter((item) => item !== existing)
    } else if (existing) {
      existing.quantity = finalQuantity
    } else {
      userCart.items.push(newCartItem(nft, edition, finalQuantity, guestItem.unitPriceWhenAdded))
    }
  }

  userCart.couponCode ??= guestCart.couponCode
  userCart.version += 1
  return { cart: userCart, adjustments }
}

export function createQuoteForCart(
  db: MockDb,
  owner: CartOwner,
  network: NetworkId,
  guestCartId?: string,
  now = Date.now(),
): Quote {
  const cart = getOrCreateCart(db, owner, guestCartId)
  if (cart.items.length === 0) {
    throw new MockHttpError({ status: 409, code: 'CART_EMPTY', message: 'O carrinho está vazio.' })
  }

  const lines: QuoteLine[] = []
  const issues: QuoteIssue[] = []

  for (const item of cart.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
    if (!nft || !edition) {
      issues.push({ code: 'EDITION_SOLD_OUT', nftId: item.nftId, editionId: item.editionId })
      continue
    }

    if (edition.available === 0) {
      issues.push({
        code: 'EDITION_SOLD_OUT',
        nftId: nft.id,
        editionId: edition.id,
        message: `A edição ${edition.name} de ${nft.title} esgotou.`,
      })
    } else if (item.quantity > Math.min(edition.available, edition.maxPerOrder)) {
      issues.push({
        code: 'INSUFFICIENT_STOCK',
        nftId: nft.id,
        editionId: edition.id,
        message: `Restam ${edition.available} unidades de ${nft.title} (${edition.name}).`,
      })
    }

    if (compareEth(edition.price, item.unitPriceWhenAdded) !== 0) {
      issues.push({
        code: 'PRICE_CHANGED',
        nftId: nft.id,
        editionId: edition.id,
        previousPrice: item.unitPriceWhenAdded,
        currentPrice: edition.price,
        message: `Preço mudou de ${item.unitPriceWhenAdded} para ${edition.price} ETH`,
      })
    }

    lines.push({
      nftId: nft.id,
      editionId: edition.id,
      quantity: item.quantity,
      unitPrice: edition.price,
      lineTotal: multiplyEth(edition.price, item.quantity),
      nftVersion: nft.version,
    })
  }

  const lineTotals = lines.map((line) => line.lineTotal)
  const { subtotal } = calculateQuoteTotals({
    lineTotals,
    discount: '0',
    networkFee: NETWORK_FEES[network],
  })
  const coupon = resolveCouponDiscount(db, cart.couponCode, subtotal, now)
  if (coupon.issue) issues.push(coupon.issue)
  const totals = calculateQuoteTotals({
    lineTotals,
    discount: coupon.discount,
    networkFee: NETWORK_FEES[network],
  })

  const quote: Quote = {
    id: `quote-${crypto.randomUUID().slice(0, 8)}`,
    cartVersion: cart.version,
    network,
    couponCode: cart.couponCode,
    lines,
    ...totals,
    issues,
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }

  db.quotes[quote.id] = quote
  return quote
}
