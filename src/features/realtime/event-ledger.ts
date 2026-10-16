type ResourceKind = 'nft' | 'order'

const MAX_SEEN_EVENT_IDS = 500
// A Set iterates in insertion order, so its first entry is the oldest id.
const seenEventIds = new Set<string>()
const resourceVersions = new Map<string, number>()
const sideEffectVersions = new Map<string, number>()

function resourceKey(kind: ResourceKind, id: string): string {
  return `${kind}:${id}`
}

function rememberEventId(eventId: string): void {
  seenEventIds.add(eventId)
  if (seenEventIds.size > MAX_SEEN_EVENT_IDS) {
    const oldest = seenEventIds.values().next().value
    if (oldest !== undefined) seenEventIds.delete(oldest)
  }
}

export function recordResourceVersion(kind: ResourceKind, id: string, version: number): void {
  const key = resourceKey(kind, id)
  if (version > (resourceVersions.get(key) ?? 0)) resourceVersions.set(key, version)
}

export function getKnownResourceVersion(kind: ResourceKind, id: string): number {
  return resourceVersions.get(resourceKey(kind, id)) ?? 0
}

// An event passes once, and only when it is newer than the version already known, whether
// that version came from another event or from an HTTP response.
export function shouldAcceptEvent(event: {
  eventId: string
  kind: ResourceKind
  id: string
  version: number
}): boolean {
  if (seenEventIds.has(event.eventId)) return false
  rememberEventId(event.eventId)
  if (event.version <= getKnownResourceVersion(event.kind, event.id)) return false
  resourceVersions.set(resourceKey(event.kind, event.id), event.version)
  return true
}

// Toasts, navigation and announcements run once per resource version, and never for a version
// older than one that already ran.
export function markSideEffectOnce(kind: ResourceKind, id: string, version: number): boolean {
  const key = resourceKey(kind, id)
  if (version <= (sideEffectVersions.get(key) ?? 0)) return false
  sideEffectVersions.set(key, version)
  return true
}

export function clearEventLedger(): void {
  seenEventIds.clear()
  resourceVersions.clear()
  sideEffectVersions.clear()
}
