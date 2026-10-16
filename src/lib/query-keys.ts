import type { CatalogSearch, NetworkId } from '@/contracts'

export const qk = {
  session: () => ['session'] as const,
  nfts: {
    all: () => ['nfts'] as const,
    list: (search: CatalogSearch) => ['nfts', 'list', search] as const,
    featured: () => ['nfts', 'featured'] as const,
    detail: (id: string) => ['nfts', 'detail', id] as const,
  },
  cart: (owner: `guest:${string}` | `user:${string}`) => ['cart', owner] as const,
  quote: (owner: string, network: NetworkId, cartVersion: number) =>
    ['quote', owner, network, cartVersion] as const,
  user: (userId: string) => ({
    all: ['user', userId] as const,
    favorites: () => ['user', userId, 'favorites'] as const,
    profile: () => ['user', userId, 'profile'] as const,
    wallets: () => ['user', userId, 'wallets'] as const,
    order: (id: string) => ['user', userId, 'orders', id] as const,
    pendingOrders: () => ['user', userId, 'orders', 'pending'] as const,
  }),
}
