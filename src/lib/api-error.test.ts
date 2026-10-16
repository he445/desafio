import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiError, parseApiResponse } from './api-error'

const ItemSchema = z.object({ id: z.string(), quantity: z.number().int() })

describe('parseApiResponse', () => {
  it('returns the parsed payload', () => {
    expect(parseApiResponse(ItemSchema, { id: 'a', quantity: 2 })).toEqual({ id: 'a', quantity: 2 })
  })

  it('turns a payload outside the contract into an ApiError', () => {
    let thrown: unknown
    try {
      parseApiResponse(ItemSchema, { id: 'a', quantity: '2' })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    expect(thrown).toMatchObject({ kind: 'parse', code: 'INVALID_RESPONSE', retryable: false })
  })
})
