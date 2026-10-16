import { useState } from 'react'
import type { Buyer, Cart, NetworkId, Wallet, WalletProvider } from '@/contracts'
import { copy } from '@/content/copy'
import { isApiError } from '@/lib/api-error'
import { announce } from '@/lib/announcer'
import { CART_QUOTE_NETWORK, checkoutBlockers } from '@/features/cart/quote'
import { releaseWalletConnection, useConnectWallet, useReviewedQuote } from '../queries'
import { defaultWallet } from '../review'
import { useSubmitOrder } from './use-submit-order'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'rejected' | 'disconnected'

function providerLabel(provider: WalletProvider): string {
  return copy.checkout.providers.find((option) => option.id === provider)?.label ?? provider
}

export function useCheckout({
  userId,
  cart,
  wallets,
}: {
  userId: string
  cart: Cart
  wallets: Wallet[]
}) {
  const [walletId, setWalletId] = useState(() => defaultWallet(wallets)?.id)
  const wallet = wallets.find((candidate) => candidate.id === walletId) ?? defaultWallet(wallets)
  const network: NetworkId = wallet?.network ?? CART_QUOTE_NETWORK
  const review = useReviewedQuote(userId, network, cart)
  const connect = useConnectWallet()
  const connection = connect.data?.walletId === wallet?.id ? connect.data : undefined
  // Set when POST /orders answers WALLET_DISCONNECTED for this connection.
  const [lostConnectionId, setLostConnectionId] = useState<string | null>(null)

  const status: ConnectionStatus = connect.isPending
    ? 'connecting'
    : connect.isError
      ? 'rejected'
      : connection
        ? connection.connectionId === lostConnectionId
          ? 'disconnected'
          : 'connected'
        : 'idle'

  const dropConnection = () => {
    if (connect.data) releaseWalletConnection(connect.data.connectionId)
    connect.reset()
  }

  const selectWallet = (id: string) => {
    if (id === wallet?.id) return
    dropConnection()
    setWalletId(id)
  }

  const selectNetwork = (next: NetworkId) => {
    const target = defaultWallet(wallets, next)
    if (target) selectWallet(target.id)
  }

  const connectProvider = (provider: WalletProvider) => {
    if (!wallet || connect.isPending) return
    if (connection?.provider === provider && status === 'connected') return
    dropConnection()
    const label = providerLabel(provider)
    announce(copy.checkout.connectingTo(label))
    connect.mutate(
      { walletId: wallet.id, network: wallet.network, provider },
      {
        onSuccess: () => announce(copy.checkout.connectedTo(label)),
        onError: (error) =>
          announce(
            copy.checkout.connectionRefused(
              label,
              isApiError(error) ? error.message : copy.errors.unexpected,
            ),
          ),
      },
    )
  }

  const markDisconnected = () => {
    if (!connection) return
    setLostConnectionId(connection.connectionId)
    announce(copy.checkout.disconnectedFrom(providerLabel(connection.provider)))
  }
  const order = useSubmitOrder(userId, {
    onQuoteOutdated: review.refuseQuote,
    onWalletDisconnected: markDisconnected,
  })
  const submitting = order.phase !== 'idle'

  const cartBlockers = review.quote ? checkoutBlockers(review.quote) : []
  // One reason at a time, in the order the buyer can act on them.
  const blockReason = !review.quote
    ? null
    : review.outdated
      ? copy.checkout.reviewFirst
      : cartBlockers.length > 0
        ? copy.checkout.fixInCart
        : status !== 'connected'
          ? copy.checkout.connectFirst
          : null

  return {
    wallet,
    network,
    selectWallet,
    selectNetwork,
    provider: connect.variables?.provider ?? null,
    connection,
    connectionStatus: status,
    connectionError: connect.error,
    connectProvider,
    cartBlockers,
    blockReason,
    canConfirm: Boolean(review.quote) && blockReason === null && !submitting,
    submitting,
    orderPhase: order.phase,
    orderError: order.error,
    confirm: (buyer: Buyer) => {
      if (!review.quote || !connection || blockReason !== null) return
      void order.submit({
        quoteId: review.quote.id,
        connectionId: connection.connectionId,
        buyer,
      })
    },
    ...review,
  }
}

export type CheckoutState = ReturnType<typeof useCheckout>
