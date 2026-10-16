import { useEffect, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { copy } from '@/content/copy'
import { qk } from '@/lib/query-keys'
import { useSessionQuery } from '@/features/auth/queries'
import { announce } from '@/lib/announcer'
import { applyRealtimeEvent } from '../apply-event'
import { setRealtimeStatus, useRealtimeStatus } from '../connection-status'
import { markSideEffectOnce } from '../event-ledger'

const RECONNECTING_NOTICE_DELAY_MS = 2000

// Whatever happened while the socket was down never arrives as an event, so every active
// query that events would have touched goes back to the REST source of truth.
function reconcileAfterReconnect(queryClient: QueryClient, userId: string | null): void {
  void queryClient.invalidateQueries({ queryKey: qk.nfts.all() })
  void queryClient.invalidateQueries({ queryKey: ['cart'] })
  void queryClient.invalidateQueries({ queryKey: ['quote'] })
  if (userId) void queryClient.invalidateQueries({ queryKey: [...qk.user(userId).all, 'orders'] })
}

export function RealtimeConnection() {
  const queryClient = useQueryClient()
  const { data: session, isPending } = useSessionQuery()
  const userId = isPending ? undefined : (session?.user.id ?? null)
  const status = useRealtimeStatus()
  const [noticeDue, setNoticeDue] = useState(false)
  const showNotice = noticeDue && status === 'disconnected'

  useEffect(() => {
    if (userId === undefined) return
    let socket: Socket | undefined
    let cancelled = false
    let dropped = false

    const onConnect = () => {
      setRealtimeStatus('connected')
      if (dropped) reconcileAfterReconnect(queryClient, userId)
      dropped = false
    }
    const onDrop = (reason?: string) => {
      // A disconnect this component asked for (logout, user switch) is not an outage.
      if (reason === 'io client disconnect') return
      dropped = true
      setRealtimeStatus('disconnected')
    }
    const onConnectError = () => onDrop()
    const onEvent = (payload: unknown) => {
      const applied = applyRealtimeEvent(queryClient, payload, userId)
      if (!applied || applied.announcements.length === 0) return
      const { kind, id } = applied.event.resource
      if (markSideEffectOnce(kind, id, applied.event.version))
        applied.announcements.forEach(announce)
    }

    // A login or a logout reconnects with the new token, which the auth callback rereads.
    void import('../socket').then(({ getRealtimeSocket }) => {
      if (cancelled) return
      socket = getRealtimeSocket()
      socket.on('connect', onConnect)
      socket.on('disconnect', onDrop)
      socket.on('connect_error', onConnectError)
      socket.on('nft.updated', onEvent)
      socket.on('order.updated', onEvent)
      socket.connect()
    })

    return () => {
      cancelled = true
      socket?.off('connect', onConnect)
      socket?.off('disconnect', onDrop)
      socket?.off('connect_error', onConnectError)
      socket?.off('nft.updated', onEvent)
      socket?.off('order.updated', onEvent)
      socket?.disconnect()
      setRealtimeStatus('idle')
    }
  }, [queryClient, userId])

  useEffect(() => {
    if (status !== 'disconnected') return
    const timer = setTimeout(() => setNoticeDue(true), RECONNECTING_NOTICE_DELAY_MS)
    return () => {
      clearTimeout(timer)
      setNoticeDue(false)
    }
  }, [status])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      {showNotice && (
        <p className="rounded-full border border-line bg-surface-raised px-4 py-2 text-sm font-bold text-heading shadow-card-m">
          {copy.realtime.reconnecting}
        </p>
      )}
    </div>
  )
}
