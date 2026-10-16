import { describe, expect, it } from 'vitest'
import { copy } from '@/content/copy'
import { avatarFileIssue } from './avatar'

describe('avatarFileIssue', () => {
  it('accepts PNG, JPEG and WebP up to 2 MB', () => {
    expect(avatarFileIssue({ type: 'image/png', size: 1024 })).toBeNull()
    expect(avatarFileIssue({ type: 'image/jpeg', size: 2 * 1024 * 1024 })).toBeNull()
    expect(avatarFileIssue({ type: 'image/webp', size: 10 })).toBeNull()
  })

  it('refuses other types before looking at the size', () => {
    expect(avatarFileIssue({ type: 'image/gif', size: 10 })).toBe(copy.account.avatarTypeError)
    expect(avatarFileIssue({ type: 'application/pdf', size: 10 ** 8 })).toBe(
      copy.account.avatarTypeError,
    )
  })

  it('refuses a file over 2 MB', () => {
    expect(avatarFileIssue({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toBe(
      copy.account.avatarSizeError,
    )
  })
})
