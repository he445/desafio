import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { Cart, NetworkId, Quote, WalletConnectionInput } from '@/contracts'
import { quoteQueryOptions, resolveCartOwnerKey } from '@/features/cart/queries'
import { connectWalletApi, disconnectWalletApi } from './api'
import { isQuoteBehind, sameQuoteValues } from './review'

export function useConnectWallet() {
  return useMutation({
    mutationFn: (input: WalletConnectionInput) => connectWalletApi(input),
  })
}

// The old connection is only cleanup on the server; the checkout never waits for it.
export function releaseWalletConnection(connectionId: string): void {
  disconnectWalletApi(connectionId).catch(() => undefined)
}

// The checkout shows and confirms the quote the buyer reviewed. A newer quote replaces it on
// its own unless a price or stock event made the reviewed one fall behind: then the buyer has
// to look at the new numbers before confirming.
export function useReviewedQuote(userId: string, network: NetworkId, cart: Cart) {
  const ownerKey = resolveCartOwnerKey(userId)
  const query = useQuery({
    ...quoteQueryOptions(ownerKey, network, cart.version),
    enabled: cart.items.length > 0,
    placeholderData: (previous) => (previous?.network === network ? previous : undefined),
  })
  const [reviewed, setReviewed] = useState<Quote | null>(null)
  const latest = query.data
  const current = reviewed?.network === network ? reviewed : null
  const behind = current !== null && isQuoteBehind(current)
  const fresh = latest && latest !== current && !isQuoteBehind(latest) ? latest : undefined

  if (fresh && (!current || !behind || sameQuoteValues(current, fresh))) {
    setReviewed(fresh)
  }

  const pending = behind && fresh && !sameQuoteValues(current, fresh) ? fresh : undefined
  return {
    quote: current ?? undefined,
    // The newer quote waiting for the buyer, shown side by side with the reviewed one.
    nextQuote: pending,
    outdated: behind,
    acceptNextQuote: () => {
      if (pending) setReviewed(pending)
    },
    error: current ? null : query.error,
    refetch: () => void query.refetch(),
  }
}
