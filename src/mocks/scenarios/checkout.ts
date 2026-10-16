import type { CreateOrderInput, Nft, OrderRejectionReason } from '@/contracts'
import { addEth } from '@/lib/eth'
import type { MockDb } from '@/mocks/db/schema'
import { MockHttpError } from '@/mocks/domain/errors'
import { changeNftEdition } from '@/mocks/domain/inventory'
import { dropWalletConnection } from '@/mocks/domain/orders'
import type { ScenarioId } from './registry'

export const SETTLEMENT_DELAY_MS = 1500
export const ORDER_TIMEOUT_RESPONSE_MS = 10_000
const SHORT_SESSION_TTL_MS = 60_000

export function sessionTtlFor(scenario: ScenarioId): number | undefined {
  return scenario === 'session-expired' ? SHORT_SESSION_TTL_MS : undefined
}

export function assertWalletConnectionAllowed(scenario: ScenarioId): void {
  if (scenario === 'wallet-rejected') {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_REJECTED',
      message: 'A conexão foi recusada na carteira.',
    })
  }
}

// Runs before the domain validates POST /orders, once per user, so the client meets the
// failure through the same checks a real change would trip (connection, stock, price).
export function disruptFirstOrder(
  db: MockDb,
  userId: string,
  input: CreateOrderInput,
  scenario: ScenarioId,
): Nft[] {
  const mark = `${scenario}:${userId}`
  if (db.scenarioMarks[mark]) return []

  if (scenario === 'wallet-disconnect') {
    db.scenarioMarks[mark] = true
    dropWalletConnection(db, input.connectionId)
    return []
  }

  if (scenario !== 'price-change-checkout' && scenario !== 'sold-out-checkout') return []
  const line = db.quotes[input.quoteId]?.lines[0]
  const nft = line && db.nfts.find((candidate) => candidate.id === line.nftId)
  const edition = nft?.editions.find((candidate) => candidate.id === line?.editionId)
  if (!line || !nft || !edition) return []

  db.scenarioMarks[mark] = true
  return [
    changeNftEdition(
      db,
      nft,
      scenario === 'price-change-checkout'
        ? { editionId: edition.id, price: addEth(edition.price, '0.15') }
        : { editionId: edition.id, available: 0 },
    ),
  ]
}

export function settlementOutcome(scenario: ScenarioId): {
  status: 'confirmed' | 'rejected'
  rejectionReason: OrderRejectionReason
} {
  return scenario === 'payment-declined'
    ? { status: 'rejected', rejectionReason: 'insufficient_funds' }
    : { status: 'confirmed', rejectionReason: null }
}
