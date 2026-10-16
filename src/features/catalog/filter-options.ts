import type { CatalogFacets, NetworkId } from '@/contracts'
import { copy } from '@/content/copy'

export interface FilterOption<Value extends string = string> {
  value: Value
  label: string
  count: number
}

// Every category and network of the design is listed, with the count the facets give for it
// (zero when nothing matches the other filters).
export function categoryOptions(facets: CatalogFacets): FilterOption[] {
  return copy.home.categories.map(({ slug, label }) => ({
    value: slug,
    label,
    count: facets.categories[slug] ?? 0,
  }))
}

export function networkOptions(facets: CatalogFacets): FilterOption<NetworkId>[] {
  return copy.home.networks.map(({ id, label }) => ({
    value: id,
    label,
    count: facets.networks[id] ?? 0,
  }))
}
