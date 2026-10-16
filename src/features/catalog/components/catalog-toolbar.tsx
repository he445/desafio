import { copy } from '@/content/copy'
import { applyCatalogChange } from '../search'
import { useCatalogNavigate, useCatalogSearch } from '../hooks/use-catalog-search'
import { CatalogTabs } from './catalog-tabs'
import { SortSelect } from './sort-select'

// Desktop bar above the grid: the tabs on the left, the ordering on the right.
export function CatalogToolbar() {
  const search = useCatalogSearch()
  const navigate = useCatalogNavigate()

  return (
    <div className="flex items-start justify-between">
      <CatalogTabs tab={search.tab} />
      <div className="flex items-center gap-2 text-[15px] text-foreground">
        <span aria-hidden="true">{copy.home.sortLabel}</span>
        <SortSelect
          bare
          value={search.sort}
          onChange={(sort) => navigate((prev) => applyCatalogChange(prev, { sort }))}
        />
      </div>
    </div>
  )
}
