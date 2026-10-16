import {
  WalletConnectionResponseSchema,
  type WalletConnectionInput,
  type WalletConnectionResponse,
} from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'

export async function connectWalletApi(
  input: WalletConnectionInput,
): Promise<WalletConnectionResponse> {
  const response = await http.post('/wallet-connections', input)
  return parseApiResponse(WalletConnectionResponseSchema, response.data)
}

export async function disconnectWalletApi(connectionId: string): Promise<void> {
  await http.delete(`/wallet-connections/${connectionId}`)
}
