import type { FavoritesResponse, Nft } from '@/contracts'

export function toggleFavorite(
  favorites: FavoritesResponse | undefined,
  nft: Nft,
  next: boolean,
): FavoritesResponse | undefined {
  if (!favorites) return favorites
  const without = {
    nftIds: favorites.nftIds.filter((id) => id !== nft.id),
    items: favorites.items.filter((item) => item.id !== nft.id),
  }
  if (!next) return without
  return { nftIds: [...without.nftIds, nft.id], items: [...without.items, nft] }
}
