import { copy } from '@/content/copy'
import { Skeleton } from '@/components/ui/skeleton'
import { gridClassName, staggerClassName } from '../grid-layout'
import { useGridColumns } from '../hooks/use-grid-columns'

// Same blocks and sizes as the cards, so the swap to real content does not move the page.
export function CatalogSkeleton({ count = 9 }: { count?: number }) {
  const { columns, isDesktop } = useGridColumns()

  return (
    <div aria-busy="true">
      <p className="sr-only">{copy.catalog.loading}</p>
      <div aria-hidden="true" className={gridClassName(columns)}>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={staggerClassName(index, columns, isDesktop)}>
            <Skeleton className="h-[200px] rounded-[20px] lg:h-[300px] lg:rounded-none" />
            <Skeleton className="mt-3 ml-2 h-[22px] w-3/4 lg:ml-0 lg:h-4" />
            <Skeleton className="mt-2 ml-2 h-6 w-1/3 lg:mt-3 lg:ml-0 lg:h-4" />
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="mt-6 flex justify-center gap-2 lg:mt-[88px] lg:justify-end"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="size-[35px] rounded-pagination" />
        ))}
      </div>
    </div>
  )
}
