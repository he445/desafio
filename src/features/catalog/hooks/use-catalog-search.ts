import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { CatalogSearch } from '@/contracts'
import { applyCatalogChange, toPage, type CatalogChange } from '../search'

export function useCatalogSearch(): CatalogSearch {
  return useSearch({ from: '/' })
}

interface CatalogNavigateOptions {
  replace?: boolean
  // Typing in the search box must not move the page; every other change returns to the
  // top of the catalog so the new results are in view.
  keepScroll?: boolean
}

export function useCatalogNavigate() {
  const navigate = useNavigate({ from: '/' })

  return useCallback(
    (
      update: (prev: CatalogSearch) => CatalogSearch,
      { replace, keepScroll }: CatalogNavigateOptions = {},
    ) => {
      void navigate({
        search: update,
        hash: keepScroll ? undefined : 'mercado',
        resetScroll: keepScroll ? false : undefined,
        replace,
      })
    },
    [navigate],
  )
}

// Props for the links of the catalog (tabs, filters, pages): they keep what is in the URL,
// change one thing and land on the top of the catalog.
export function catalogLinkProps(change: CatalogChange) {
  return {
    from: '/',
    to: '/',
    search: (prev: CatalogSearch) => applyCatalogChange(prev, change),
    hash: 'mercado',
  } as const
}

export function pageLinkProps(page: number) {
  return {
    from: '/',
    to: '/',
    search: (prev: CatalogSearch) => toPage(prev, page),
    hash: 'mercado',
  } as const
}
