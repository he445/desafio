import { useState } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { isApiError } from '@/lib/api-error'
import { qk } from '@/lib/query-keys'
import { useRealtimeStatus } from '@/features/realtime/connection-status'
import { fetchOrderApi, fetchPendingOrdersApi } from './api'
import { loadCheckoutAttempt } from './attempt'

const ORDER_FALLBACK_POLL_MS = 2000

function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: qk.user(userId).order(orderId),
    queryFn: ({ signal }) => fetchOrderApi(orderId, { signal }),
    retry: (failureCount, error) =>
      failureCount < 2 && !(isApiError(error) && (error.status === 403 || error.status === 404)),
  })
}

// A pending order waits for order.updated; while the socket is down, polling stands in.
export function useOrderQuery(userId: string, orderId: string) {
  const realtime = useRealtimeStatus()
  return useQuery({
    ...orderQueryOptions(userId, orderId),
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && realtime !== 'connected'
        ? ORDER_FALLBACK_POLL_MS
        : false,
  })
}

// After a refresh or a reconnection mid-purchase, the stored attempt points at the order its
// key may already have created; the checkout sends the buyer there instead of buying again.
export function useResumedOrderId(userId: string) {
  const [attempt] = useState(() => loadCheckoutAttempt(userId))
  const query = useQuery({
    queryKey: qk.user(userId).pendingOrders(),
    queryFn: () => fetchPendingOrdersApi(),
    enabled: attempt !== null,
  })
  if (!attempt) return { checking: false, orderId: undefined }
  const order = query.data?.find((candidate) => candidate.quoteId === attempt.quoteId)
  return { checking: query.isPending, orderId: order?.id }
}
