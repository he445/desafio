import { queryOptions, useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/query-keys'
import { getOrCreateGuestCartId } from '@/lib/storage'
import { useSessionQuery } from '@/features/auth/queries'
import { fetchCartApi } from './api'

export function resolveCartOwnerKey(userId?: string | null): `guest:${string}` | `user:${string}` {
  if (userId) {
    return `user:${userId}`
  }
  return `guest:${getOrCreateGuestCartId()}`
}

export function cartQueryOptions(ownerKey: `guest:${string}` | `user:${string}`) {
  return queryOptions({
    queryKey: qk.cart(ownerKey),
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: ({ signal }) => fetchCartApi({ signal }),
  })
}

export function useCartQuery() {
  const { data: sessionData } = useSessionQuery()
  const ownerKey = resolveCartOwnerKey(sessionData?.user.id)
  return useQuery(cartQueryOptions(ownerKey))
}

export function useCartItemCount(): number {
  const { data: sessionData } = useSessionQuery()
  const { data = 0 } = useQuery({
    ...cartQueryOptions(resolveCartOwnerKey(sessionData?.user.id)),
    select: (cart) => cart.items.reduce((total, item) => total + item.quantity, 0),
  })
  return data
}
