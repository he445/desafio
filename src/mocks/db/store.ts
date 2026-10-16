import type { MockDb } from './schema'
import { createSeedDb, MOCK_DB_SCHEMA_VERSION } from './seed'

export const MOCK_DB_STORAGE_KEY = 'nftmkt.mockdb.v1'
export const SCENARIO_STORAGE_KEY = 'nftmkt:scenario'

let currentDb: MockDb | null = null

export function getActiveScenarioId(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(SCENARIO_STORAGE_KEY)
    if (stored) return stored
  }
  return import.meta.env.VITE_MOCK_DEFAULT_SCENARIO || 'default'
}

export function setActiveScenarioId(scenarioId: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, scenarioId)
  }
  if (currentDb) {
    currentDb.scenarioId = scenarioId
    saveDb()
  }
}

export function loadDb(): MockDb {
  if (currentDb) return currentDb

  const scenarioId = getActiveScenarioId()
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(MOCK_DB_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as MockDb
        if (parsed && parsed.schemaVersion === MOCK_DB_SCHEMA_VERSION) {
          currentDb = parsed
          return currentDb
        }
      } catch {
        // Corrupted db falls back to fresh seed
      }
    }
  }

  currentDb = createSeedDb(scenarioId)
  saveDb()
  return currentDb
}

export function saveDb(): void {
  if (!currentDb || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(currentDb))
  } catch {
    // Ignore quota errors in simulation
  }
}

export function resetDb(nextScenarioId?: string): MockDb {
  const scenarioId =
    nextScenarioId ??
    (typeof window !== 'undefined' ? window.localStorage.getItem(SCENARIO_STORAGE_KEY) : null) ??
    import.meta.env.VITE_MOCK_DEFAULT_SCENARIO ??
    'default'

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, scenarioId)
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (
        k &&
        (k.startsWith('nftmkt:') || k.startsWith('checkout-attempt:')) &&
        k !== SCENARIO_STORAGE_KEY
      ) {
        keysToRemove.push(k)
      }
    }
    for (const k of keysToRemove) {
      window.localStorage.removeItem(k)
    }

    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i)
      if (k && k.startsWith('nftmkt:')) {
        sessionKeysToRemove.push(k)
      }
    }
    for (const k of sessionKeysToRemove) {
      window.sessionStorage.removeItem(k)
    }
  }

  currentDb = createSeedDb(scenarioId)
  saveDb()
  return currentDb
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === MOCK_DB_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as MockDb
        if (parsed && parsed.schemaVersion === MOCK_DB_SCHEMA_VERSION) {
          currentDb = parsed
        }
      } catch {
        // Ignore invalid cross-tab storage payload
      }
    }
  })
}
