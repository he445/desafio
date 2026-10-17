import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddCartItemInput, Cart, NetworkId } from '@/contracts'
import { isApiError } from '@/lib/api-error'
import { qk } from '@/lib/query-keys'
import { getOrCreateGuestCartId } from '@/lib/storage'
import { useSessionQuery } from '@/features/auth/queries'
import {
  addCartItemApi,
  applyCouponApi,
  createQuoteApi,
  fetchCartApi,
  removeCartItemApi,
  removeCouponApi,
  updateCartItemApi,
} from './api'
import { CART_QUOTE_NETWORK } from './quote'

type CartOwnerKey = `guest:${string}` | `user:${string}`

export function resolveCartOwnerKey(userId?: string | null): CartOwnerKey {
  if (userId) {
    return `user:${userId}`
  }
  return `guest:${getOrCreateGuestCartId()}`
}

function cartQueryOptions(ownerKey: CartOwnerKey) {
  return queryOptions({
    queryKey: qk.cart(ownerKey),
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: ({ signal }) => fetchCartApi({ signal }),
  })
}

export function quoteQueryOptions(ownerKey: CartOwnerKey, network: NetworkId, cartVersion: number) {
  return queryOptions({
    queryKey: qk.quote(ownerKey, network, cartVersion),
    staleTime: 0,
    retry: (failureCount, error) => failureCount < 1 && isApiError(error) && error.retryable,
    queryFn: ({ signal }) => createQuoteApi({ network }, { signal }),
  })
}

function useCartOwnerKey(): CartOwnerKey {
  const { data: sessionData } = useSessionQuery()
  return resolveCartOwnerKey(sessionData?.user.id)
}

export function useCartQuery() {
  return useQuery(cartQueryOptions(useCartOwnerKey()))
}

export function useCartQuote(cart: Cart | undefined) {
  const ownerKey = useCartOwnerKey()
  return useQuery({
    ...quoteQueryOptions(ownerKey, CART_QUOTE_NETWORK, cart?.version ?? 0),
    enabled: Boolean(cart && cart.items.length > 0),
    // The previous quote stays on screen while the next cart version is quoted, but never
    // across owners: after a logout the guest must not see the last user's totals.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === ownerKey ? previous : undefined,
  })
}

export function useCartItemCount(): number {
  const { data = 0 } = useQuery({
    ...cartQueryOptions(useCartOwnerKey()),
    select: (cart) => cart.items.reduce((total, item) => total + item.quantity, 0),
  })
  return data
}

// Every cart mutation answers with the whole cart: it goes straight into the cache, and a
// new cart version means a new quote key. A failure refetches the cart, because the reason
// is usually that the server changed under the client (stock, price).
function useCartMutation<TInput>(mutationFn: (input: TInput) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const ownerKey = useCartOwnerKey()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => queryClient.setQueryData(qk.cart(ownerKey), cart),
    onError: () => queryClient.invalidateQueries({ queryKey: qk.cart(ownerKey) }),
  })
}

export function useAddCartItem() {
  return useCartMutation((input: AddCartItemInput) => addCartItemApi(input))
}

export function useUpdateCartItem() {
  return useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    updateCartItemApi(itemId, { quantity }),
  )
}

export function useRemoveCartItem() {
  return useCartMutation((itemId: string) => removeCartItemApi(itemId))
}

export function useApplyCoupon() {
  return useCartMutation((code: string) => applyCouponApi({ code }))
}

export function useRemoveCoupon() {
  return useCartMutation(() => removeCouponApi())
}
