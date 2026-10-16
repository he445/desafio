import {
  AuthResponseSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
} from '@/contracts'
import { http, onSessionExpired } from '@/lib/http'

// Routes and hooks cannot import lib/http, so the expiration event is exposed from here.
export { onSessionExpired }

export async function fetchSession(opts?: { signal?: AbortSignal }): Promise<AuthResponse> {
  const response = await http.get('/auth/session', { signal: opts?.signal })
  return AuthResponseSchema.parse(response.data)
}

export async function loginApi(input: LoginInput): Promise<AuthResponse> {
  const response = await http.post('/auth/login', input)
  return AuthResponseSchema.parse(response.data)
}

export async function registerApi(input: RegisterInput): Promise<AuthResponse> {
  const response = await http.post('/auth/register', input)
  return AuthResponseSchema.parse(response.data)
}

export async function logoutApi(): Promise<void> {
  await http.post('/auth/logout')
}
