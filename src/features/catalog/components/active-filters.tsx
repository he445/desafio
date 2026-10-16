import { X } from 'lucide-react'
import { copy } from '@/content/copy'
import { NavLink } from '@/components/ui/nav-link'
import { catalogLinkProps, useCatalogSearch } from '../hooks/use-catalog-search'
import { useNftListQuery } from '../queries'
import type { CatalogChange } from '../search'

const chip =
  'inline-flex h-8 items-center gap-2 rounded-pill border border-line bg-surface px-3 text-sm text-body transition-colors hover:text-highlight'

// The search term and the collection come from outside the sidebar (the header search and the
// collection link of an NFT), so nothing else on the page says that they narrow the list.
export function ActiveFilters() {
  const search = useCatalogSearch()
  const { data } = useNftListQuery(search)

  if (!search.q && !search.collection) return null

  const collectionName =
    data?.items.find((nft) => nft.collection.id === search.collection)?.collection.name ??
    search.collection

  const chips: { key: string; label: string; change: CatalogChange }[] = []
  if (search.q) {
    chips.push({ key: 'q', label: copy.catalog.searchFilter(search.q), change: { q: undefined } })
  }
  if (search.collection) {
    chips.push({
      key: 'collection',
      label: copy.catalog.collectionFilter(collectionName ?? search.collection),
      change: { collection: undefined },
    })
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((item) => (
        <li key={item.key}>
          <NavLink
            {...catalogLinkProps(item.change)}
            aria-label={copy.catalog.removeFilter(item.label)}
            className={chip}
          >
            <span>{item.label}</span>
            <X aria-hidden="true" className="size-4 text-highlight" />
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
