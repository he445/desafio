import { useState } from 'react'
import { type CatalogSearch, type CatalogSort, type EthAmount, type NetworkId } from '@/contracts'
import { copy } from '@/content/copy'
import { FilterIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { categoryOptions, networkOptions } from '../filter-options'
import { applyCatalogChange } from '../search'
import { useCatalogNavigate, useCatalogSearch } from '../hooks/use-catalog-search'
import { useNftListQuery } from '../queries'
import { optionRowClass } from '../option-row'
import { FilterSection, OptionContent } from './filter-option'
import { PriceRangeFilter } from './price-range-filter'
import { SortSelect } from './sort-select'

interface Draft {
  sort: CatalogSort
  category?: string
  network?: NetworkId
  minPrice?: EthAmount
  maxPrice?: EthAmount
}

const draftFrom = ({ sort, category, network, minPrice, maxPrice }: CatalogSearch): Draft => ({
  sort,
  category,
  network,
  minPrice,
  maxPrice,
})

// The phone layout keeps the filters in a sheet: choices are a draft until "Aplicar", so the
// grid behind it does not reload on every tap.
export function FiltersSheet() {
  const search = useCatalogSearch()
  const navigate = useCatalogNavigate()
  const { data } = useNftListQuery(search)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => draftFrom(search))

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(draftFrom(search))
    setOpen(next)
  }

  const apply = () => {
    navigate((prev) => applyCatalogChange(prev, draft))
    setOpen(false)
  }

  const clear = () =>
    setDraft((current) => ({
      sort: current.sort,
      category: undefined,
      network: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    }))

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={copy.catalog.openFilters}
          className="flex size-[45px] shrink-0 items-center justify-center rounded-mobile-card bg-filter text-ink"
        >
          <FilterIcon size={22} />
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>{copy.home.filters.mobileSheetTitle}</SheetTitle>
        <SheetDescription className="sr-only">{copy.catalog.filtersDescription}</SheetDescription>

        <div className="mt-6 flex flex-col gap-8">
          <FilterSection title={copy.home.sortLabel}>
            <SortSelect value={draft.sort} onChange={(sort) => setDraft({ ...draft, sort })} />
          </FilterSection>

          {data && (
            <>
              <FilterSection title={copy.home.filters.collectionsTitle}>
                <ul>
                  {categoryOptions(data.facets).map(({ value, label, count }) => {
                    const active = draft.category === value
                    return (
                      <li key={value}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setDraft({ ...draft, category: active ? undefined : value })
                          }
                          className={optionRowClass(active)}
                        >
                          <OptionContent label={label} count={count} active={active} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </FilterSection>

              <FilterSection title={copy.home.filters.priceRangeTitle}>
                <PriceRangeFilter
                  range={data.facets.priceRange}
                  selected={draft}
                  onChange={(price) => setDraft({ ...draft, ...price })}
                />
              </FilterSection>

              <FilterSection title={copy.home.filters.networkTitle}>
                <ul>
                  {networkOptions(data.facets).map(({ value, label, count }) => {
                    const active = draft.network === value
                    return (
                      <li key={value}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setDraft({ ...draft, network: active ? undefined : value })
                          }
                          className={optionRowClass(active)}
                        >
                          <OptionContent label={label} count={count} active={active} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </FilterSection>
            </>
          )}
        </div>

        <div className="sticky -bottom-6 -mx-6 mt-8 -mb-6 flex gap-3 bg-surface px-6 pt-4 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={clear}
            className="h-[60px] flex-1 rounded-pill text-base font-bold"
          >
            {copy.home.filters.clear}
          </Button>
          <Button
            type="button"
            variant="ctaMobile"
            size="ctaMobile"
            onClick={apply}
            className="flex-1"
          >
            {copy.home.filters.apply}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
