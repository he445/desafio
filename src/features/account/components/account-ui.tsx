import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'

// Profile and wallets have no mobile frame: one column, taller inputs and a full-width CTA
// below lg (A.7), the Figma grid of 417 + 28 from lg up.
export const accountGridClass = 'grid gap-6 lg:grid-cols-[repeat(2,minmax(0,417px))] lg:gap-x-7'
export const accountInputClass = 'h-[50px] rounded-mobile-field lg:h-10 lg:rounded-field'
export const accountSaveClass =
  'h-[60px] w-full rounded-pill bg-cta text-base lg:h-10 lg:w-[131px] lg:rounded-field lg:bg-primary lg:text-sm'

export function AccountSkeleton({ label, rows }: { label: string; rows: number }) {
  return (
    <div aria-busy="true">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-5 w-48" />
      <div className={cn(accountGridClass, 'mt-8')}>
        {Array.from({ length: rows * 2 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-[29px] w-32" />
            <Skeleton className="mt-2.5 h-[50px] rounded-mobile-field lg:h-10 lg:rounded-field" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-8 h-[60px] rounded-pill lg:h-10 lg:w-[131px] lg:rounded-field" />
    </div>
  )
}

export function AccountLoadError({
  title,
  error,
  onRetry,
}: {
  title: string
  error: unknown
  onRetry: () => void
}) {
  return (
    <div role="alert" className="rounded-card bg-surface p-8 text-center">
      <h2 className="text-lg font-bold text-heading">{title}</h2>
      <p className="mt-2 text-sm text-body">
        {isApiError(error) ? error.message : copy.states.routeErrorFallback}
      </p>
      <Button type="button" className="mt-6" onClick={onRetry}>
        {copy.states.retry}
      </Button>
    </div>
  )
}
