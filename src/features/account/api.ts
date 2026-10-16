import { ProfileSchema, WalletsResponseSchema, type Profile, type Wallet } from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'

export async function fetchProfileApi(opts?: { signal?: AbortSignal }): Promise<Profile> {
  const response = await http.get('/me/profile', { signal: opts?.signal })
  return parseApiResponse(ProfileSchema, response.data)
}

export async function fetchWalletsApi(opts?: { signal?: AbortSignal }): Promise<Wallet[]> {
  const response = await http.get('/me/wallets', { signal: opts?.signal })
  return parseApiResponse(WalletsResponseSchema, response.data).items
}
