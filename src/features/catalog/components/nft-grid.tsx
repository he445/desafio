import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { cn } from '@/lib/utils'
import { gridClassName, staggerClassName } from '../grid-layout'
import { useGridColumns } from '../hooks/use-grid-columns'
import { NftCard } from './nft-card'

export function NftGrid({
  items,
  dimmed = false,
  label = copy.catalog.gridLabel,
}: {
  items: Nft[]
  dimmed?: boolean
  label?: string
}) {
  const { columns, isDesktop } = useGridColumns()
  // On the phone the first row of the grid, not the small hero, is the largest paint.

  return (
    <ul
      aria-label={label}
      className={cn(gridClassName(columns), dimmed && 'opacity-60 transition-opacity')}
    >
      {items.map((nft, index) => (
        <li key={nft.id} className={staggerClassName(index, columns, isDesktop)}>
          <NftCard nft={nft} priority={!isDesktop && index < columns} />
        </li>
      ))}
    </ul>
  )
}
