import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-4 py-2', false, null, undefined, 'px-6')).toBe('py-2 px-6')
  })
})
