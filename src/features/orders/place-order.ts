import type { CreateOrderInput, Order } from '@/contracts'
import { isApiError } from '@/lib/api-error'
import { createOrderApi, fetchPendingOrdersApi } from './api'
import { checkoutAttemptFor } from './attempt'

export const ORDER_RESENDS = 3

function isLostResponse(error: unknown): boolean {
  return isApiError(error) && (error.kind === 'timeout' || error.kind === 'network')
}

// A lost response may still have created the order, so the client resends the same body with
// the same key; after the last resend it looks for the order among the pending ones.
export async function placeOrder(
  userId: string,
  body: CreateOrderInput,
  onResend: () => void,
): Promise<Order> {
  const attempt = await checkoutAttemptFor(userId, body)
  let lastError: unknown
  for (let resend = 0; resend <= ORDER_RESENDS; resend++) {
    if (resend > 0) onResend()
    try {
      return await createOrderApi(body, attempt.key)
    } catch (error) {
      if (!isLostResponse(error)) throw error
      lastError = error
    }
  }

  const pending = await fetchPendingOrdersApi()
  const order = pending.find((candidate) => candidate.quoteId === attempt.quoteId)
  if (order) return order
  throw lastError
}
