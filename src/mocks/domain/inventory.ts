import type { Edition, EthAmount, Nft } from '@/contracts'
import { compareEth } from '@/lib/eth'
import type { MockDb } from '@/mocks/db/schema'
import { MockHttpError } from './errors'

export function computePriceFrom(editions: Edition[]): EthAmount {
  const available = editions.filter((edition) => edition.available > 0)
  const source = available.length > 0 ? available : editions
  let min = source[0]?.price
  if (min === undefined) throw new Error('An NFT needs at least one edition')
  for (const edition of source) {
    if (compareEth(edition.price, min) < 0) min = edition.price
  }
  return min
}

export function findEdition(nft: Nft, editionId: string): Edition {
  const edition = nft.editions.find((item) => item.id === editionId)
  if (!edition) {
    throw new MockHttpError({ status: 404, code: 'NOT_FOUND', message: 'Edição não encontrada.' })
  }
  return edition
}

// Every price or stock change bumps the NFT version and the version of each cart that holds
// it, so cached quotes keyed by cartVersion are never reused with stale lines.
export function commitNftChange(db: MockDb, nft: Nft): Nft {
  nft.priceFrom = computePriceFrom(nft.editions)
  nft.version += 1
  for (const cart of Object.values(db.carts)) {
    let touched = false
    for (const item of cart.items) {
      if (item.nftId !== nft.id) continue
      const edition = nft.editions.find((candidate) => candidate.id === item.editionId)
      if (edition) {
        item.unitPrice = edition.price
        item.available = edition.available
      }
      item.nftVersion = nft.version
      touched = true
    }
    if (touched) cart.version += 1
  }
  return nft
}

export function changeNftEdition(
  db: MockDb,
  nft: Nft,
  params: { editionId: string; price?: EthAmount; available?: number },
): Nft {
  const edition = findEdition(nft, params.editionId)
  if (params.price !== undefined) edition.price = params.price
  if (params.available !== undefined) {
    edition.available = Math.max(0, Math.trunc(params.available))
  }
  return commitNftChange(db, nft)
}

export function adjustStock(db: MockDb, nft: Nft, editionId: string, delta: number): Nft {
  const edition = findEdition(nft, editionId)
  edition.available = Math.max(0, edition.available + delta)
  return commitNftChange(db, nft)
}
