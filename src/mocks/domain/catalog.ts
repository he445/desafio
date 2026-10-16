import {
  CatalogSearchSchema,
  type CatalogFacets,
  type CatalogSearch,
  type EthAmount,
  type Nft,
  type NftListResponse,
} from '@/contracts'
import { compareEth } from '@/lib/eth'
import type { MockDb } from '@/mocks/db/schema'
import { computePriceFrom, SEED_REFERENCE_DATE } from '@/mocks/db/seed'
import { MockHttpError } from './errors'

const FEATURED_ORDER = ['emerald-ape-042', 'ivory-baron-088', 'golden-beat-207', 'sage-nomad-009']

function isNftAvailable(nft: Nft): boolean {
  return nft.editions.some((ed) => ed.available > 0)
}

function matchesBaseFilters(
  nft: Nft,
  search: CatalogSearch,
  ignoreFacet?: 'category' | 'network' | 'collection' | 'price',
): boolean {
  if (search.q) {
    const q = search.q.trim().toLowerCase()
    if (q) {
      const hay = [nft.title, nft.collection.name, nft.category, nft.tokenId, ...nft.attributes]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
  }

  if (search.tab === 'trending' && !nft.trending) {
    return false
  }

  if (search.tab === 'new') {
    const refMs = new Date(SEED_REFERENCE_DATE).getTime()
    const nftMs = new Date(nft.createdAt).getTime()
    const diffDays = (refMs - nftMs) / 86_400_000
    if (diffDays > 14) return false
  }

  if (search.status === 'available' && !isNftAvailable(nft)) {
    return false
  }
  if (search.status === 'sold_out' && isNftAvailable(nft)) {
    return false
  }

  if (ignoreFacet !== 'collection' && search.collection) {
    if (nft.collection.id !== search.collection) return false
  }

  if (ignoreFacet !== 'category' && search.category) {
    if (nft.category !== search.category) return false
  }

  if (ignoreFacet !== 'network' && search.network) {
    if (nft.network !== search.network) return false
  }

  if (ignoreFacet !== 'price') {
    if (search.minPrice && compareEth(nft.priceFrom, search.minPrice) < 0) {
      return false
    }
    if (search.maxPrice && compareEth(nft.priceFrom, search.maxPrice) > 0) {
      return false
    }
  }

  return true
}

function buildFacets(allNfts: Nft[], search: CatalogSearch): CatalogFacets {
  const categories: Record<string, number> = {}
  const networks: Record<string, number> = {}
  const collections: Record<string, number> = {}

  for (const nft of allNfts) {
    if (matchesBaseFilters(nft, search, 'category')) {
      categories[nft.category] = (categories[nft.category] ?? 0) + 1
    }
    if (matchesBaseFilters(nft, search, 'network')) {
      networks[nft.network] = (networks[nft.network] ?? 0) + 1
    }
    if (matchesBaseFilters(nft, search, 'collection')) {
      collections[nft.collection.id] = (collections[nft.collection.id] ?? 0) + 1
    }
  }

  let minPrice: EthAmount = '0.02'
  let maxPrice: EthAmount = '12.3'

  if (allNfts.length > 0) {
    minPrice = allNfts[0]!.priceFrom
    maxPrice = allNfts[0]!.priceFrom
    for (const nft of allNfts) {
      if (compareEth(nft.priceFrom, minPrice) < 0) minPrice = nft.priceFrom
      if (compareEth(nft.priceFrom, maxPrice) > 0) maxPrice = nft.priceFrom
    }
  }

  return {
    categories,
    networks,
    collections,
    priceRange: { min: minPrice, max: maxPrice },
  }
}

export function queryNfts(db: MockDb, rawQuery: Record<string, unknown>): NftListResponse {
  const query = CatalogSearchSchema.parse(rawQuery)
  const filtered = db.nfts.filter((nft) => matchesBaseFilters(nft, query))

  const sorted = [...filtered].sort((a, b) => {
    switch (query.sort) {
      case 'price_asc': {
        const cmp = compareEth(a.priceFrom, b.priceFrom)
        return cmp !== 0 ? cmp : a.id.localeCompare(b.id)
      }
      case 'price_desc': {
        const cmp = compareEth(b.priceFrom, a.priceFrom)
        return cmp !== 0 ? cmp : a.id.localeCompare(b.id)
      }
      case 'title_asc':
        return a.title.localeCompare(b.title, 'pt-BR')
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
  const start = (query.page - 1) * query.pageSize
  const items = sorted.slice(start, start + query.pageSize)
  const facets = buildFacets(db.nfts, query)

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
    facets,
    query,
  }
}

export function getFeaturedNfts(db: MockDb): Nft[] {
  const featured = db.nfts.filter((nft) => nft.featured)
  return featured.sort((a, b) => {
    const idxA = FEATURED_ORDER.indexOf(a.id)
    const idxB = FEATURED_ORDER.indexOf(b.id)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return 0
  })
}

export function getNftById(db: MockDb, id: string): Nft {
  const nft = db.nfts.find((item) => item.id === id)
  if (!nft) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'NFT não encontrado.',
    })
  }
  return nft
}

export function changeNftEdition(
  db: MockDb,
  params: {
    nftId: string
    editionId: string
    price?: EthAmount
    available?: number
  },
): Nft {
  const nft = getNftById(db, params.nftId)
  const edition = nft.editions.find((ed) => ed.id === params.editionId)
  if (!edition) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Edição não encontrada.',
    })
  }

  if (params.price !== undefined) {
    edition.price = params.price
  }
  if (params.available !== undefined) {
    edition.available = Math.max(0, Math.trunc(params.available))
  }

  nft.priceFrom = computePriceFrom(nft.editions, edition.price)
  nft.version += 1

  for (const cart of Object.values(db.carts)) {
    let touched = false
    for (const item of cart.items) {
      if (item.nftId === nft.id && item.editionId === edition.id) {
        item.unitPrice = edition.price
        item.available = edition.available
        item.nftVersion = nft.version
        touched = true
      } else if (item.nftId === nft.id) {
        item.nftVersion = nft.version
        touched = true
      }
    }
    if (touched) {
      cart.version += 1
    }
  }

  return nft
}
