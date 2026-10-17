import { z } from 'zod'
import { EthAmountSchema, NetworkIdSchema } from './common'

export const CartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  title: z.string(),
  tokenId: z.string(),
  editionName: z.string(),
  image: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: EthAmountSchema,
  unitPriceWhenAdded: EthAmountSchema,
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
  nftVersion: z.number().int().positive(),
})
export type CartItem = z.infer<typeof CartItemSchema>

export const CartOwnerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('guest') }),
  z.object({ kind: z.literal('user'), userId: z.string() }),
])
export type CartOwner = z.infer<typeof CartOwnerSchema>

export const CartSchema = z.object({
  id: z.string(),
  owner: CartOwnerSchema,
  items: z.array(CartItemSchema),
  couponCode: z.string().nullable(),
  version: z.number().int().positive(),
})
export type Cart = z.infer<typeof CartSchema>

export const AddCartItemInputSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().positive(),
})
export type AddCartItemInput = z.infer<typeof AddCartItemInputSchema>

export const UpdateCartItemInputSchema = z.object({
  quantity: z.number().int().positive(),
})
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInputSchema>

export const ApplyCouponInputSchema = z.object({
  code: z.string().trim().min(1),
})
export type ApplyCouponInput = z.infer<typeof ApplyCouponInputSchema>

export const MergeCartInputSchema = z.object({
  guestCartId: z.string().min(1),
})
export type MergeCartInput = z.infer<typeof MergeCartInputSchema>

export const CartMergeAdjustmentSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  title: z.string(),
  previousQuantity: z.number().int(),
  newQuantity: z.number().int(),
  reason: z.enum(['capped_by_stock', 'removed_sold_out']),
})
export type CartMergeAdjustment = z.infer<typeof CartMergeAdjustmentSchema>

export const MergeCartResponseSchema = z.object({
  cart: CartSchema,
  adjustments: z.array(CartMergeAdjustmentSchema),
})
export type MergeCartResponse = z.infer<typeof MergeCartResponseSchema>

const QuoteIssueCodeSchema = z.enum([
  'PRICE_CHANGED',
  'INSUFFICIENT_STOCK',
  'EDITION_SOLD_OUT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
])

export const QuoteIssueSchema = z.object({
  code: QuoteIssueCodeSchema,
  nftId: z.string().optional(),
  editionId: z.string().optional(),
  message: z.string().optional(),
  previousPrice: EthAmountSchema.optional(),
  currentPrice: EthAmountSchema.optional(),
})
export type QuoteIssue = z.infer<typeof QuoteIssueSchema>

export const QuoteLineSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: EthAmountSchema,
  lineTotal: EthAmountSchema,
  nftVersion: z.number().int().positive(),
})
export type QuoteLine = z.infer<typeof QuoteLineSchema>

export const QuoteSchema = z.object({
  id: z.string(),
  cartVersion: z.number().int().positive(),
  network: NetworkIdSchema,
  couponCode: z.string().nullable(),
  lines: z.array(QuoteLineSchema),
  subtotal: EthAmountSchema,
  discount: EthAmountSchema,
  networkFee: EthAmountSchema,
  total: EthAmountSchema,
  issues: z.array(QuoteIssueSchema),
  expiresAt: z.iso.datetime(),
})
export type Quote = z.infer<typeof QuoteSchema>

export const CreateQuoteInputSchema = z.object({
  network: NetworkIdSchema,
})
export type CreateQuoteInput = z.infer<typeof CreateQuoteInputSchema>
