import {
  getActiveScenarioId,
  SCENARIO_STORAGE_KEY,
  setActiveScenarioId,
  type ScenarioId,
} from '@/mocks/scenarios/registry'
import type { MockDb } from './schema'
import { createSeedDb, MOCK_DB_SCHEMA_VERSION } from './seed'

const MOCK_DB_STORAGE_KEY = 'nftmkt.mockdb.v1'

let currentDb: MockDb | null = null

function seedFor(scenarioId: ScenarioId): MockDb {
  return createSeedDb({ emptyCatalog: scenarioId === 'empty-catalog' })
}

function parseStoredDb(raw: string | null): MockDb | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as MockDb
    return parsed?.schemaVersion === MOCK_DB_SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function loadDb(): MockDb {
  if (currentDb) return currentDb
  const stored =
    typeof window !== 'undefined'
      ? parseStoredDb(window.localStorage.getItem(MOCK_DB_STORAGE_KEY))
      : null
  currentDb = stored ?? seedFor(getActiveScenarioId())
  if (!stored) saveDb()
  return currentDb
}

export function saveDb(): void {
  if (!currentDb || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(currentDb))
  } catch (error) {
    // A full localStorage must not break the request that is being answered.
    if (import.meta.env.DEV) console.warn('Mock db not persisted', error)
  }
}

function removeAppKeys(storage: Storage, keep: string[]): void {
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && (key.startsWith('nftmkt:') || key.startsWith('checkout-attempt:'))) keys.push(key)
  }
  for (const key of keys) {
    if (!keep.includes(key)) storage.removeItem(key)
  }
}

export function resetDb(nextScenarioId: ScenarioId = getActiveScenarioId()): MockDb {
  setActiveScenarioId(nextScenarioId)
  if (typeof window !== 'undefined') {
    removeAppKeys(window.localStorage, [SCENARIO_STORAGE_KEY])
    removeAppKeys(window.sessionStorage, [])
  }
  currentDb = seedFor(nextScenarioId)
  saveDb()
  return currentDb
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== MOCK_DB_STORAGE_KEY) return
    const next = parseStoredDb(event.newValue)
    if (next) currentDb = next
  })
}
