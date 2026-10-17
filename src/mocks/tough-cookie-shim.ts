// MSW keeps a tough-cookie jar to hand the request cookies to the handlers and to store the ones
// their responses set. This API reads and sets no cookies, and the jar cost 25 KB on the first
// load plus a domain lookup for every handler MSW tries on every request, so it stays empty.
export class MemoryCookieStore {
  idx: Record<string, unknown> = {}
}

export class Cookie {
  static fromJSON(): null {
    return null
  }
}

export class CookieJar {
  getCookiesSync(): Cookie[] {
    return []
  }

  setCookie(): Promise<void> {
    return Promise.resolve()
  }
}
