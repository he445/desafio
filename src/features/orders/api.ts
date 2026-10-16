import {
  OrderSchema,
  PendingOrdersResponseSchema,
  type CreateOrderInput,
  type Order,
} from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'
import { recordResourceVersion } from '@/features/realtime/event-ledger'

function recordOrderVersion(order: Order): Order {
  recordResourceVersion('order', order.id, order.version)
  return order
}

export async function createOrderApi(input: CreateOrderInput, idempotencyKey: string) {
  const response = await http.post('/orders', input, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return recordOrderVersion(parseApiResponse(OrderSchema, response.data))
}

export async function fetchOrderApi(orderId: string, opts?: { signal?: AbortSignal }) {
  const response = await http.get(`/orders/${orderId}`, { signal: opts?.signal })
  return recordOrderVersion(parseApiResponse(OrderSchema, response.data))
}

export async function fetchPendingOrdersApi(): Promise<Order[]> {
  const response = await http.get('/orders', { params: { status: 'pending' } })
  return parseApiResponse(PendingOrdersResponseSchema, response.data).items.map(recordOrderVersion)
}
