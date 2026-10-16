import {
  FeaturedNftsResponseSchema,
  NftListResponseSchema,
  type CatalogSearch,
  type FeaturedNftsResponse,
  type Nft,
  type NftListResponse,
} from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'
import { recordResourceVersion } from '@/features/realtime/event-ledger'

function recordNftVersions(items: Nft[]): void {
  for (const nft of items) recordResourceVersion('nft', nft.id, nft.version)
}

export async function fetchNftListApi(
  search: CatalogSearch,
  opts?: { signal?: AbortSignal },
): Promise<NftListResponse> {
  const response = await http.get('/nfts', { params: search, signal: opts?.signal })
  const list = parseApiResponse(NftListResponseSchema, response.data)
  recordNftVersions(list.items)
  return list
}

export async function fetchFeaturedApi(opts?: {
  signal?: AbortSignal
}): Promise<FeaturedNftsResponse> {
  const response = await http.get('/nfts/featured', { signal: opts?.signal })
  const featured = parseApiResponse(FeaturedNftsResponseSchema, response.data)
  recordNftVersions(featured.items)
  return featured
}
