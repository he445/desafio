import {
  CartSchema,
  MergeCartResponseSchema,
  QuoteSchema,
  type AddCartItemInput,
  type ApplyCouponInput,
  type Cart,
  type CreateQuoteInput,
  type MergeCartInput,
  type MergeCartResponse,
  type Quote,
  type UpdateCartItemInput,
} from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'
import { recordResourceVersion } from '@/features/realtime/event-ledger'

function recordCartVersions(cart: Cart): Cart {
  for (const item of cart.items) {
    recordResourceVersion('nft', item.nftId, item.nftVersion)
  }
  return cart
}

export async function fetchCartApi(opts?: { signal?: AbortSignal }): Promise<Cart> {
  const response = await http.get('/cart', { signal: opts?.signal })
  return recordCartVersions(parseApiResponse(CartSchema, response.data))
}

export async function addCartItemApi(input: AddCartItemInput): Promise<Cart> {
  const response = await http.post('/cart/items', input)
  return recordCartVersions(parseApiResponse(CartSchema, response.data))
}

export async function updateCartItemApi(itemId: string, input: UpdateCartItemInput): Promise<Cart> {
  const response = await http.patch(`/cart/items/${itemId}`, input)
  return recordCartVersions(parseApiResponse(CartSchema, response.data))
}

export async function removeCartItemApi(itemId: string): Promise<Cart> {
  const response = await http.delete(`/cart/items/${itemId}`)
  return recordCartVersions(parseApiResponse(CartSchema, response.data))
}

export async function applyCouponApi(input: ApplyCouponInput): Promise<Cart> {
  const response = await http.put('/cart/coupon', input)
  return recordCartVersions(parseApiResponse(CartSchema, response.data))
}

export async function removeCouponApi(): Promise<Cart> {
  const response = await http.delete('/cart/coupon')
  return recordCartVersions(parseApiResponse(CartSchema, response.data))
}

export async function mergeCartApi(input: MergeCartInput): Promise<MergeCartResponse> {
  const response = await http.post('/cart/merge', input)
  const parsed = parseApiResponse(MergeCartResponseSchema, response.data)
  recordCartVersions(parsed.cart)
  return parsed
}

export async function createQuoteApi(
  input: CreateQuoteInput,
  opts?: { signal?: AbortSignal },
): Promise<Quote> {
  const response = await http.post('/quotes', input, { signal: opts?.signal })
  const quote = parseApiResponse(QuoteSchema, response.data)
  for (const line of quote.lines) {
    recordResourceVersion('nft', line.nftId, line.nftVersion)
  }
  return quote
}
