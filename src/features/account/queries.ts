import { queryOptions, useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/query-keys'
import { fetchProfileApi, fetchWalletsApi } from './api'

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: qk.user(userId).profile(),
    queryFn: ({ signal }) => fetchProfileApi({ signal }),
  })
}

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: qk.user(userId).wallets(),
    queryFn: ({ signal }) => fetchWalletsApi({ signal }),
  })
}

export function useProfileQuery(userId: string) {
  return useQuery(profileQueryOptions(userId))
}

export function useWalletsQuery(userId: string) {
  return useQuery(walletsQueryOptions(userId))
}
