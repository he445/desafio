import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { Nft, Order, RealtimeEvent } from '@/contracts'
import { loadDb } from '@/mocks/db/store'
import { findSessionUserId } from '@/mocks/domain/session'
import { getActiveScenarioId } from '@/mocks/scenarios/registry'

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'wss://realtime.nft-market.test'
const realtimeLink = ws.link(socketUrl)

interface TrackedConnection {
  connectionId: string
  userId: string | null
  emit: (event: string, payload: unknown) => void
  close: () => void
}

const activeConnections = new Map<string, TrackedConnection>()
let refuseConnectionsUntil = 0

export const realtimeWsHandler = realtimeLink.addEventListener('connection', (connection) => {
  const scenarioId = getActiveScenarioId()
  if (scenarioId === 'offline' || Date.now() < refuseConnectionsUntil) {
    connection.client.close(1013, 'Service unavailable')
    return
  }

  const io = toSocketIo(connection)
  const connectionId = crypto.randomUUID()

  const tracked: TrackedConnection = {
    connectionId,
    userId: null,
    emit: (event: string, payload: unknown) => {
      io.client.emit(event, payload)
    },
    close: () => {
      connection.client.close()
    },
  }

  activeConnections.set(connectionId, tracked)

  // The binding acknowledges CONNECT before exposing `auth`, so the token is read from the raw
  // Socket.IO packet (40{"token":"…"}). Without a valid token the connection stays anonymous.
  connection.client.addEventListener('message', (event) => {
    if (typeof event.data !== 'string' || !event.data.startsWith('40{')) return
    try {
      const { token } = JSON.parse(event.data.slice(2)) as { token?: unknown }
      tracked.userId = typeof token === 'string' ? findSessionUserId(loadDb(), token) : null
    } catch {
      tracked.userId = null
    }
  })

  // The binding announces pingInterval 25 s but never pings; without this the client closes
  // the socket with "ping timeout" after 30 s.
  const pingTimer = setInterval(() => {
    try {
      connection.client.send('2')
    } catch {
      clearInterval(pingTimer)
    }
  }, 20_000)

  connection.client.addEventListener('close', () => {
    clearInterval(pingTimer)
    activeConnections.delete(connectionId)
  })
})

export function emitRawRealtimeEvent(event: {
  eventId: string
  type: string
  resource: { kind: string; id: string }
  version: number
  occurredAt: string
  userId?: string
  data: unknown
}): void {
  const scenarioId = getActiveScenarioId()
  if (scenarioId === 'offline') return

  for (const conn of activeConnections.values()) {
    if (event.userId && conn.userId !== event.userId) {
      continue
    }
    conn.emit(event.type, event)

    if (scenarioId === 'duplicate-events') {
      conn.emit(event.type, event)
      if (event.version > 1) {
        conn.emit(event.type, {
          ...event,
          eventId: crypto.randomUUID(),
          version: event.version - 1,
        })
      }
    }
  }
}

export function broadcastNftUpdated(nft: Nft): void {
  const payload: RealtimeEvent = {
    eventId: crypto.randomUUID(),
    type: 'nft.updated',
    resource: { kind: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    data: {
      editions: nft.editions.map((ed) => ({
        id: ed.id,
        price: ed.price,
        available: ed.available,
      })),
      priceFrom: nft.priceFrom,
    },
  }
  emitRawRealtimeEvent(payload)
}

export function broadcastOrderUpdated(order: Order): void {
  const payload: RealtimeEvent = {
    eventId: crypto.randomUUID(),
    type: 'order.updated',
    resource: { kind: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    userId: order.userId,
    data: {
      status: order.status,
      rejectionReason: order.rejectionReason,
      transaction: order.transaction,
    },
  }
  emitRawRealtimeEvent(payload)
}

export function dropAllSockets(opts?: { refuseForMs?: number }): void {
  if (opts?.refuseForMs && opts.refuseForMs > 0) {
    refuseConnectionsUntil = Date.now() + opts.refuseForMs
  }
  for (const conn of activeConnections.values()) {
    conn.close()
  }
  activeConnections.clear()
}
