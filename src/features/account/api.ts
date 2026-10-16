import {
  AvatarResponseSchema,
  ProfileSchema,
  WalletSchema,
  WalletsResponseSchema,
  type AvatarResponse,
  type ChangePasswordInput,
  type CreateWalletInput,
  type Profile,
  type UpdateProfileInput,
  type UpdateWalletInput,
  type Wallet,
} from '@/contracts'
import { parseApiResponse } from '@/lib/api-error'
import { http } from '@/lib/http'

export async function fetchProfileApi(opts?: { signal?: AbortSignal }): Promise<Profile> {
  const response = await http.get('/me/profile', { signal: opts?.signal })
  return parseApiResponse(ProfileSchema, response.data)
}

export async function updateProfileApi(input: UpdateProfileInput): Promise<Profile> {
  const response = await http.patch('/me/profile', input)
  return parseApiResponse(ProfileSchema, response.data)
}

export async function uploadAvatarApi(file: Blob): Promise<AvatarResponse> {
  const form = new FormData()
  form.append('file', file, file.type === 'image/webp' ? 'avatar.webp' : 'avatar')
  const response = await http.put('/me/avatar', form)
  return parseApiResponse(AvatarResponseSchema, response.data)
}

export async function removeAvatarApi(): Promise<AvatarResponse> {
  const response = await http.delete('/me/avatar')
  return parseApiResponse(AvatarResponseSchema, response.data)
}

export async function changePasswordApi(input: ChangePasswordInput): Promise<void> {
  await http.post('/me/password', input)
}

export async function fetchWalletsApi(opts?: { signal?: AbortSignal }): Promise<Wallet[]> {
  const response = await http.get('/me/wallets', { signal: opts?.signal })
  return parseApiResponse(WalletsResponseSchema, response.data).items
}

export async function createWalletApi(input: CreateWalletInput): Promise<Wallet> {
  const response = await http.post('/me/wallets', input)
  return parseApiResponse(WalletSchema, response.data)
}

export async function updateWalletApi(id: string, input: UpdateWalletInput): Promise<Wallet> {
  const response = await http.patch(`/me/wallets/${encodeURIComponent(id)}`, input)
  return parseApiResponse(WalletSchema, response.data)
}
