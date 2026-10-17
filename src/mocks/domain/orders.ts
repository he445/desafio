import type {
  CreateOrderInput,
  NetworkId,
  Nft,
  Order,
  OrderReceiptLine,
  OrderRejectionReason,
  Quote,
  WalletConnectionInput,
  WalletConnectionResponse,
} from '@/contracts'
import { compareEth } from '@/lib/eth'
import type { MockDb, SettlementRecord } from '@/mocks/db/schema'
import { createQuoteForCart, getOrCreateCart, NETWORK_FEES, resolveCouponDiscount } from './cart'
import { getNftById } from './catalog'
import { sha256Hex } from './crypto'
import { MockHttpError } from './errors'
import { adjustStock, findEdition } from './inventory'

const IDEMPOTENCY_TTL_MS = 24 * 3600_000

const EXPLORER_TX_URL: Record<NetworkId, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

export function createWalletConnection(
  db: MockDb,
  userId: string,
  input: WalletConnectionInput,
): WalletConnectionResponse {
  const wallet = (db.walletsByUser[userId] ?? []).find((item) => item.id === input.walletId)
  if (!wallet) {
    throw new MockHttpError({ status: 404, code: 'NOT_FOUND', message: 'Carteira não encontrada.' })
  }
  if (wallet.network !== input.network) {
    const message = 'Esta carteira é de outra rede.'
    throw new MockHttpError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message,
      fieldErrors: { network: [message] },
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

export function deleteWalletConnection(db: MockDb, userId: string, connectionId: string): void {
  const connection = db.walletConnections[connectionId]
  if (!connection) return
  if (connection.userId !== userId) {
    throw new MockHttpError({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Esta conexão pertence a outro usuário.',
    })
  }
  delete db.walletConnections[connectionId]
}

export function dropWalletConnection(db: MockDb, connectionId: string): void {
  const connection = db.walletConnections[connectionId]
  if (connection) connection.status = 'disconnected'
}

function quoteOutdated(
  db: MockDb,
  userId: string,
  network: NetworkId,
  message: string,
  now: number,
): MockHttpError {
  const cart = getOrCreateCart(db, { kind: 'user', userId })
  const details =
    cart.items.length > 0
      ? { quote: createQuoteForCart(db, { kind: 'user', userId }, network, undefined, now) }
      : {}
  return new MockHttpError({ status: 409, code: 'QUOTE_OUTDATED', message, details })
}

function assertQuoteStillValid(
  db: MockDb,
  userId: string,
  quote: Quote,
  network: NetworkId,
  now: number,
): void {
  const outdated = (message: string) => quoteOutdated(db, userId, network, message, now)
  const cart = getOrCreateCart(db, { kind: 'user', userId })

  if (Date.parse(quote.expiresAt) <= now) throw outdated('A cotação expirou. Revise os valores.')
  if (network !== quote.network) throw outdated('A carteira conectada é de outra rede.')
  if (cart.couponCode !== quote.couponCode) throw outdated('O cupom do carrinho mudou.')
  if (compareEth(NETWORK_FEES[quote.network], quote.networkFee) !== 0) {
    throw outdated('A taxa de rede mudou.')
  }

  for (const line of quote.lines) {
    const item = cart.items.find((candidate) => candidate.editionId === line.editionId)
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
    if (!item || item.quantity < line.quantity || !nft || !edition) {
      throw outdated('Os itens do carrinho foram alterados.')
    }
    if (edition.available < line.quantity) {
      throw new MockHttpError({
        status: 409,
        code: 'AVAILABILITY_CONFLICT',
        message: `Estoque insuficiente para ${nft.title}.`,
        details: { nftId: nft.id, editionId: edition.id },
      })
    }
    if (compareEth(edition.price, line.unitPrice) !== 0 || nft.version !== line.nftVersion) {
      item.unitPriceWhenAdded = edition.price
      throw outdated('Os valores mudaram desde a última cotação.')
    }
  }

  const coupon = resolveCouponDiscount(db, quote.couponCode, quote.subtotal, now)
  if (coupon.issue || compareEth(coupon.discount, quote.discount) !== 0) {
    throw outdated('O cupom não vale mais para esta compra.')
  }
}

export async function createOrderFromQuote(
  db: MockDb,
  userId: string,
  idempotencyKey: string | null | undefined,
  input: CreateOrderInput,
  now = Date.now(),
): Promise<{ order: Order; reused: boolean; mutatedNfts: Nft[] }> {
  const key = idempotencyKey?.trim()
  if (!key) {
    throw new MockHttpError({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Cabeçalho Idempotency-Key obrigatório.',
    })
  }

  const bodyHash = await sha256Hex(
    JSON.stringify({
      quoteId: input.quoteId,
      connectionId: input.connectionId,
      buyer: input.buyer,
    }),
  )
  const recordKey = `${userId}:${key}`
  const previous = db.idempotencyKeys[recordKey]
  if (previous && now - Date.parse(previous.createdAt) < IDEMPOTENCY_TTL_MS) {
    if (previous.bodyHash !== bodyHash) {
      throw new MockHttpError({
        status: 409,
        code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'A mesma chave de idempotência não pode ser reutilizada com outro pedido.',
      })
    }
    const existing = db.orders[previous.orderId]
    if (existing) return { order: existing, reused: true, mutatedNfts: [] }
  }

  const connection = db.walletConnections[input.connectionId]
  if (!connection || connection.userId !== userId || connection.status !== 'connected') {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_DISCONNECTED',
      message: 'A carteira foi desconectada. Reconecte para confirmar a compra.',
    })
  }

  const quote = db.quotes[input.quoteId]
  if (!quote) {
    throw quoteOutdated(db, userId, connection.network, 'Cotação não encontrada.', now)
  }
  assertQuoteStillValid(db, userId, quote, connection.network, now)

  const cart = getOrCreateCart(db, { kind: 'user', userId })
  const receiptLines: OrderReceiptLine[] = []
  const mutated = new Map<string, Nft>()
  for (const line of quote.lines) {
    const nft = getNftById(db, line.nftId)
    const edition = findEdition(nft, line.editionId)
    receiptLines.push({
      nftId: nft.id,
      editionId: edition.id,
      title: nft.title,
      tokenId: nft.tokenId,
      editionName: edition.name,
      image: nft.images[0]?.src ?? '',
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })
    mutated.set(nft.id, adjustStock(db, nft, edition.id, -line.quantity))
    const item = cart.items.find((candidate) => candidate.editionId === edition.id)
    if (item) item.unitPriceWhenAdded = item.unitPrice
  }

  const createdAt = new Date(now).toISOString()
  const order: Order = {
    id: `order-${crypto.randomUUID().slice(0, 8)}`,
    userId,
    status: 'pending',
    rejectionReason: null,
    quoteId: quote.id,
    walletId: connection.walletId,
    network: connection.network,
    provider: connection.provider,
    receipt: structuredClone({
      lines: receiptLines,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      couponCode: quote.couponCode,
    }),
    transaction: null,
    createdAt,
    updatedAt: createdAt,
    version: 1,
  }

  db.orders[order.id] = order
  db.idempotencyKeys[recordKey] = { key, userId, bodyHash, orderId: order.id, createdAt }
  return { order, reused: false, mutatedNfts: [...mutated.values()] }
}

function randomTxHash(): string {
  return `0x${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
}

export function transitionOrderState(
  db: MockDb,
  orderId: string,
  nextStatus: 'confirmed' | 'rejected',
  rejectionReason: OrderRejectionReason = null,
  now = Date.now(),
): { order: Order; mutatedNfts: Nft[] } | null {
  const order = db.orders[orderId]
  if (!order || order.status !== 'pending') return null
  delete db.settlements[orderId]

  const mutated = new Map<string, Nft>()
  order.updatedAt = new Date(now).toISOString()
  order.version += 1

  if (nextStatus === 'confirmed') {
    const hash = randomTxHash()
    order.status = 'confirmed'
    order.rejectionReason = null
    order.transaction = { hash, explorerUrl: `${EXPLORER_TX_URL[order.network]}${hash}` }

    const cart = getOrCreateCart(db, { kind: 'user', userId: order.userId })
    for (const line of order.receipt.lines) {
      const item = cart.items.find((candidate) => candidate.editionId === line.editionId)
      if (!item) continue
      item.quantity -= line.quantity
      if (item.quantity <= 0) cart.items = cart.items.filter((candidate) => candidate !== item)
    }
    if (cart.items.length === 0) cart.couponCode = null
    cart.version += 1
  } else {
    order.status = 'rejected'
    order.rejectionReason = rejectionReason ?? 'insufficient_funds'
    order.transaction = null
    for (const line of order.receipt.lines) {
      const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
      if (nft?.editions.some((edition) => edition.id === line.editionId)) {
        mutated.set(nft.id, adjustStock(db, nft, line.editionId, line.quantity))
      }
    }
  }

  return { order, mutatedNfts: [...mutated.values()] }
}

export function planSettlement(db: MockDb, settlement: SettlementRecord): void {
  db.settlements[settlement.orderId] = settlement
}

export function settleDueOrders(db: MockDb, now = Date.now()) {
  const results: Array<{ order: Order; mutatedNfts: Nft[] }> = []
  for (const settlement of Object.values(db.settlements)) {
    if (Date.parse(settlement.dueAt) > now) continue
    const result = transitionOrderState(
      db,
      settlement.orderId,
      settlement.status,
      settlement.rejectionReason,
      now,
    )
    delete db.settlements[settlement.orderId]
    if (result) results.push(result)
  }
  return results
}

export function getOrderForUser(db: MockDb, userId: string, orderId: string): Order {
  const order = db.orders[orderId]
  if (!order) {
    throw new MockHttpError({ status: 404, code: 'NOT_FOUND', message: 'Pedido não encontrado.' })
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
