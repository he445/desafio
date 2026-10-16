import {
  AxiosError,
  CanceledError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, onSessionExpired, toApiError } from './http'
import { GUEST_CART_ID_KEY, SESSION_STORAGE_KEY } from './storage'

function responseError(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig
  return new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  })
}

function rejectWith(error: AxiosError): AxiosAdapter {
  return async (config) => {
    error.config = config
    throw error
  }
}

function envelope(code: string, extra: Record<string, unknown> = {}) {
  return {
    error: {
      code,
      message: 'Mensagem do servidor',
      retryable: false,
      requestId: 'req-1',
      ...extra,
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('toApiError', () => {
  it('keeps the envelope fields of an error response', () => {
    const error = toApiError(
      responseError(422, envelope('VALIDATION_ERROR', { fieldErrors: { email: ['Inválido'] } })),
    )

    expect(error).toMatchObject({
      kind: 'http',
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Mensagem do servidor',
      fieldErrors: { email: ['Inválido'] },
      retryable: false,
      requestId: 'req-1',
    })
  })

  it('falls back to a generic error when the body is not an envelope', () => {
    expect(toApiError(responseError(503, '<html>Bad gateway</html>'))).toMatchObject({
      kind: 'http',
      status: 503,
      code: 'INTERNAL',
      retryable: true,
    })
    expect(toApiError(responseError(404, { message: 'not found' }))).toMatchObject({
      kind: 'http',
      status: 404,
      code: 'HTTP_ERROR',
      retryable: false,
    })
  })

  it('tells a timeout apart from an aborted connection', () => {
    expect(
      toApiError(new AxiosError('timeout of 8000ms exceeded', AxiosError.ETIMEDOUT)),
    ).toMatchObject({ kind: 'timeout', code: 'TIMEOUT', retryable: true })
    expect(toApiError(new AxiosError('Request aborted', AxiosError.ECONNABORTED))).toMatchObject({
      kind: 'network',
      code: 'NETWORK_ERROR',
    })
  })

  it('reports a canceled request without offering a retry', () => {
    expect(toApiError(new CanceledError())).toMatchObject({ kind: 'canceled', retryable: false })
  })
})

describe('http instance', () => {
  it('sends the stored session and guest cart with every request', async () => {
    const values = new Map([
      [SESSION_STORAGE_KEY, JSON.stringify({ token: 'tok-1', userId: 'user-1' })],
      [GUEST_CART_ID_KEY, 'guest-1'],
    ])
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => values.get(key) ?? null } })

    let headers: InternalAxiosRequestConfig['headers'] | undefined
    await http.get('/cart', {
      adapter: async (config) => {
        headers = config.headers
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      },
    })

    expect(headers?.get('Authorization')).toBe('Bearer tok-1')
    expect(headers?.get('X-Guest-Cart-Id')).toBe('guest-1')
    expect(headers?.get('X-Request-Id')).toEqual(expect.any(String))
  })

  it('notifies listeners only when the server reports an expired session', async () => {
    const listener = vi.fn()
    const unsubscribe = onSessionExpired(listener)

    await expect(
      http.get('/me', { adapter: rejectWith(responseError(401, envelope('UNAUTHORIZED'))) }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
    expect(listener).not.toHaveBeenCalled()

    await expect(
      http.get('/me', { adapter: rejectWith(responseError(401, envelope('SESSION_EXPIRED'))) }),
    ).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
  })
})
