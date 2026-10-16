import { copy } from '@/content/copy'
import { NavLink } from '@/components/ui/nav-link'
import { Skeleton } from '@/components/ui/skeleton'
import { categoryOptions, networkOptions } from '../filter-options'
import { applyCatalogChange } from '../search'
import { catalogLinkProps, useCatalogNavigate, useCatalogSearch } from '../hooks/use-catalog-search'
import { useNftListQuery } from '../queries'
import { optionRowClass } from '../option-row'
import { FilterSection, OptionContent } from './filter-option'
import { PriceRangeFilter } from './price-range-filter'

function FiltersSkeleton() {
  const list = (rows: number) =>
    Array.from({ length: rows }, (_, row) => (
      <div key={row} className="flex h-10 items-center">
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))

  return (
    <div aria-hidden="true" className="flex flex-col gap-10">
      <div>
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-3">{list(9)}</div>
      </div>
      <div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-3 h-[18px]" />
        <Skeleton className="mt-3 h-[23px] w-3/4" />
        <Skeleton className="mt-3 h-10 w-20" />
      </div>
      <div>
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-3">{list(3)}</div>
      </div>
    </div>
  )
}

// The sidebar of the desktop catalog. Categories and networks are links, so every filter has
// an address; the price is applied with its button.
export function CatalogFilters() {
  const search = useCatalogSearch()
  const navigate = useCatalogNavigate()
  const { data, isPending } = useNftListQuery(search)

  return (
    <aside aria-label={copy.catalog.filtersLabel} className="bg-surface p-5">
      {isPending && <FiltersSkeleton />}
      {data && (
        <div className="flex flex-col gap-10">
          <FilterSection title={copy.home.filters.collectionsTitle}>
            <ul>
              {categoryOptions(data.facets).map(({ value, label, count }) => {
                const active = search.category === value
                return (
                  <li key={value}>
                    <NavLink
                      {...catalogLinkProps({ category: active ? undefined : value })}
                      current={active ? 'true' : false}
                      className={optionRowClass(active)}
                    >
                      <OptionContent label={label} count={count} active={active} />
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </FilterSection>

          <FilterSection title={copy.home.filters.priceRangeTitle}>
            <PriceRangeFilter
              range={data.facets.priceRange}
              selected={search}
              onApply={(price) => navigate((prev) => applyCatalogChange(prev, price))}
            />
          </FilterSection>

          <FilterSection title={copy.home.filters.networkTitle}>
            <ul>
              {networkOptions(data.facets).map(({ value, label, count }) => {
                const active = search.network === value
                return (
                  <li key={value}>
                    <NavLink
                      {...catalogLinkProps({ network: active ? undefined : value })}
                      current={active ? 'true' : false}
                      className={optionRowClass(active)}
                    >
                      <OptionContent label={label} count={count} active={active} />
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </FilterSection>
        </div>
      )}
    </aside>
  )
}
