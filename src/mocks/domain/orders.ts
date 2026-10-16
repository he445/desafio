import type {
  CreateOrderInput,
  Nft,
  Order,
  OrderReceiptLine,
  OrderRejectionReason,
  OrderStatus,
  WalletConnectionInput,
  WalletConnectionResponse,
} from '@/contracts'
import { addEth } from '@/lib/eth'
import type { MockDb } from '@/mocks/db/schema'
import { computePriceFrom } from '@/mocks/db/seed'
import { changeNftEdition, getNftById } from './catalog'
import { createQuoteForCart, getOrCreateCart } from './cart'
import { sha256Hex } from './crypto'
import { MockHttpError } from './errors'

export function createWalletConnection(
  db: MockDb,
  userId: string,
  input: WalletConnectionInput,
): WalletConnectionResponse {
  if (db.scenarioId === 'wallet-rejected') {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_REJECTED',
      message: 'A conexão foi recusada na carteira.',
    })
  }

  const wallets = db.walletsByUser[userId] ?? []
  const wallet = wallets.find((w) => w.id === input.walletId)
  if (!wallet) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Carteira não encontrada.',
    })
  }

  const connectionId = `wconn-${crypto.randomUUID().slice(0, 8)}`
  db.walletConnections[connectionId] = {
    connectionId,
    userId,
    walletId: wallet.id,
    network: input.network,
    provider: input.provider,
    status: 'connected',
  }

  return {
    connectionId,
    walletId: wallet.id,
    network: input.network,
    provider: input.provider,
    status: 'connected',
  }
}

export function deleteWalletConnection(db: MockDb, connectionId: string): void {
  delete db.walletConnections[connectionId]
}

export async function createOrderFromQuote(
  db: MockDb,
  userId: string,
  idempotencyKey: string | null | undefined,
  input: CreateOrderInput,
  now = Date.now(),
): Promise<{
  order: Order
  reused: boolean
  mutatedNfts: Nft[]
}> {
  const key = idempotencyKey?.trim()
  if (!key) {
    throw new MockHttpError({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Cabeçalho Idempotency-Key obrigatório.',
    })
  }

  const canonicalBody = JSON.stringify({
    quoteId: input.quoteId,
    connectionId: input.connectionId,
    buyer: input.buyer,
  })
  const bodyHash = await sha256Hex(canonicalBody)

  const existingIdempotency = db.idempotencyKeys[`${userId}:${key}`]
  if (existingIdempotency) {
    const ageMs = now - new Date(existingIdempotency.createdAt).getTime()
    if (ageMs < 24 * 3600_000) {
      if (existingIdempotency.bodyHash !== bodyHash) {
        throw new MockHttpError({
          status: 409,
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'A mesma chave de idempotência não pode ser reutilizada com outro pedido.',
        })
      }
      const existingOrder = db.orders[existingIdempotency.orderId]
      if (existingOrder) {
        return { order: existingOrder, reused: true, mutatedNfts: [] }
      }
    }
  }

  const connection = db.walletConnections[input.connectionId]
  if (!connection || connection.userId !== userId || connection.status !== 'connected') {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_DISCONNECTED',
      message: 'A carteira foi desconectada. Reconecte para confirmar a compra.',
    })
  }

  if (db.scenarioId === 'wallet-disconnect') {
    connection.status = 'disconnected'
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_DISCONNECTED',
      message: 'A conexão com a carteira caiu antes do envio. Reconecte para continuar.',
    })
  }

  const quote = db.quotes[input.quoteId]
  if (!quote) {
    throw new MockHttpError({
      status: 409,
      code: 'QUOTE_OUTDATED',
      message: 'Cotação não encontrada ou expirada. Revise a nova cotação.',
    })
  }

  const cart = getOrCreateCart(db, { kind: 'user', userId })
  const firstLine = quote.lines[0]

  if (
    db.scenarioId === 'price-change-checkout' &&
    firstLine &&
    !db.priceChangeTriggeredByCart[cart.id]
  ) {
    db.priceChangeTriggeredByCart[cart.id] = true
    const nft = getNftById(db, firstLine.nftId)
    const edition = nft.editions.find((ed) => ed.id === firstLine.editionId)
    if (edition) {
      const nextPrice = addEth(edition.price, '0.15')
      const updatedNft = changeNftEdition(db, {
        nftId: nft.id,
        editionId: edition.id,
        price: nextPrice,
      })
      for (const ci of cart.items) {
        if (ci.nftId === nft.id && ci.editionId === edition.id) {
          ci.unitPriceWhenAdded = nextPrice
        }
      }
      const freshQuote = createQuoteForCart(
        db,
        { kind: 'user', userId },
        quote.network,
        undefined,
        now,
      )
      throw new MockHttpError({
        status: 409,
        code: 'QUOTE_OUTDATED',
        message: 'O preço de um item mudou. Revise e confirme a nova cotação.',
        details: { quote: freshQuote, updatedNft },
      })
    }
  }

  if (db.scenarioId === 'sold-out-checkout' && firstLine && !db.soldOutTriggeredByCart[cart.id]) {
    db.soldOutTriggeredByCart[cart.id] = true
    const updatedNft = changeNftEdition(db, {
      nftId: firstLine.nftId,
      editionId: firstLine.editionId,
      available: 0,
    })
    throw new MockHttpError({
      status: 409,
      code: 'AVAILABILITY_CONFLICT',
      message: 'Uma das edições esgotou antes da confirmação.',
      details: { nftId: firstLine.nftId, editionId: firstLine.editionId, updatedNft },
    })
  }

  if (new Date(quote.expiresAt).getTime() <= now) {
    const freshQuote = createQuoteForCart(
      db,
      { kind: 'user', userId },
      quote.network,
      undefined,
      now,
    )
    throw new MockHttpError({
      status: 409,
      code: 'QUOTE_OUTDATED',
      message: 'A cotação expirou. Revise os valores atualizados.',
      details: { quote: freshQuote },
    })
  }

  for (const qLine of quote.lines) {
    const cartItem = cart.items.find(
      (it) => it.nftId === qLine.nftId && it.editionId === qLine.editionId,
    )
    if (!cartItem || cartItem.quantity < qLine.quantity) {
      const freshQuote = createQuoteForCart(
        db,
        { kind: 'user', userId },
        quote.network,
        undefined,
        now,
      )
      throw new MockHttpError({
        status: 409,
        code: 'QUOTE_OUTDATED',
        message: 'Os itens do carrinho foram alterados.',
        details: { quote: freshQuote },
      })
    }

    const nft = getNftById(db, qLine.nftId)
    const edition = nft.editions.find((ed) => ed.id === qLine.editionId)
    if (!edition || edition.available < qLine.quantity) {
      throw new MockHttpError({
        status: 409,
        code: 'AVAILABILITY_CONFLICT',
        message: `Estoque insuficiente para ${nft.title}.`,
        details: { nftId: nft.id, editionId: qLine.editionId },
      })
    }

    if (edition.price !== qLine.unitPrice || nft.version !== qLine.nftVersion) {
      for (const ci of cart.items) {
        if (ci.nftId === nft.id && ci.editionId === edition.id) {
          ci.unitPriceWhenAdded = edition.price
        }
      }
      const freshQuote = createQuoteForCart(
        db,
        { kind: 'user', userId },
        quote.network,
        undefined,
        now,
      )
      throw new MockHttpError({
        status: 409,
        code: 'QUOTE_OUTDATED',
        message: 'Os valores mudaram desde a última cotação. Revise a nova cotação.',
        details: { quote: freshQuote },
      })
    }
  }

  const receiptLines: OrderReceiptLine[] = []
  const mutatedNfts: Nft[] = []

  for (const qLine of quote.lines) {
    const nft = getNftById(db, qLine.nftId)
    const edition = nft.editions.find((ed) => ed.id === qLine.editionId)!
    edition.available -= qLine.quantity
    nft.priceFrom = computePriceFrom(nft.editions, edition.price)
    nft.version += 1
    mutatedNfts.push(nft)

    receiptLines.push({
      nftId: nft.id,
      editionId: edition.id,
      title: nft.title,
      tokenId: nft.tokenId,
      editionName: edition.name,
      image: nft.images[0]?.src ?? '/images/nfts/emerald-1.webp',
      quantity: qLine.quantity,
      unitPrice: qLine.unitPrice,
      lineTotal: qLine.lineTotal,
    })
  }

  for (const ci of cart.items) {
    const nft = db.nfts.find((n) => n.id === ci.nftId)
    if (nft) {
      ci.unitPriceWhenAdded = ci.unitPrice
      ci.nftVersion = nft.version
    }
  }

  const nowIso = new Date(now).toISOString()
  const orderId = `order-${crypto.randomUUID().slice(0, 8)}`
  const order: Order = {
    id: orderId,
    userId,
    status: 'pending',
    rejectionReason: null,
    quoteId: quote.id,
    walletId: connection.walletId,
    network: connection.network,
    provider: connection.provider,
    receipt: JSON.parse(
      JSON.stringify({
        lines: receiptLines,
        subtotal: quote.subtotal,
        discount: quote.discount,
        networkFee: quote.networkFee,
        total: quote.total,
        couponCode: quote.couponCode,
      }),
    ),
    transaction: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    version: 1,
  }

  db.orders[order.id] = order
  db.idempotencyKeys[`${userId}:${key}`] = {
    key,
    userId,
    bodyHash,
    orderId: order.id,
    createdAt: nowIso,
  }

  return { order, reused: false, mutatedNfts }
}

export function transitionOrderState(
  db: MockDb,
  orderId: string,
  nextStatus: Exclude<OrderStatus, 'pending'>,
  rejectionReason: OrderRejectionReason = null,
  now = Date.now(),
): { order: Order; mutatedNfts: Nft[] } | null {
  const order = db.orders[orderId]
  if (!order) return null

  if (order.status !== 'pending') {
    return null
  }

  const mutatedNfts: Nft[] = []
  order.updatedAt = new Date(now).toISOString()
  order.version += 1

  if (nextStatus === 'confirmed') {
    order.status = 'confirmed'
    order.rejectionReason = null
    const rawHex = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const hash = `0x${rawHex.slice(0, 64)}`
    order.transaction = {
      hash,
      explorerUrl: `https://etherscan.io/tx/${hash}`,
    }

    const cart = getOrCreateCart(db, { kind: 'user', userId: order.userId })
    for (const rLine of order.receipt.lines) {
      const itemIndex = cart.items.findIndex(
        (ci) => ci.nftId === rLine.nftId && ci.editionId === rLine.editionId,
      )
      if (itemIndex !== -1) {
        const currentItem = cart.items[itemIndex]!
        if (currentItem.quantity <= rLine.quantity) {
          cart.items.splice(itemIndex, 1)
        } else {
          currentItem.quantity -= rLine.quantity
        }
      }
    }
    if (cart.items.length === 0) {
      cart.couponCode = null
    }
    cart.version += 1
  } else {
    order.status = 'rejected'
    order.rejectionReason = rejectionReason ?? 'insufficient_funds'
    order.transaction = null

    for (const rLine of order.receipt.lines) {
      const nft = db.nfts.find((n) => n.id === rLine.nftId)
      const edition = nft?.editions.find((e) => e.id === rLine.editionId)
      if (nft && edition) {
        edition.available += rLine.quantity
        nft.priceFrom = computePriceFrom(nft.editions, edition.price)
        nft.version += 1
        mutatedNfts.push(nft)
      }
    }
  }

  return { order, mutatedNfts }
}

export function getOrderForUser(db: MockDb, userId: string, orderId: string): Order {
  const order = db.orders[orderId]
  if (!order) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Pedido não encontrado.',
    })
  }
  if (order.userId !== userId) {
    throw new MockHttpError({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Você não tem acesso a este pedido',
    })
  }
  return order
}

export function getPendingOrdersForUser(db: MockDb, userId: string): Order[] {
  return Object.values(db.orders).filter(
    (order) => order.userId === userId && order.status === 'pending',
  )
}
