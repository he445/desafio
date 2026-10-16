import { describe, expect, it } from 'vitest'
import { toSafeRedirect } from './redirect'

describe('toSafeRedirect', () => {
  it('keeps same-origin paths with search and hash', () => {
    expect(toSafeRedirect('/checkout')).toBe('/checkout')
    expect(toSafeRedirect('/?q=ape&page=2#mercado')).toBe('/?q=ape&page=2#mercado')
  })

  it('drops anything that leaves the origin', () => {
    for (const value of [
      '//evil.com',
      '/\\evil.com',
      '/\\/evil.com',
      'https://evil.com/checkout',
      'javascript:alert(1)',
      'checkout',
      '',
      undefined,
    ]) {
      expect(toSafeRedirect(value)).toBeUndefined()
    }
  })
})
