import { queryOptions } from '@tanstack/react-query'
import { qk } from '@/lib/query-keys'
import { fetchNftApi } from './api'

export function nftQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.nfts.detail(id),
    queryFn: ({ signal }) => fetchNftApi(id, { signal }),
  })
}
