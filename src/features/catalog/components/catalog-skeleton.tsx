import { copy } from '@/content/copy'
import { Skeleton } from '@/components/ui/skeleton'
import { gridClassName, staggerClassName } from '../grid-layout'
import { useGridColumns } from '../hooks/use-grid-columns'

// Same blocks and sizes as the cards, so the swap to real content does not move the page.
export function CatalogSkeleton({
  count = 9,
  label = copy.catalog.loading,
  withPagination = true,
}: {
  count?: number
  label?: string
  withPagination?: boolean
}) {
  const { columns, isDesktop } = useGridColumns()
  // In two phone columns a long title or a price with its old value takes a second line, and
  // each grid row grows to its tallest card; one more bar keeps the skeleton at that height.
  const twoLineText = columns === 2 && !isDesktop

  return (
    <div aria-busy="true">
      <p className="sr-only">{label}</p>
      <div aria-hidden="true" className={gridClassName(columns)}>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={staggerClassName(index, columns, isDesktop)}>
            <Skeleton className="h-[200px] rounded-[20px] lg:h-[300px] lg:rounded-none" />
            <Skeleton className="mt-3 ml-2 h-[22px] w-3/4 lg:ml-0 lg:h-4" />
            {twoLineText && <Skeleton className="mt-[5px] ml-2 h-[18px] w-1/2" />}
            <Skeleton className="mt-2 ml-2 h-6 w-1/3 lg:mt-3 lg:ml-0 lg:h-4" />
          </div>
        ))}
      </div>
      {withPagination && (
        <div
          aria-hidden="true"
          className="mt-6 flex justify-center gap-2 lg:mt-[88px] lg:justify-end"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="size-[35px] rounded-pagination" />
          ))}
        </div>
      )}
    </div>
  )
}
