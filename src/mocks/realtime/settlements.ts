import type { SettlementRecord } from '@/mocks/db/schema'
import { loadDb, saveDb } from '@/mocks/db/store'
import { planSettlement, settleDueOrders } from '@/mocks/domain/orders'
import { broadcastNftUpdated, broadcastOrderUpdated } from './server'

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function settleDue(): void {
  const db = loadDb()
  const settled = settleDueOrders(db)
  if (settled.length === 0) return
  saveDb()
  for (const { order, mutatedNfts } of settled) {
    mutatedNfts.forEach(broadcastNftUpdated)
    broadcastOrderUpdated(order)
  }
}

function arm(settlement: SettlementRecord): void {
  clearTimeout(timers.get(settlement.orderId))
  const delayMs = Math.max(0, Date.parse(settlement.dueAt) - Date.now())
  timers.set(
    settlement.orderId,
    setTimeout(() => {
      timers.delete(settlement.orderId)
      settleDue()
    }, delayMs),
  )
}

export function scheduleSettlement(settlement: SettlementRecord): void {
  planSettlement(loadDb(), settlement)
  saveDb()
  arm(settlement)
}

// The due time lives in the mock db, so a reload or a second tab still settles the order.
export function resumeSettlements(): void {
  for (const settlement of Object.values(loadDb().settlements)) arm(settlement)
}
