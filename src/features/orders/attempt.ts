import type { CreateOrderInput } from '@/contracts'

export interface CheckoutAttempt {
  key: string
  quoteId: string
  bodyHash: string
}

function storageKey(userId: string): string {
  return `checkout-attempt:${userId}`
}

export function loadCheckoutAttempt(userId: string): CheckoutAttempt | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const parsed = raw ? (JSON.parse(raw) as Partial<CheckoutAttempt>) : null
    if (parsed?.key && parsed.quoteId && parsed.bodyHash) return parsed as CheckoutAttempt
  } catch {
    // A blocked or corrupted storage only means the next confirmation gets a new key.
  }
  return null
}

export function clearCheckoutAttempt(userId: string): void {
  try {
    window.localStorage.removeItem(storageKey(userId))
  } catch {
    // Nothing to clean when the storage is unavailable.
  }
}

async function hashBody(body: CreateOrderInput): Promise<string> {
  const canonical = JSON.stringify({
    quoteId: body.quoteId,
    connectionId: body.connectionId,
    buyer: body.buyer,
  })
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// The same body keeps its key across retries, refreshes and reconnections; only a different
// body (a new quote, connection or buyer) earns a new one.
export async function checkoutAttemptFor(
  userId: string,
  body: CreateOrderInput,
): Promise<CheckoutAttempt> {
  const bodyHash = await hashBody(body)
  const stored = loadCheckoutAttempt(userId)
  if (stored?.bodyHash === bodyHash) return stored
  const attempt = { key: crypto.randomUUID(), quoteId: body.quoteId, bodyHash }
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(attempt))
  } catch {
    // Without storage the key still covers the retries of this page.
  }
  return attempt
}
