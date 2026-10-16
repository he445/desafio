import type {
  Cart,
  EthAmount,
  NetworkId,
  Nft,
  Order,
  Quote,
  Wallet,
  WalletProvider,
} from '@/contracts'

export interface MockUserRecord {
  id: string
  username: string
  displayName: string
  email: string
  ensName: string | null
  walletNickname: string
  avatarUrl: string | null
  referralCode: string
  passwordSalt: string
  passwordHash: string
}

export interface MockSessionRecord {
  token: string
  userId: string
  expiresAt: string
}

export interface WalletConnectionRecord {
  connectionId: string
  userId: string
  walletId: string
  network: NetworkId
  provider: WalletProvider
  status: 'connected' | 'disconnected'
}

export interface IdempotencyRecord {
  key: string
  userId: string
  bodyHash: string
  orderId: string
  createdAt: string
}

export type CouponRecord =
  | {
      code: string
      kind: 'percent'
      bps: number
      expiresAt: string | null
    }
  | {
      code: string
      kind: 'fixed'
      amount: EthAmount
      minSubtotal: EthAmount
      expiresAt: string | null
    }

export interface MockDb {
  schemaVersion: number
  scenarioId: string
  nfts: Nft[]
  users: MockUserRecord[]
  sessions: MockSessionRecord[]
  favoritesByUser: Record<string, string[]>
  carts: Record<string, Cart>
  quotes: Record<string, Quote>
  orders: Record<string, Order>
  walletsByUser: Record<string, Wallet[]>
  walletConnections: Record<string, WalletConnectionRecord>
  idempotencyKeys: Record<string, IdempotencyRecord>
  coupons: Record<string, CouponRecord>
  priceChangeTriggeredByCart: Record<string, boolean>
  soldOutTriggeredByCart: Record<string, boolean>
}
