import { useEffect } from 'react'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api-error'

export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorBoundary.reset()
  }, [queryErrorBoundary])

  const handleRetry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <div role="alert" className="mx-auto max-w-lg rounded-card bg-surface p-8 text-center">
      <h1 className="text-lg font-bold text-heading">{copy.states.routeErrorTitle}</h1>
      <p className="mt-2 text-sm text-body">
        {isApiError(error) ? error.message : copy.states.routeErrorFallback}
      </p>
      <div className="mt-6">
        <Button type="button" onClick={handleRetry}>
          {copy.states.retry}
        </Button>
      </div>
    </div>
  )
}
