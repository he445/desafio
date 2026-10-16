type AnnounceListener = (text: string) => void
const listeners = new Set<AnnounceListener>()
let pendingMessages: string[] = []
let batchTimer: ReturnType<typeof setTimeout> | null = null

export function announce(message: string): void {
  const trimmed = message.trim()
  if (!trimmed) return
  if (!pendingMessages.includes(trimmed)) {
    pendingMessages.push(trimmed)
  }

  if (batchTimer) {
    clearTimeout(batchTimer)
  }

  batchTimer = setTimeout(() => {
    const combined = pendingMessages.join('. ')
    pendingMessages = []
    batchTimer = null
    for (const listener of listeners) {
      listener(combined)
    }
  }, 120)
}

export function subscribeAnnouncer(listener: AnnounceListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
