import { NftSchema, type Nft } from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'
import { recordResourceVersion } from '@/features/realtime/event-ledger'

export async function fetchNftApi(id: string, opts?: { signal?: AbortSignal }): Promise<Nft> {
  const response = await http.get(`/nfts/${encodeURIComponent(id)}`, { signal: opts?.signal })
  const nft = parseApiResponse(NftSchema, response.data)
  recordResourceVersion('nft', nft.id, nft.version)
  return nft
}
