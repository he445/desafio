import { useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { performLogout } from '../queries'

export function useSignOut(): () => Promise<void> {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCallback(async () => {
    await performLogout(queryClient)
    const onPrivateRoute = router.state.matches.some((match) =>
      match.routeId.startsWith('/_authenticated'),
    )
    if (onPrivateRoute) await router.navigate({ to: '/' })
  }, [queryClient, router])
}
