import { describe, expect, it } from 'vitest'
import { PasswordSchema, SessionSchema, VALIDATION_MESSAGES } from './index'
import { CatalogSearchSchema } from './nfts'

describe('CatalogSearchSchema', () => {
  it('keeps text and price filters that the router decoded as numbers', () => {
    const search = CatalogSearchSchema.parse({ q: 2024, minPrice: 0.5, maxPrice: 12.3, page: 2 })
    expect(search).toMatchObject({ q: '2024', minPrice: '0.5', maxPrice: '12.3', page: 2 })
  })

  it('falls back to defaults instead of throwing on hand-edited URLs', () => {
    const search = CatalogSearchSchema.parse({
      tab: 'popular',
      sort: 'cheapest',
      page: -3,
      pageSize: 500,
      minPrice: '1,5',
      network: 'bitcoin',
      q: { nested: true },
    })
    expect(search).toEqual({ tab: 'all', status: 'all', sort: 'recent', page: 1, pageSize: 9 })
  })
})

describe('PasswordSchema', () => {
  it('explains which rule failed', () => {
    const issues = (value: string) =>
      PasswordSchema.safeParse(value).error?.issues.map((issue) => issue.message) ?? []

    expect(issues('Ab1')).toContain(VALIDATION_MESSAGES.passwordMin)
    expect(issues('abcdefgh')).toEqual([VALIDATION_MESSAGES.passwordLetterAndDigit])
    expect(issues('12345678')).toEqual([VALIDATION_MESSAGES.passwordLetterAndDigit])
    expect(issues('Senha@1234')).toEqual([])
  })
})

describe('timestamps', () => {
  it('accept only ISO 8601 instants', () => {
    const session = { token: 'tok', userId: 'user-1', expiresAt: '2026-07-29T15:30:00.000Z' }
    expect(SessionSchema.safeParse(session).success).toBe(true)
    expect(SessionSchema.safeParse({ ...session, expiresAt: '29/07/2026 15:30' }).success).toBe(
      false,
    )
  })
})
