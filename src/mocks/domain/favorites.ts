import type { FavoritesResponse } from '@/contracts'
import type { MockDb } from '@/mocks/db/schema'
import { getNftById } from './catalog'

export function getFavoritesForUser(db: MockDb, userId: string): FavoritesResponse {
  const items = (db.favoritesByUser[userId] ?? []).flatMap((id) => {
    const nft = db.nfts.find((candidate) => candidate.id === id)
    return nft ? [nft] : []
  })
  return { nftIds: items.map((nft) => nft.id), items }
}

export function addFavoriteForUser(db: MockDb, userId: string, nftId: string): void {
  getNftById(db, nftId)
  const list = db.favoritesByUser[userId] ?? []
  if (!list.includes(nftId)) {
    db.favoritesByUser[userId] = [...list, nftId]
  }
}

export function removeFavoriteForUser(db: MockDb, userId: string, nftId: string): void {
  getNftById(db, nftId)
  db.favoritesByUser[userId] = (db.favoritesByUser[userId] ?? []).filter((id) => id !== nftId)
}
