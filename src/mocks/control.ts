import type { EthAmount } from '@/contracts'
import { getActiveScenarioId, loadDb, resetDb, saveDb, setActiveScenarioId } from '@/mocks/db/store'
import { changeNftEdition } from '@/mocks/domain/catalog'
import { transitionOrderState } from '@/mocks/domain/orders'
import { expireActiveSessions } from '@/mocks/domain/session'
import {
  broadcastNftUpdated,
  broadcastOrderUpdated,
  dropAllSockets,
  emitRawRealtimeEvent,
} from '@/mocks/realtime/server'
import {
  clearCustomNetworkRules,
  holdMatchingRequest,
  releaseRequestGate,
  resetNetworkState,
  SCENARIOS,
  setCustomNetworkRules,
  type NetworkRule,
} from '@/mocks/scenarios'

export interface MockControl {
  getScenario(): string
  getScenarios(): typeof SCENARIOS
  setScenario(id: string): Promise<void>
  reset(id?: string): Promise<void>
  setRules(rules: NetworkRule[]): void
  clearRules(): void
  hold(match: NetworkRule['match']): string
  release(gate: string): void
  changeEdition(input: {
    nftId: string
    editionId: string
    price?: EthAmount
    available?: number
  }): void
  resolveOrder(orderId: string, status: 'confirmed' | 'rejected'): void
  emitRaw(event: {
    eventId: string
    type: string
    resource: { kind: string; id: string }
    version: number
    occurredAt: string
    userId?: string
    data: unknown
  }): void
  dropSockets(opts?: { refuseForMs?: number }): void
  expireSession(): void
  countOrders(userId: string): number
}

export function createMockControl(): MockControl {
  return {
    getScenario() {
      return getActiveScenarioId()
    },
    getScenarios() {
      return SCENARIOS
    },
    async setScenario(id: string) {
      resetNetworkState()
      setActiveScenarioId(id)
      const db = loadDb()
      if (id === 'empty-catalog') {
        resetDb(id)
      } else if (db.nfts.length === 0) {
        resetDb(id)
      }
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    },
    async reset(id?: string) {
      resetNetworkState()
      resetDb(id)
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    },
    setRules(rules: NetworkRule[]) {
      setCustomNetworkRules(rules)
    },
    clearRules() {
      clearCustomNetworkRules()
    },
    hold(match: NetworkRule['match']) {
      return holdMatchingRequest(match)
    },
    release(gate: string) {
      releaseRequestGate(gate)
    },
    changeEdition(input) {
      const db = loadDb()
      const updated = changeNftEdition(db, input)
      saveDb()
      broadcastNftUpdated(updated)
    },
    resolveOrder(orderId, status) {
      const db = loadDb()
      const result = transitionOrderState(
        db,
        orderId,
        status,
        status === 'rejected' ? 'insufficient_funds' : null,
      )
      if (result) {
        saveDb()
        for (const nft of result.mutatedNfts) {
          broadcastNftUpdated(nft)
        }
        broadcastOrderUpdated(result.order)
      }
    },
    emitRaw(event) {
      emitRawRealtimeEvent(event)
    },
    dropSockets(opts) {
      dropAllSockets(opts)
    },
    expireSession() {
      const db = loadDb()
      expireActiveSessions(db)
      saveDb()
    },
    countOrders(userId: string) {
      const db = loadDb()
      return Object.values(db.orders).filter(
        (o) => o.userId === userId && !o.id.startsWith('order-seed-'),
      ).length
    },
  }
}

declare global {
  interface Window {
    __mock?: MockControl
  }
}
