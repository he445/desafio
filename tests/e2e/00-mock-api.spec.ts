import type { z } from 'zod'
import type {
  AuthResponse,
  Cart,
  Order,
  Profile,
  Quote,
  Wallet,
  WalletConnectionResponse,
} from '../../src/contracts'
import {
  ApiErrorEnvelopeSchema,
  AuthResponseSchema,
  AvatarResponseSchema,
  CartSchema,
  FavoritesResponseSchema,
  FeaturedNftsResponseSchema,
  MergeCartResponseSchema,
  NftListResponseSchema,
  NftSchema,
  OrderSchema,
  PendingOrdersResponseSchema,
  ProfileSchema,
  QuoteSchema,
  WalletConnectionResponseSchema,
  WalletSchema,
  WalletsResponseSchema,
} from '../../src/contracts'
import { expect, gotoReady, PASSWORD, test } from '../support/fixtures'

// Each key is "METHOD /route"; a suffix after " · " marks a second call to the same route.
const EXPECTED: Record<string, { status: number; schema?: z.ZodType }> = {
  'POST /auth/register': { status: 201, schema: AuthResponseSchema },
  'POST /auth/register · invalid body': { status: 422, schema: ApiErrorEnvelopeSchema },
  'POST /auth/login': { status: 200, schema: AuthResponseSchema },
  'GET /auth/session': { status: 200, schema: AuthResponseSchema },
  'GET /nfts': { status: 200, schema: NftListResponseSchema },
  'GET /nfts/featured': { status: 200, schema: FeaturedNftsResponseSchema },
  'GET /nfts/:id': { status: 200, schema: NftSchema },
  'GET /nfts/:id · missing': { status: 404, schema: ApiErrorEnvelopeSchema },
  'GET /me/favorites': { status: 200, schema: FavoritesResponseSchema },
  'PUT /me/favorites/:nftId': { status: 204 },
  'DELETE /me/favorites/:nftId': { status: 204 },
  'GET /cart': { status: 200, schema: CartSchema },
  'POST /cart/items': { status: 200, schema: CartSchema },
  'POST /cart/merge': { status: 200, schema: MergeCartResponseSchema },
  'POST /cart/items · signed in': { status: 200, schema: CartSchema },
  'PATCH /cart/items/:itemId': { status: 200, schema: CartSchema },
  'DELETE /cart/items/:itemId': { status: 200, schema: CartSchema },
  'PUT /cart/coupon': { status: 200, schema: CartSchema },
  'DELETE /cart/coupon': { status: 200, schema: CartSchema },
  'POST /quotes': { status: 200, schema: QuoteSchema },
  'GET /me/wallets': { status: 200, schema: WalletsResponseSchema },
  'POST /wallet-connections': { status: 200, schema: WalletConnectionResponseSchema },
  'POST /orders': { status: 201, schema: OrderSchema },
  'POST /orders · same key': { status: 200, schema: OrderSchema },
  'GET /orders/:id': { status: 200, schema: OrderSchema },
  'GET /orders': { status: 200, schema: PendingOrdersResponseSchema },
  'DELETE /wallet-connections/:id': { status: 204 },
  'GET /me/profile': { status: 200, schema: ProfileSchema },
  'PATCH /me/profile': { status: 200, schema: ProfileSchema },
  'PUT /me/avatar': { status: 200, schema: AvatarResponseSchema },
  'DELETE /me/avatar': { status: 200, schema: AvatarResponseSchema },
  'POST /me/password': { status: 204 },
  'POST /me/wallets': { status: 201, schema: WalletSchema },
  'PATCH /me/wallets/:id': { status: 200, schema: WalletSchema },
  'POST /auth/logout': { status: 204 },
  'GET /auth/session · after logout': { status: 401, schema: ApiErrorEnvelopeSchema },
}

// The 31 routes of the REST contract (ARCHITECTURE.md, section 2).
const CONTRACT_ROUTES = [
  'POST /auth/register',
  'POST /auth/login',
  'GET /auth/session',
  'POST /auth/logout',
  'GET /nfts',
  'GET /nfts/featured',
  'GET /nfts/:id',
  'GET /me/favorites',
  'PUT /me/favorites/:nftId',
  'DELETE /me/favorites/:nftId',
  'GET /cart',
  'POST /cart/items',
  'PATCH /cart/items/:itemId',
  'DELETE /cart/items/:itemId',
  'PUT /cart/coupon',
  'DELETE /cart/coupon',
  'POST /cart/merge',
  'POST /quotes',
  'POST /wallet-connections',
  'DELETE /wallet-connections/:id',
  'POST /orders',
  'GET /orders/:id',
  'GET /orders',
  'GET /me/profile',
  'PATCH /me/profile',
  'PUT /me/avatar',
  'DELETE /me/avatar',
  'POST /me/password',
  'GET /me/wallets',
  'POST /me/wallets',
  'PATCH /me/wallets/:id',
]

test.skip(({ isMobile }) => isMobile, 'The REST contract does not depend on the viewport.')

test('every REST route answers through the Service Worker within its contract', async ({
  page,
}) => {
  await gotoReady(page, '/')

  const { calls, newOrderCount } = await page.evaluate(async (password) => {
    const calls: Record<string, { status: number; body: unknown }> = {}

    async function call<T = unknown>(
      name: string,
      path: string,
      init: {
        method?: string
        token?: string
        guestCartId?: string
        idempotencyKey?: string
        json?: unknown
        form?: FormData
      } = {},
    ): Promise<T> {
      const headers: Record<string, string> = {}
      if (init.token) headers.Authorization = `Bearer ${init.token}`
      if (init.guestCartId) headers['X-Guest-Cart-Id'] = init.guestCartId
      if (init.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey
      if (init.json !== undefined) headers['Content-Type'] = 'application/json'

      const response = await fetch(`/api/v1${path}`, {
        method: init.method ?? 'GET',
        headers,
        body: init.form ?? (init.json === undefined ? undefined : JSON.stringify(init.json)),
      })
      const text = await response.text()
      const body: unknown = text ? JSON.parse(text) : null
      calls[name] = { status: response.status, body }
      return body as T
    }

    const registered = await call<AuthResponse>('POST /auth/register', '/auth/register', {
      method: 'POST',
      json: { username: 'colecionador', email: 'colecionador@nftmarket.test', password },
    })
    await call('POST /auth/register · invalid body', '/auth/register', {
      method: 'POST',
      json: { username: '', email: 'sem-arroba', password: '123' },
    })
    const auth = await call<AuthResponse>('POST /auth/login', '/auth/login', {
      method: 'POST',
      json: { email: 'marina@nftmarket.test', password },
    })
    const token = auth.session.token
    const newUserToken = registered.session.token
    await call('GET /auth/session', '/auth/session', { token })

    await call('GET /nfts', '/nfts?tab=all&sort=price_asc&page=1&pageSize=9')
    await call('GET /nfts/featured', '/nfts/featured')
    await call('GET /nfts/:id', '/nfts/emerald-ape-042')
    await call('GET /nfts/:id · missing', '/nfts/nft-que-nao-existe')

    await call('GET /me/favorites', '/me/favorites', { token })
    await call('PUT /me/favorites/:nftId', '/me/favorites/ivory-baron-088', {
      method: 'PUT',
      token,
    })
    await call('DELETE /me/favorites/:nftId', '/me/favorites/ivory-baron-088', {
      method: 'DELETE',
      token,
    })

    const guestCartId = 'guest-contract-test'
    await call('GET /cart', '/cart', { guestCartId })
    await call('POST /cart/items', '/cart/items', {
      method: 'POST',
      guestCartId,
      json: { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 1 },
    })
    await call('POST /cart/merge', '/cart/merge', { method: 'POST', token, json: { guestCartId } })
    const cart = await call<Cart>('POST /cart/items · signed in', '/cart/items', {
      method: 'POST',
      token,
      json: { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-open', quantity: 1 },
    })
    const openEditionId =
      cart.items.find((item) => item.editionId === 'emerald-ape-042-open')?.id ?? 'not-in-cart'
    await call('PATCH /cart/items/:itemId', `/cart/items/${openEditionId}`, {
      method: 'PATCH',
      token,
      json: { quantity: 2 },
    })
    await call('DELETE /cart/items/:itemId', `/cart/items/${openEditionId}`, {
      method: 'DELETE',
      token,
    })
    await call('PUT /cart/coupon', '/cart/coupon', {
      method: 'PUT',
      token,
      json: { code: 'BEMVINDO10' },
    })
    await call('DELETE /cart/coupon', '/cart/coupon', { method: 'DELETE', token })
    const quote = await call<Quote>('POST /quotes', '/quotes', {
      method: 'POST',
      token,
      json: { network: 'ethereum' },
    })

    await call('GET /me/wallets', '/me/wallets', { token })
    const connection = await call<WalletConnectionResponse>(
      'POST /wallet-connections',
      '/wallet-connections',
      {
        method: 'POST',
        token,
        json: { walletId: 'wallet-marina-primary', network: 'ethereum', provider: 'metamask' },
      },
    )
    const profile = await call<Profile>('GET /me/profile', '/me/profile', { token })
    const order = {
      quoteId: quote.id,
      connectionId: connection.connectionId,
      buyer: {
        displayName: profile.displayName,
        username: profile.username,
        profileName: profile.username,
        email: profile.email,
        ensName: profile.ensName,
        referralCode: profile.referralCode,
        note: null,
      },
    }
    const created = await call<Order>('POST /orders', '/orders', {
      method: 'POST',
      token,
      idempotencyKey: 'contract-test-order',
      json: order,
    })
    await call('POST /orders · same key', '/orders', {
      method: 'POST',
      token,
      idempotencyKey: 'contract-test-order',
      json: order,
    })
    await call('GET /orders/:id', `/orders/${created.id}`, { token })
    await call('GET /orders', '/orders?status=pending', { token })
    await call('DELETE /wallet-connections/:id', `/wallet-connections/${connection.connectionId}`, {
      method: 'DELETE',
      token,
    })

    await call('PATCH /me/profile', '/me/profile', {
      method: 'PATCH',
      token: newUserToken,
      json: {
        displayName: 'Colecionador Teste',
        username: 'colecionador',
        email: 'colecionador@nftmarket.test',
        ensName: null,
        walletNickname: 'Principal',
      },
    })
    const avatar = new FormData()
    avatar.append(
      'file',
      new File([new Uint8Array([137, 80, 78, 71])], 'a.png', { type: 'image/png' }),
    )
    await call('PUT /me/avatar', '/me/avatar', { method: 'PUT', token: newUserToken, form: avatar })
    await call('DELETE /me/avatar', '/me/avatar', { method: 'DELETE', token: newUserToken })
    await call('POST /me/password', '/me/password', {
      method: 'POST',
      token: newUserToken,
      json: { currentPassword: password, newPassword: 'NovaSenha2026' },
    })
    const holder = {
      displayName: 'Colecionador Teste',
      profileName: 'colecionador',
      email: 'colecionador@nftmarket.test',
      ensName: 'colecionador.eth',
      referralCode: 'KURIO-0001',
    }
    const wallet = await call<Wallet>('POST /me/wallets', '/me/wallets', {
      method: 'POST',
      token: newUserToken,
      json: {
        label: 'Principal',
        address: '0x1111111111111111111111111111111111111111',
        ens: null,
        network: 'ethereum',
        provider: 'walletconnect',
        role: 'primary',
        holder,
      },
    })
    await call('PATCH /me/wallets/:id', `/me/wallets/${wallet.id}`, {
      method: 'PATCH',
      token: newUserToken,
      json: { label: 'Carteira de testes' },
    })

    await call('POST /auth/logout', '/auth/logout', { method: 'POST', token })
    await call('GET /auth/session · after logout', '/auth/session', { token })

    return { calls, newOrderCount: window.__mock?.countOrders(auth.user.id) ?? -1 }
  }, PASSWORD)

  const routesCalled = new Set(Object.keys(calls).map((name) => name.split(' · ')[0]))
  expect([...routesCalled].sort()).toEqual([...CONTRACT_ROUTES].sort())
  expect(Object.keys(calls).sort()).toEqual(Object.keys(EXPECTED).sort())

  for (const [name, expected] of Object.entries(EXPECTED)) {
    const recorded = calls[name]
    expect.soft(recorded?.status, name).toBe(expected.status)
    if (expected.schema) {
      expect.soft(expected.schema.safeParse(recorded?.body).error?.issues, name).toBeUndefined()
    } else {
      expect.soft(recorded?.body, name).toBeNull()
    }
  }

  const parse = <T extends z.ZodType>(schema: T, name: string): z.output<T> =>
    schema.parse(calls[name]?.body)

  const invalid = parse(ApiErrorEnvelopeSchema, 'POST /auth/register · invalid body')
  expect(Object.keys(invalid.error.fieldErrors ?? {})).toEqual(
    expect.arrayContaining(['username', 'email', 'password']),
  )
  expect(parse(ApiErrorEnvelopeSchema, 'GET /nfts/:id · missing').error.code).toBe('NOT_FOUND')
  expect(parse(MergeCartResponseSchema, 'POST /cart/merge').cart.items).toHaveLength(1)
  expect(parse(QuoteSchema, 'POST /quotes').issues).toEqual([])

  const order = parse(OrderSchema, 'POST /orders')
  expect(parse(OrderSchema, 'POST /orders · same key').id).toBe(order.id)
  expect(parse(PendingOrdersResponseSchema, 'GET /orders').items.map(({ id }) => id)).toContain(
    order.id,
  )
  expect(newOrderCount).toBe(1)

  expect(parse(AvatarResponseSchema, 'DELETE /me/avatar').avatarUrl).toBeNull()
  expect(parse(ApiErrorEnvelopeSchema, 'GET /auth/session · after logout').error.code).toBe(
    'UNAUTHENTICATED',
  )
})
