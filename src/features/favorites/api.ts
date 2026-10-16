import { FavoritesResponseSchema, type FavoritesResponse } from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'
import { recordResourceVersion } from '@/features/realtime/event-ledger'

export async function fetchFavoritesApi(opts?: {
  signal?: AbortSignal
}): Promise<FavoritesResponse> {
  const response = await http.get('/me/favorites', { signal: opts?.signal })
  const favorites = parseApiResponse(FavoritesResponseSchema, response.data)
  for (const nft of favorites.items) recordResourceVersion('nft', nft.id, nft.version)
  return favorites
}

export async function addFavoriteApi(nftId: string): Promise<void> {
  await http.put(`/me/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavoriteApi(nftId: string): Promise<void> {
  await http.delete(`/me/favorites/${encodeURIComponent(nftId)}`)
}
