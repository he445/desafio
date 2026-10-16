import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { CatalogSearch } from '@/contracts'
import { qk } from '@/lib/query-keys'
import { fetchFeaturedApi, fetchNftListApi } from './api'

export function nftListQueryOptions(search: CatalogSearch) {
  return queryOptions({
    queryKey: qk.nfts.list(search),
    queryFn: ({ signal }) => fetchNftListApi(search, { signal }),
    staleTime: 30_000,
    // The previous page stays on screen while the next one loads, so the grid never blanks out.
    placeholderData: keepPreviousData,
  })
}

export function featuredQueryOptions() {
  return queryOptions({
    queryKey: qk.nfts.featured(),
    queryFn: ({ signal }) => fetchFeaturedApi({ signal }),
    staleTime: 60_000,
  })
}

export function useNftListQuery(search: CatalogSearch) {
  return useQuery(nftListQueryOptions(search))
}

export function useFeaturedQuery() {
  return useQuery(featuredQueryOptions())
}
