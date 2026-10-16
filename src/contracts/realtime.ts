import { z } from 'zod'
import { EthAmountSchema } from './common'
import { OrderRejectionReasonSchema, OrderStatusSchema, OrderTransactionSchema } from './orders'

export const NftUpdatedDataSchema = z.object({
  editions: z.array(
    z.object({
      id: z.string(),
      price: EthAmountSchema,
      available: z.number().int().nonnegative(),
    }),
  ),
  priceFrom: EthAmountSchema,
})
export type NftUpdatedData = z.infer<typeof NftUpdatedDataSchema>

export const OrderUpdatedDataSchema = z.object({
  status: OrderStatusSchema,
  rejectionReason: OrderRejectionReasonSchema,
  transaction: OrderTransactionSchema.nullable(),
})
export type OrderUpdatedData = z.infer<typeof OrderUpdatedDataSchema>

export const NftUpdatedEventSchema = z.object({
  eventId: z.string(),
  type: z.literal('nft.updated'),
  resource: z.object({
    kind: z.literal('nft'),
    id: z.string(),
  }),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
  userId: z.string().optional(),
  data: NftUpdatedDataSchema,
})
export type NftUpdatedEvent = z.infer<typeof NftUpdatedEventSchema>

export const OrderUpdatedEventSchema = z.object({
  eventId: z.string(),
  type: z.literal('order.updated'),
  resource: z.object({
    kind: z.literal('order'),
    id: z.string(),
  }),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
  userId: z.string(),
  data: OrderUpdatedDataSchema,
})
export type OrderUpdatedEvent = z.infer<typeof OrderUpdatedEventSchema>

export const RealtimeEventSchema = z.discriminatedUnion('type', [
  NftUpdatedEventSchema,
  OrderUpdatedEventSchema,
])
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>
