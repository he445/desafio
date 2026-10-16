export class MockHttpError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors?: Record<string, string[]>
  readonly details?: Record<string, unknown>
  readonly retryable: boolean

  constructor(params: {
    status: number
    code: string
    message: string
    fieldErrors?: Record<string, string[]>
    details?: Record<string, unknown>
    retryable?: boolean
  }) {
    super(params.message)
    this.name = 'MockHttpError'
    this.status = params.status
    this.code = params.code
    this.fieldErrors = params.fieldErrors
    this.details = params.details
    this.retryable =
      params.retryable ?? (params.status === 429 || params.status === 500 || params.status === 503)
  }
}
