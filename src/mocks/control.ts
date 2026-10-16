import { EthAmountSchema, type EthAmount } from '@/contracts'
import { loadDb, resetDb, saveDb } from '@/mocks/db/store'
import { getNftById } from '@/mocks/domain/catalog'
import { changeNftEdition } from '@/mocks/domain/inventory'
import { transitionOrderState } from '@/mocks/domain/orders'
import { expireActiveSessions } from '@/mocks/domain/session'
import {
  broadcastNftUpdated,
  broadcastOrderUpdated,
  dropAllSockets,
  emitRawRealtimeEvent,
  listConnectedUsers,
} from '@/mocks/realtime/server'
import {
  clearCustomNetworkRules,
  holdMatchingRequest,
  releaseRequestGate,
  resetNetworkState,
  setCustomNetworkRules,
  type NetworkRule,
} from '@/mocks/scenarios/network'
import {
  getActiveScenarioId,
  isScenarioId,
  SCENARIOS,
  setActiveScenarioId,
  type ScenarioDescriptor,
  type ScenarioId,
} from '@/mocks/scenarios/registry'

export interface MockControl {
  getScenario(): ScenarioId
  getScenarios(): readonly ScenarioDescriptor[]
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
  listSockets(): (string | null)[]
  expireSession(): void
  countOrders(userId: string): number
}

function toScenarioId(id: string): ScenarioId {
  if (!isScenarioId(id)) throw new Error(`Unknown mock scenario "${id}"`)
  return id
}

export function applyScenario(id: ScenarioId): void {
  resetNetworkState()
  setActiveScenarioId(id)
  if (id === 'empty-catalog' || loadDb().nfts.length === 0) resetDb(id)
}

export function createMockControl(): MockControl {
  return {
    getScenario: getActiveScenarioId,
    getScenarios: () => SCENARIOS,
    async setScenario(id) {
      applyScenario(toScenarioId(id))
      window.location.reload()
    },
    async reset(id) {
      resetNetworkState()
      resetDb(id === undefined ? undefined : toScenarioId(id))
      window.location.reload()
    },
    setRules: setCustomNetworkRules,
    clearRules: clearCustomNetworkRules,
    hold: holdMatchingRequest,
    release: releaseRequestGate,
    changeEdition({ nftId, editionId, price, available }) {
      const db = loadDb()
      const nft = changeNftEdition(db, getNftById(db, nftId), {
        editionId,
        price: price === undefined ? undefined : EthAmountSchema.parse(price),
        available,
      })
      saveDb()
      broadcastNftUpdated(nft)
    },
    resolveOrder(orderId, status) {
      const db = loadDb()
      const result = transitionOrderState(
        db,
        orderId,
        status,
        status === 'rejected' ? 'insufficient_funds' : null,
      )
      if (!result) return
      saveDb()
      result.mutatedNfts.forEach(broadcastNftUpdated)
      broadcastOrderUpdated(result.order)
    },
    emitRaw: emitRawRealtimeEvent,
    dropSockets: dropAllSockets,
    listSockets: listConnectedUsers,
    expireSession() {
      expireActiveSessions(loadDb())
      saveDb()
    },
    // Seeded history is left out, so a test can assert "exactly one new order".
    countOrders(userId) {
      return Object.values(loadDb().orders).filter(
        (order) => order.userId === userId && !order.id.startsWith('order-seed-'),
      ).length
    },
  }
}
