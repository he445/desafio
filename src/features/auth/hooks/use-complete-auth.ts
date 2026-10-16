import { useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AuthResponse } from '@/contracts'
import { copy } from '@/content/copy'
import { consumeResumeContext } from '@/lib/storage'
import { applyAuthenticatedSession } from '../queries'

// What every successful login or registration does next: store the session, merge the guest
// cart, report what the merge changed and go back to where the person was.
export function useCompleteAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useCallback(
    async (auth: AuthResponse, redirect: string | undefined) => {
      const { adjustments } = await applyAuthenticatedSession(queryClient, auth)
      for (const adjustment of adjustments) {
        toast(copy.auth.cartAdjusted(adjustment.title, adjustment.newQuantity))
      }
      const resume = consumeResumeContext()
      // After an expired session, someone else signing in must not land on the previous
      // person's page (an order, a checkout in progress).
      const target = resume && resume.userId !== auth.user.id ? '/' : (redirect ?? '/')
      await router.navigate({ href: target, replace: true })
    },
    [queryClient, router],
  )
}
