import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api-error'

export function RouteErrorBoundary({
  error,
  reset,
}: {
  error: unknown
  reset?: () => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const message = isApiError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Não foi possível carregar os dados.'

  const handleRetry = () => {
    window.__mock?.clearRules()
    reset?.()
    void queryClient.resetQueries()
    void router.invalidate()
  }

  return (
    <div role="alert" className="mx-auto max-w-lg rounded-card bg-surface p-8 text-center">
      <h2 className="text-lg font-bold text-heading">{copy.states.routeErrorTitle}</h2>
      <p className="mt-2 text-sm text-body">{message}</p>
      <div className="mt-6">
        <Button type="button" onClick={handleRetry}>
          {copy.states.retry}
        </Button>
      </div>
    </div>
  )
}
