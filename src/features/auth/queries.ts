import { queryOptions, useMutation, useQuery, type QueryClient } from '@tanstack/react-query'
import type { AuthResponse } from '@/contracts'
import { isApiError } from '@/lib/api-error'
import { qk } from '@/lib/query-keys'
import {
  clearGuestCartId,
  clearStoredSession,
  getGuestCartId,
  getOrCreateGuestCartId,
  getStoredSession,
  setStoredSession,
} from '@/lib/storage'
import { clearEventLedger } from '@/features/realtime/event-ledger'
import { mergeCartApi } from '@/features/cart/api'
import { fetchSession, loginApi, logoutApi, registerApi } from './api'

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: qk.session(),
    staleTime: Infinity,
    retry: false,
    // With staleTime Infinity a plain `true` never refetches; the focus check is what
    // catches a session that expired while the tab was in the background.
    refetchOnWindowFocus: 'always',
    queryFn: async ({ signal }): Promise<AuthResponse | null> => {
      if (!getStoredSession()) return null
      try {
        const auth = await fetchSession({ signal })
        setStoredSession(auth.session)
        return auth
      } catch (error) {
        if (!isApiError(error) || error.status !== 401) throw error
        clearStoredSession()
        return null
      }
    },
  })
}

export function useSessionQuery() {
  return useQuery(sessionQueryOptions())
}

export function clearPrivateCache(queryClient: QueryClient): void {
  queryClient.setQueryData(qk.session(), null)
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['cart'] })
  queryClient.removeQueries({ queryKey: ['quote'] })
  clearEventLedger()
}

export async function applyAuthenticatedSession(queryClient: QueryClient, auth: AuthResponse) {
  const previous = queryClient.getQueryData<AuthResponse | null>(qk.session())
  if (previous && previous.user.id !== auth.user.id) clearPrivateCache(queryClient)

  setStoredSession(auth.session)
  queryClient.setQueryData(qk.session(), auth)

  const guestCartId = getGuestCartId()
  if (!guestCartId) return { adjustments: [] }
  try {
    const merged = await mergeCartApi({ guestCartId })
    queryClient.setQueryData(qk.cart(`user:${auth.user.id}`), merged.cart)
    queryClient.removeQueries({ queryKey: qk.cart(`guest:${guestCartId}`) })
    clearGuestCartId()
    return { adjustments: merged.adjustments }
  } catch {
    // The guest id stays in storage, so the next login merges the same cart again.
    return { adjustments: [] }
  }
}

export async function performLogout(queryClient: QueryClient): Promise<void> {
  await logoutApi().catch(() => undefined)
  clearStoredSession()
  clearGuestCartId()
  getOrCreateGuestCartId()
  clearPrivateCache(queryClient)
}

export function useLoginMutation() {
  return useMutation({ mutationFn: loginApi })
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: registerApi })
}
