import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { cn } from '@/lib/utils'
import { gridClassName, staggerClassName } from '../grid-layout'
import { useGridColumns } from '../hooks/use-grid-columns'
import { NftCard } from './nft-card'

export function NftGrid({ items, dimmed = false }: { items: Nft[]; dimmed?: boolean }) {
  const { columns, isDesktop } = useGridColumns()

  return (
    <ul
      aria-label={copy.catalog.gridLabel}
      className={cn(gridClassName(columns), dimmed && 'opacity-60 transition-opacity')}
    >
      {items.map((nft, index) => (
        <li key={nft.id} className={staggerClassName(index, columns, isDesktop)}>
          <NftCard nft={nft} />
        </li>
      ))}
    </ul>
  )
}
