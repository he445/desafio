import type { FavoritesResponse } from '@/contracts'
import type { MockDb } from '@/mocks/db/schema'
import { getNftById } from './catalog'

export function getFavoritesForUser(db: MockDb, userId: string): FavoritesResponse {
  const nftIds = db.favoritesByUser[userId] ?? []
  const items = nftIds
    .map((id) => db.nfts.find((n) => n.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return { nftIds, items }
}

export function addFavoriteForUser(db: MockDb, userId: string, nftId: string): void {
  getNftById(db, nftId)
  const list = db.favoritesByUser[userId] ?? []
  if (!list.includes(nftId)) {
    list.push(nftId)
  }
  db.favoritesByUser[userId] = list
}

export function removeFavoriteForUser(db: MockDb, userId: string, nftId: string): void {
  getNftById(db, nftId)
  const list = db.favoritesByUser[userId] ?? []
  db.favoritesByUser[userId] = list.filter((id) => id !== nftId)
}
