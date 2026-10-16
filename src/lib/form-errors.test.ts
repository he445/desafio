import { describe, expect, it } from 'vitest'
import { ApiError } from './api-error'
import { pickFieldErrors } from './form-errors'

const conflict = new ApiError({
  kind: 'http',
  status: 409,
  code: 'WALLET_CONFLICT',
  message: 'Conflito',
  fieldErrors: { role: ['Você já possui uma carteira principal.'], address: ['Já cadastrado'] },
  retryable: false,
})

describe('pickFieldErrors', () => {
  it('returns the first message of each known field in the order the form lists them', () => {
    expect(pickFieldErrors(conflict, ['label', 'address'])).toEqual([['address', 'Já cadastrado']])
  })

  it('reads nested paths as the server sends them', () => {
    const error = new ApiError({
      kind: 'http',
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'Revise os campos destacados.',
      fieldErrors: { 'holder.email': ['E-mail inválido'] },
      retryable: false,
    })
    expect(pickFieldErrors(error, ['holder.email'])).toEqual([['holder.email', 'E-mail inválido']])
  })

  it('returns nothing for errors without field details', () => {
    expect(pickFieldErrors(new Error('boom'), ['email'])).toEqual([])
    expect(pickFieldErrors(conflict, ['email'])).toEqual([])
  })
})
