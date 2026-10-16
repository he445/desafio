import { DEFAULT_CATALOG_SEARCH, type CatalogSearch } from '@/contracts'

// Everything the user can change in the catalog except the page number.
export type CatalogChange = Partial<Omit<CatalogSearch, 'page'>>

// A different view of the catalog starts on its first page.
export function applyCatalogChange(prev: CatalogSearch, change: CatalogChange): CatalogSearch {
  return { ...prev, ...change, page: 1 }
}

export function toPage(prev: CatalogSearch, page: number): CatalogSearch {
  return { ...prev, page }
}

export function hasActiveFilters(search: CatalogSearch): boolean {
  return (
    search.q !== undefined ||
    search.collection !== undefined ||
    search.category !== undefined ||
    search.network !== undefined ||
    search.minPrice !== undefined ||
    search.maxPrice !== undefined ||
    search.status !== 'all' ||
    search.tab !== 'all'
  )
}

// The ordering and the page size are not filters, so they survive a clear.
export function clearCatalogFilters(prev: CatalogSearch): CatalogSearch {
  return { ...DEFAULT_CATALOG_SEARCH, sort: prev.sort, pageSize: prev.pageSize }
}

// Typing is restored from the URL, so the text is trimmed before it is written there.
export function normalizeQuery(text: string): string | undefined {
  const trimmed = text.trim()
  return trimmed === '' ? undefined : trimmed
}
