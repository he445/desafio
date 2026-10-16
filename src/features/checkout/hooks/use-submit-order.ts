import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { QuoteSchema, type CreateOrderInput, type Quote } from '@/contracts'
import { copy } from '@/content/copy'
import { announce } from '@/lib/announcer'
import { isApiError } from '@/lib/api-error'
import { qk } from '@/lib/query-keys'
import { getKnownResourceVersion, recordResourceVersion } from '@/features/realtime/event-ledger'
import { placeOrder } from '@/features/orders/place-order'

export type SubmitPhase = 'idle' | 'submitting' | 'verifying'

interface SubmitHandlers {
  onQuoteOutdated: (offered: Quote | undefined) => void
  onWalletDisconnected: () => void
}

function offeredQuote(details: Record<string, unknown> | undefined): Quote | undefined {
  const parsed = QuoteSchema.safeParse(details?.quote)
  if (!parsed.success) return undefined
  for (const line of parsed.data.lines) recordResourceVersion('nft', line.nftId, line.nftVersion)
  return parsed.data
}

export function useSubmitOrder(userId: string, handlers: SubmitHandlers) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const inFlight = useRef(false)
  const [phase, setPhase] = useState<SubmitPhase>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (body: CreateOrderInput) => {
    // A second click while the first is in flight is ignored, not queued.
    if (inFlight.current) return
    inFlight.current = true
    setPhase('submitting')
    setError(null)
    try {
      const order = await placeOrder(userId, body, () => {
        setPhase('verifying')
        announce(copy.checkout.verifying)
      })
      // order.updated may have overtaken this response; then the page fetches the newer state.
      if (order.version >= getKnownResourceVersion('order', order.id)) {
        queryClient.setQueryData(qk.user(userId).order(order.id), order)
      }
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (caught) {
      const message = isApiError(caught) ? caught.message : copy.errors.unexpected
      setError(message)
      if (isApiError(caught)) {
        if (caught.code === 'QUOTE_OUTDATED') handlers.onQuoteOutdated(offeredQuote(caught.details))
        if (caught.code === 'WALLET_DISCONNECTED') handlers.onWalletDisconnected()
        if (caught.code === 'QUOTE_OUTDATED' || caught.code === 'AVAILABILITY_CONFLICT') {
          void queryClient.invalidateQueries({ queryKey: ['cart'] })
          void queryClient.invalidateQueries({ queryKey: ['quote'] })
        }
      }
    } finally {
      inFlight.current = false
      setPhase('idle')
    }
  }

  return { submit, phase, error }
}
