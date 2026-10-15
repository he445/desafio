import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/lib/api-error'

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry(failureCount, error) {
          if (failureCount >= 2) return false
          return isApiError(error) && error.retryable
        },
        retryDelay(attemptIndex) {
          return Math.min(500 * 2 ** attemptIndex, 4000)
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createAppQueryClient()
