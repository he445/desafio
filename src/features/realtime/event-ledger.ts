const MAX_SEEN_EVENT_IDS = 500
const seenEventIds: string[] = []
const seenEventSet = new Set<string>()
const resourceVersions = new Map<string, number>()
const sideEffectsExecuted = new Set<string>()

function resourceKey(kind: 'nft' | 'order', id: string): string {
  return `${kind}:${id}`
}

export function recordResourceVersion(kind: 'nft' | 'order', id: string, version: number): void {
  const key = resourceKey(kind, id)
  const current = resourceVersions.get(key) ?? 0
  if (version > current) {
    resourceVersions.set(key, version)
  }
}

export function getKnownResourceVersion(kind: 'nft' | 'order', id: string): number {
  return resourceVersions.get(resourceKey(kind, id)) ?? 0
}

export function shouldAcceptEvent(params: {
  eventId: string
  kind: 'nft' | 'order'
  id: string
  version: number
}): boolean {
  if (seenEventSet.has(params.eventId)) {
    return false
  }

  const currentVersion = getKnownResourceVersion(params.kind, params.id)
  if (params.version <= currentVersion) {
    seenEventSet.add(params.eventId)
    seenEventIds.push(params.eventId)
    if (seenEventIds.length > MAX_SEEN_EVENT_IDS) {
      const oldest = seenEventIds.shift()
      if (oldest) seenEventSet.delete(oldest)
    }
    return false
  }

  seenEventSet.add(params.eventId)
  seenEventIds.push(params.eventId)
  if (seenEventIds.length > MAX_SEEN_EVENT_IDS) {
    const oldest = seenEventIds.shift()
    if (oldest) seenEventSet.delete(oldest)
  }

  resourceVersions.set(resourceKey(params.kind, params.id), params.version)
  return true
}

export function markSideEffectOnce(kind: 'nft' | 'order', id: string, version: number): boolean {
  const key = `${kind}:${id}:v${version}`
  if (sideEffectsExecuted.has(key)) {
    return false
  }
  sideEffectsExecuted.add(key)
  return true
}

export function clearEventLedger(): void {
  seenEventIds.length = 0
  seenEventSet.clear()
  resourceVersions.clear()
  sideEffectsExecuted.clear()
}
