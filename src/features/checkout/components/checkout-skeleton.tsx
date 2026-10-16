import { copy } from '@/content/copy'
import { Skeleton } from '@/components/ui/skeleton'

export function CheckoutSkeleton({ variant }: { variant: 'desktop' | 'mobile' }) {
  if (variant === 'mobile') {
    return (
      <div aria-busy="true" className="mt-4">
        <p className="sr-only">{copy.checkout.loading}</p>
        <div aria-hidden="true">
          <Skeleton className="h-6 w-40 rounded-field" />
          <div className="mt-4 space-y-5">
            <Skeleton className="h-[93px] rounded-mobile-card" />
            <Skeleton className="h-[93px] rounded-mobile-card" />
          </div>
          <Skeleton className="mt-4 h-6 w-36 rounded-field" />
          <div className="mt-4 space-y-4">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-[60px] rounded-mobile-card" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div aria-busy="true" className="mt-6 flex items-start gap-8">
      <p className="sr-only">{copy.checkout.loading}</p>
      <div aria-hidden="true" className="max-w-[762px] min-w-0 flex-1">
        <Skeleton className="h-6 w-56 rounded-field" />
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-[69px] rounded-field" />
          ))}
        </div>
        <Skeleton className="mt-5 h-[120px] w-1/2 rounded-field" />
      </div>
      <div aria-hidden="true" className="w-[405px] shrink-0 space-y-3">
        <Skeleton className="h-6 w-32 rounded-field" />
        <Skeleton className="h-[70px] rounded-card" />
        <Skeleton className="h-[70px] rounded-card" />
        <Skeleton className="h-[150px] rounded-card" />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-[50px] rounded-card" />
        ))}
        <Skeleton className="h-[45px] rounded-card" />
      </div>
    </div>
  )
}
