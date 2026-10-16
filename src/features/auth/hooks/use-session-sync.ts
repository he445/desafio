import { useEffect } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { AuthResponse } from '@/contracts'
import { qk } from '@/lib/query-keys'
import {
  clearStoredSession,
  getStoredSession,
  saveResumeContext,
  SESSION_STORAGE_KEY,
} from '@/lib/storage'
import { onSessionExpired } from '../api'
import { clearPrivateCache } from '../queries'

export function useSessionSync(): void {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(
    () =>
      onSessionExpired(() => {
        // Without a cached session there is nothing to resume: a token that was already stale
        // at boot is handled by the session query, and a burst of 401s runs this only once.
        const expired = queryClient.getQueryData<AuthResponse | null>(qk.session())
        if (!expired) return
        const href = `${window.location.pathname}${window.location.search}${window.location.hash}`
        saveResumeContext({ href, reason: 'expired', userId: expired.user.id })
        clearStoredSession()
        clearPrivateCache(queryClient)
        void navigate({
          to: '/login',
          search: { redirect: href.startsWith('/login') ? '/' : href, reason: 'expired' },
        })
      }),
    [navigate, queryClient],
  )

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) return
      const current = queryClient.getQueryData<AuthResponse | null>(qk.session())
      const nextUserId = getStoredSession()?.userId ?? null
      if (current && current.user.id !== nextUserId) {
        clearPrivateCache(queryClient)
        void router.invalidate()
      }
      if (nextUserId) void queryClient.invalidateQueries({ queryKey: qk.session() })
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient, router])
}
