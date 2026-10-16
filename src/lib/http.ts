import axios, { AxiosError } from 'axios'
import { ApiErrorEnvelopeSchema } from '@/contracts'
import { copy } from '@/content/copy'
import { ApiError } from './api-error'
import { getGuestCartId, getSessionToken } from './storage'

type SessionExpiredListener = () => void
const sessionExpiredListeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 8000,
  // Reports timeouts as ETIMEDOUT; axios also uses ECONNABORTED for aborted requests.
  transitional: { clarifyTimeoutError: true },
  paramsSerializer: { indexes: null },
})

http.interceptors.request.use((config) => {
  config.headers.set('X-Request-Id', crypto.randomUUID())
  const token = getSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  const guestCartId = getGuestCartId()
  if (guestCartId) config.headers.set('X-Guest-Cart-Id', guestCartId)
  return config
})

export function toApiError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return new ApiError({
      kind: 'canceled',
      code: 'CANCELED',
      message: copy.errors.canceled,
      retryable: false,
    })
  }
  if (!(error instanceof AxiosError)) {
    return new ApiError({
      kind: 'network',
      code: 'UNKNOWN_ERROR',
      message: copy.errors.unexpected,
      retryable: false,
    })
  }
  if (error.code === AxiosError.ETIMEDOUT) {
    return new ApiError({
      kind: 'timeout',
      code: 'TIMEOUT',
      message: copy.errors.timeout,
      retryable: true,
    })
  }
  if (!error.response) {
    return new ApiError({
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: copy.errors.network,
      retryable: true,
    })
  }

  const { status, data } = error.response
  const envelope = ApiErrorEnvelopeSchema.safeParse(data)
  if (envelope.success) {
    const { code, message, fieldErrors, details, retryable, requestId } = envelope.data.error
    return new ApiError({
      kind: 'http',
      status,
      code,
      message,
      fieldErrors,
      details,
      retryable,
      requestId,
    })
  }
  return new ApiError({
    kind: 'http',
    status,
    code: status >= 500 ? 'INTERNAL' : 'HTTP_ERROR',
    message: status >= 500 ? copy.errors.server : copy.errors.request,
    retryable: status === 429 || status === 500 || status === 503,
  })
}

http.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = toApiError(error)
  if (apiError.status === 401 && apiError.code === 'SESSION_EXPIRED') {
    for (const listener of sessionExpiredListeners) listener()
  }
  return Promise.reject(apiError)
})
