// tough-cookie (pulled in by MSW for its cookie jar) asks tldts for the registrable domain, and
// tldts ships the whole public suffix list: about 60 KB gzip on the first load. Answering with the
// host itself is the strictest reading: a mocked response can only set host-only cookies, and the
// app does not use cookies at all.
export function getDomain(hostname: string): string | null {
  return hostname === '' ? null : hostname
}
