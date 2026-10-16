import { describe, expect, it } from 'vitest'
import type { FavoritesResponse, Nft } from '@/contracts'
import { toggleFavorite } from './toggle'

const nft = (id: string) => ({ id }) as Nft

describe('toggleFavorite', () => {
  const favorites: FavoritesResponse = { nftIds: ['a'], items: [nft('a')] }

  it('adds the NFT once, at the end of the list', () => {
    const added = toggleFavorite(favorites, nft('b'), true)
    expect(added?.nftIds).toEqual(['a', 'b'])
    expect(toggleFavorite(added, nft('b'), true)?.nftIds).toEqual(['a', 'b'])
  })

  it('removes the NFT from the ids and the items', () => {
    expect(toggleFavorite(favorites, nft('a'), false)).toEqual({ nftIds: [], items: [] })
  })

  it('leaves an empty cache alone, so the next fetch is the source of truth', () => {
    expect(toggleFavorite(undefined, nft('a'), true)).toBeUndefined()
  })
})
