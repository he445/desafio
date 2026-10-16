import {
  VALIDATION_MESSAGES,
  type AddCartItemInput,
  type Cart,
  type CartMergeAdjustment,
  type CartOwner,
  type EthAmount,
  type MergeCartResponse,
  type NetworkId,
  type Quote,
  type QuoteIssue,
  type QuoteLine,
} from '@/contracts'
import {
  calculateFixedDiscount,
  calculatePercentDiscount,
  calculateQuoteTotals,
  multiplyEth,
} from '@/lib/eth'
import type { MockDb } from '@/mocks/db/schema'
import { getNftById } from './catalog'
import { MockHttpError } from './errors'

export const NETWORK_FEES: Record<NetworkId, EthAmount> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}

export function cartStorageKey(owner: CartOwner, guestCartId?: string): string {
  if (owner.kind === 'user') {
    return `user:${owner.userId}`
  }
  return `guest:${guestCartId ?? 'anonymous'}`
}

export function syncCartWithCatalog(db: MockDb, cart: Cart): Cart {
  for (const item of cart.items) {
    const nft = db.nfts.find((n) => n.id === item.nftId)
    const edition = nft?.editions.find((e) => e.id === item.editionId)
    if (nft && edition) {
      item.unitPrice = edition.price
      item.available = edition.available
      item.nftVersion = nft.version
    }
  }
  return cart
}

export function getOrCreateCart(db: MockDb, owner: CartOwner, guestCartId?: string): Cart {
  const key = cartStorageKey(owner, guestCartId)
  const existing = db.carts[key]
  if (existing) {
    return syncCartWithCatalog(db, existing)
  }

  const cartId =
    owner.kind === 'user'
      ? `cart-user-${owner.userId}`
      : guestCartId || `guest-${crypto.randomUUID()}`

  const fresh: Cart = {
    id: cartId,
    owner,
    items: [],
    couponCode: null,
    version: 1,
  }
  db.carts[key] = fresh
  return fresh
}

export function addCartItem(
  db: MockDb,
  owner: CartOwner,
  input: AddCartItemInput,
  guestCartId?: string,
): Cart {
  const cart = getOrCreateCart(db, owner, guestCartId)
  const nft = getNftById(db, input.nftId)
  const edition = nft.editions.find((ed) => ed.id === input.editionId)
  if (!edition) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Edição não encontrada.',
    })
  }

  const maxAllowed = Math.min(edition.available, edition.maxPerOrder)
  const existingItem = cart.items.find((it) => it.nftId === nft.id && it.editionId === edition.id)
  const currentQty = existingItem?.quantity ?? 0
  const nextQty = currentQty + input.quantity

  if (edition.available <= 0 || nextQty > maxAllowed) {
    throw new MockHttpError({
      status: 409,
      code: 'AVAILABILITY_CONFLICT',
      message:
        edition.available <= 0
          ? 'Esta edição está esgotada.'
          : `Limite disponível para esta edição: ${maxAllowed}.`,
      details: {
        available: edition.available,
        maxPerOrder: edition.maxPerOrder,
        maxAllowed,
      },
    })
  }

  if (existingItem) {
    existingItem.quantity = nextQty
    existingItem.unitPrice = edition.price
    existingItem.available = edition.available
    existingItem.nftVersion = nft.version
  } else {
    cart.items.push({
      id: `ci-${crypto.randomUUID().slice(0, 8)}`,
      nftId: nft.id,
      editionId: edition.id,
      quantity: input.quantity,
      unitPrice: edition.price,
      unitPriceWhenAdded: edition.price,
      available: edition.available,
      nftVersion: nft.version,
    })
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
  const item = cart.items.find((it) => it.id === itemId)
  if (!item) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Item não encontrado no carrinho.',
    })
  }

  const nft = getNftById(db, item.nftId)
  const edition = nft.editions.find((ed) => ed.id === item.editionId)
  if (!edition) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Edição não encontrada.',
    })
  }

  const maxAllowed = Math.min(edition.available, edition.maxPerOrder)
  if (edition.available <= 0 || quantity > maxAllowed) {
    throw new MockHttpError({
      status: 409,
      code: 'AVAILABILITY_CONFLICT',
      message:
        edition.available <= 0
          ? 'Esta edição está esgotada.'
          : `Limite disponível para esta edição: ${maxAllowed}.`,
      details: {
        available: edition.available,
        maxPerOrder: edition.maxPerOrder,
        maxAllowed,
      },
    })
  }

  item.quantity = quantity
  item.unitPrice = edition.price
  item.available = edition.available
  item.nftVersion = nft.version
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
  const idx = cart.items.findIndex((it) => it.id === itemId)
  if (idx === -1) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Item não encontrado no carrinho.',
    })
  }
  cart.items.splice(idx, 1)
  cart.version += 1
  return cart
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
  const coupon = db.coupons[code]
  if (!coupon) {
    throw new MockHttpError({
      status: 422,
      code: 'COUPON_INVALID',
      message: VALIDATION_MESSAGES.couponInvalid,
      fieldErrors: { code: [VALIDATION_MESSAGES.couponInvalid] },
    })
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now) {
    throw new MockHttpError({
      status: 422,
      code: 'COUPON_EXPIRED',
      message: VALIDATION_MESSAGES.couponExpired,
      fieldErrors: { code: [VALIDATION_MESSAGES.couponExpired] },
    })
  }

  cart.couponCode = coupon.code
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
  const guestKey = `guest:${guestCartId}`
  const guestCart = db.carts[guestKey]
  const adjustments: CartMergeAdjustment[] = []

  if (!guestCart || guestCart.items.length === 0) {
    delete db.carts[guestKey]
    return { cart: userCart, adjustments }
  }

  for (const guestItem of guestCart.items) {
    const nft = db.nfts.find((n) => n.id === guestItem.nftId)
    const edition = nft?.editions.find((e) => e.id === guestItem.editionId)
    if (!nft || !edition) continue

    const maxAllowed = Math.min(edition.available, edition.maxPerOrder)
    const existing = userCart.items.find((it) => it.nftId === nft.id && it.editionId === edition.id)
    const desiredQty = (existing?.quantity ?? 0) + guestItem.quantity

    if (maxAllowed <= 0) {
      if (existing) {
        userCart.items = userCart.items.filter((it) => it.id !== existing.id)
      }
      adjustments.push({
        nftId: nft.id,
        editionId: edition.id,
        title: nft.title,
        previousQuantity: desiredQty,
        newQuantity: 0,
        reason: 'removed_sold_out',
      })
      continue
    }

    const finalQty = Math.min(desiredQty, maxAllowed)
    if (finalQty < desiredQty) {
      adjustments.push({
        nftId: nft.id,
        editionId: edition.id,
        title: nft.title,
        previousQuantity: desiredQty,
        newQuantity: finalQty,
        reason: 'capped_by_stock',
      })
    }

    if (existing) {
      existing.quantity = finalQty
      existing.unitPrice = edition.price
      existing.available = edition.available
      existing.nftVersion = nft.version
    } else {
      userCart.items.push({
        id: `ci-${crypto.randomUUID().slice(0, 8)}`,
        nftId: nft.id,
        editionId: edition.id,
        quantity: finalQty,
        unitPrice: edition.price,
        unitPriceWhenAdded: guestItem.unitPriceWhenAdded,
        available: edition.available,
        nftVersion: nft.version,
      })
    }
  }

  if (!userCart.couponCode && guestCart.couponCode) {
    userCart.couponCode = guestCart.couponCode
  }

  delete db.carts[guestKey]
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
    throw new MockHttpError({
      status: 409,
      code: 'BAD_REQUEST',
      message: 'O carrinho está vazio.',
    })
  }

  const lines: QuoteLine[] = []
  const issues: QuoteIssue[] = []

  for (const item of cart.items) {
    const nft = getNftById(db, item.nftId)
    const edition = nft.editions.find((ed) => ed.id === item.editionId)
    if (!edition) {
      issues.push({
        code: 'EDITION_SOLD_OUT',
        nftId: nft.id,
        editionId: item.editionId,
        message: `${nft.title} não está mais disponível.`,
      })
      continue
    }

    const maxAllowed = Math.min(edition.available, edition.maxPerOrder)
    if (edition.available === 0) {
      issues.push({
        code: 'EDITION_SOLD_OUT',
        nftId: nft.id,
        editionId: edition.id,
        message: `A edição ${edition.name} de ${nft.title} esgotou.`,
      })
    } else if (item.quantity > maxAllowed) {
      issues.push({
        code: 'INSUFFICIENT_STOCK',
        nftId: nft.id,
        editionId: edition.id,
        message: `Restam ${edition.available} unidades de ${nft.title} (${edition.name}).`,
      })
    }

    if (edition.price !== item.unitPriceWhenAdded) {
      issues.push({
        code: 'PRICE_CHANGED',
        nftId: nft.id,
        editionId: edition.id,
        previousPrice: item.unitPriceWhenAdded,
        currentPrice: edition.price,
        message: `Preço mudou de ${item.unitPriceWhenAdded} para ${edition.price} ETH`,
      })
    }

    const lineTotal = multiplyEth(edition.price, item.quantity)
    lines.push({
      nftId: nft.id,
      editionId: edition.id,
      quantity: item.quantity,
      unitPrice: edition.price,
      lineTotal,
      nftVersion: nft.version,
    })
  }

  const lineTotals = lines.map((l) => l.lineTotal)
  const initialTotals = calculateQuoteTotals({
    lineTotals,
    discount: '0',
    networkFee: NETWORK_FEES[network],
  })

  let discount: EthAmount = '0'
  if (cart.couponCode) {
    const coupon = db.coupons[cart.couponCode]
    if (!coupon) {
      issues.push({
        code: 'COUPON_INVALID',
        message: VALIDATION_MESSAGES.couponInvalid,
      })
    } else if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now) {
      issues.push({
        code: 'COUPON_EXPIRED',
        message: VALIDATION_MESSAGES.couponExpired,
      })
    } else if (coupon.kind === 'percent') {
      discount = calculatePercentDiscount(initialTotals.subtotal, coupon.bps)
    } else {
      discount = calculateFixedDiscount(initialTotals.subtotal, coupon.amount, coupon.minSubtotal)
    }
  }

  const finalTotals = calculateQuoteTotals({
    lineTotals,
    discount,
    networkFee: NETWORK_FEES[network],
  })

  const quote: Quote = {
    id: `quote-${crypto.randomUUID().slice(0, 8)}`,
    cartVersion: cart.version,
    network,
    couponCode: cart.couponCode,
    lines,
    subtotal: finalTotals.subtotal,
    discount: finalTotals.discount,
    networkFee: finalTotals.networkFee,
    total: finalTotals.total,
    issues,
    expiresAt: new Date(now + 10 * 60_000).toISOString(),
  }

  db.quotes[quote.id] = quote
  return quote
}
