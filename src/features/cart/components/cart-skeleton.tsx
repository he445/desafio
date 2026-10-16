import { copy } from '@/content/copy'
import { Skeleton } from '@/components/ui/skeleton'
import { CART_GRID, CartTableHeader } from './cart-line'

// Rows and summary with the sizes of the real ones, so the swap does not move the page.
export function CartSkeleton({ variant }: { variant: 'desktop' | 'mobile' }) {
  if (variant === 'mobile') {
    return (
      <div aria-busy="true" className="mt-3">
        <p className="sr-only">{copy.cart.loading}</p>
        <div aria-hidden="true" className="space-y-5">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-[100px] rounded-mobile-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div aria-busy="true" className="mt-3 flex gap-[86px]">
      <p className="sr-only">{copy.cart.loading}</p>
      <div className="w-[782px]">
        <CartTableHeader />
        <div aria-hidden="true" className="mt-3 space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className={`${CART_GRID} h-[70px] items-center bg-surface pr-6`}>
              <div className="flex items-center gap-4">
                <Skeleton className="size-[70px] rounded-btn bg-surface-raised" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-surface-raised" />
                  <Skeleton className="h-3 w-1/2 bg-surface-raised" />
                </div>
              </div>
              <Skeleton className="h-4 bg-surface-raised" />
              <Skeleton className="h-6 bg-surface-raised" />
              <Skeleton className="h-4 bg-surface-raised" />
              <Skeleton className="size-6 bg-surface-raised" />
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="w-[332px] space-y-3">
        <Skeleton className="h-7" />
        <Skeleton className="mt-6 h-10 rounded-field" />
        <Skeleton className="h-24 rounded-field" />
        <Skeleton className="h-10 rounded-field" />
      </div>
    </div>
  )
}
