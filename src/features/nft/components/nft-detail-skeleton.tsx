import { copy } from '@/content/copy'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsDesktop } from '@/lib/use-media-query'

// Same blocks and sizes as the gallery and the details column, so the swap does not move the page.
export function NftDetailSkeleton() {
  const isDesktop = useIsDesktop()

  return (
    <div aria-busy="true">
      <p className="sr-only">{copy.detail.loading}</p>
      {isDesktop ? (
        <div aria-hidden="true">
          <Skeleton className="h-5 w-[140px]" />
          <div className="mt-8 grid grid-cols-[minmax(0,573fr)_minmax(0,595fr)] gap-8">
            <div className="flex gap-7">
              <div className="flex shrink-0 flex-col gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="size-[100px] rounded-card" />
                ))}
              </div>
              <Skeleton className="aspect-square w-full max-w-[444px] rounded-btn" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-[34px] w-2/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="mt-8 h-[88px] w-full" />
              <Skeleton className="h-[60px] w-1/2" />
              <Skeleton className="h-[49px] w-full" />
              <Skeleton className="h-[84px] w-3/4" />
            </div>
          </div>
        </div>
      ) : (
        <div aria-hidden="true">
          <Skeleton className="-mx-6 h-[506px]" />
          <div className="-mx-6 -mt-[114px] space-y-3 rounded-t-[31px] bg-ink px-6 pt-8">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-[72px] w-full" />
            <Skeleton className="h-[64px] w-full" />
          </div>
        </div>
      )}
    </div>
  )
}
