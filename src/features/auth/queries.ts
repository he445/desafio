import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { fetchSession, logoutApi, onSessionExpired } from './api'

export { onSessionExpired }

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

export async function applyAuthenticatedSession(
  queryClient: ReturnType<typeof useQueryClient>,
  auth: AuthResponse,
  previousUserId?: string | null,
) {
  if (previousUserId && previousUserId !== auth.user.id) {
    queryClient.removeQueries({ queryKey: qk.user(previousUserId).all })
    queryClient.removeQueries({ queryKey: ['cart'] })
    queryClient.removeQueries({ queryKey: ['quote'] })
    clearEventLedger()
  }

  setStoredSession(auth.session)
  queryClient.setQueryData(qk.session(), auth)

  const guestCartId = getGuestCartId()
  let adjustments: Awaited<ReturnType<typeof mergeCartApi>>['adjustments'] = []

  if (guestCartId) {
    try {
      const merged = await mergeCartApi({ guestCartId })
      adjustments = merged.adjustments
      queryClient.setQueryData(qk.cart(`user:${auth.user.id}`), merged.cart)
      queryClient.removeQueries({ queryKey: qk.cart(`guest:${guestCartId}`) })
    } catch {
      // Ignore merge failure if guest cart was empty
    } finally {
      clearGuestCartId()
    }
  }

  return { adjustments }
}

export async function performLogout(
  queryClient: ReturnType<typeof useQueryClient>,
  currentUserId?: string | null,
) {
  try {
    await logoutApi()
  } catch {
    // Network errors during logout are ignored per spec
  }

  clearStoredSession()
  clearGuestCartId()
  getOrCreateGuestCartId()
  clearEventLedger()

  if (currentUserId) {
    queryClient.removeQueries({ queryKey: qk.user(currentUserId).all })
  }
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['cart'] })
  queryClient.removeQueries({ queryKey: ['quote'] })
  queryClient.setQueryData(qk.session(), null)
}
