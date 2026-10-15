import axios, { AxiosError } from 'axios'
import { ApiError } from './api-error'

type SessionExpiredListener = () => void
const sessionExpiredListeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

export function emitSessionExpired(): void {
  for (const listener of sessionExpiredListeners) {
    listener()
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 8000,
  paramsSerializer: {
    indexes: null,
  },
})

http.interceptors.request.use((config) => {
  config.headers.set('X-Request-Id', crypto.randomUUID())

  if (typeof window !== 'undefined') {
    const rawSession = window.localStorage.getItem('nftmkt:session')
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as { token?: string }
        if (parsed.token) {
          config.headers.set('Authorization', `Bearer ${parsed.token}`)
        }
      } catch {
        // Ignore malformed local session
      }
    }

    const guestCartId = window.localStorage.getItem('nftmkt:guest-cart-id')
    if (guestCartId) {
      config.headers.set('X-Guest-Cart-Id', guestCartId)
    }
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(
        new ApiError({
          kind: 'canceled',
          code: 'CANCELED',
          message: 'Requisição cancelada.',
          retryable: false,
        }),
      )
    }

    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
        return Promise.reject(
          new ApiError({
            kind: 'timeout',
            code: 'TIMEOUT',
            message: 'A operação demorou mais que o esperado. Tente novamente.',
            retryable: true,
          }),
        )
      }

      if (!error.response) {
        return Promise.reject(
          new ApiError({
            kind: 'network',
            code: 'NETWORK_ERROR',
            message: 'Sem conexão com o servidor. Verifique sua rede e tente novamente.',
            retryable: true,
          }),
        )
      }

      const status = error.response.status
      const envelope = (
        error.response.data as {
          error?: {
            code?: string
            message?: string
            fieldErrors?: Record<string, string[]>
            details?: Record<string, unknown>
            retryable?: boolean
            requestId?: string
          }
        } | null
      )?.error

      const code = envelope?.code ?? (status >= 500 ? 'INTERNAL' : 'HTTP_ERROR')
      const message =
        envelope?.message ??
        (status >= 500
          ? 'Erro temporário no servidor. Tente novamente.'
          : 'Não foi possível concluir a solicitação.')
      const retryable = envelope?.retryable ?? (status === 429 || status === 500 || status === 503)

      if (status === 401 && code === 'SESSION_EXPIRED') {
        emitSessionExpired()
      }

      return Promise.reject(
        new ApiError({
          kind: 'http',
          status,
          code,
          message,
          fieldErrors: envelope?.fieldErrors,
          details: envelope?.details,
          retryable,
          requestId: envelope?.requestId,
        }),
      )
    }

    return Promise.reject(
      new ApiError({
        kind: 'network',
        code: 'UNKNOWN_ERROR',
        message: 'Ocorreu um erro inesperado.',
        retryable: false,
      }),
    )
  },
)
