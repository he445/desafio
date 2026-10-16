const BASE = 'https://kurio.invalid'

// Resolving against a fixed origin catches what a prefix check misses: browsers read
// `/\evil.com` as `//evil.com`, a different host.
export function toSafeRedirect(value: string | undefined): string | undefined {
  if (!value?.startsWith('/')) return undefined
  try {
    const url = new URL(value, BASE)
    return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : undefined
  } catch {
    return undefined
  }
}
