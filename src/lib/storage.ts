import type { Session } from '@/contracts'

export const SESSION_STORAGE_KEY = 'nftmkt:session'
export const GUEST_CART_ID_KEY = 'nftmkt:guest-cart-id'
export const RESUME_STORAGE_KEY = 'nftmkt:resume'

export interface ResumeContext {
  href: string
  reason: 'expired'
}

export function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Session
    if (parsed && typeof parsed.token === 'string' && typeof parsed.userId === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function getSessionToken(): string | null {
  return getStoredSession()?.token ?? null
}

export function setStoredSession(session: Session): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getGuestCartId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(GUEST_CART_ID_KEY)
}

export function getOrCreateGuestCartId(): string {
  const existing = window.localStorage.getItem(GUEST_CART_ID_KEY)
  if (existing) return existing
  const created = `guest-${crypto.randomUUID()}`
  window.localStorage.setItem(GUEST_CART_ID_KEY, created)
  return created
}

export function clearGuestCartId(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(GUEST_CART_ID_KEY)
}

export function saveResumeContext(ctx: ResumeContext): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(ctx))
}

export function consumeResumeContext(): ResumeContext | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(RESUME_STORAGE_KEY)
  if (!raw) return null
  window.sessionStorage.removeItem(RESUME_STORAGE_KEY)
  try {
    return JSON.parse(raw) as ResumeContext
  } catch {
    return null
  }
}
