import type { z } from 'zod'

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled' | 'parse'

export interface ApiErrorPayload {
  kind: ApiErrorKind
  status?: number
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  details?: Record<string, unknown>
  retryable: boolean
  requestId?: string
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code: string
  readonly fieldErrors?: Record<string, string[]>
  readonly details?: Record<string, unknown>
  readonly retryable: boolean
  readonly requestId?: string

  constructor(payload: ApiErrorPayload) {
    super(payload.message)
    this.name = 'ApiError'
    this.kind = payload.kind
    this.status = payload.status
    this.code = payload.code
    this.fieldErrors = payload.fieldErrors
    this.details = payload.details
    this.retryable = payload.retryable
    this.requestId = payload.requestId
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function parseApiResponse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  throw new ApiError({
    kind: 'parse',
    code: 'INVALID_RESPONSE',
    message: 'O servidor respondeu num formato inesperado.',
    retryable: false,
  })
}
