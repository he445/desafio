import { useSyncExternalStore } from 'react'

export type RealtimeStatus = 'idle' | 'connected' | 'disconnected'

let status: RealtimeStatus = 'idle'
const listeners = new Set<() => void>()

export function setRealtimeStatus(next: RealtimeStatus): void {
  if (next === status) return
  status = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(subscribe, () => status)
}
