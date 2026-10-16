import { delay, http, HttpResponse } from 'msw'
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  AddCartItemInputSchema,
  ApplyCouponInputSchema,
  AuthResponseSchema,
  AvatarResponseSchema,
  CartSchema,
  ChangePasswordInputSchema,
  CreateOrderInputSchema,
  CreateQuoteInputSchema,
  CreateWalletInputSchema,
  FavoritesResponseSchema,
  FeaturedNftsResponseSchema,
  LoginInputSchema,
  MergeCartInputSchema,
  MergeCartResponseSchema,
  NftListResponseSchema,
  NftSchema,
  OrderSchema,
  PendingOrdersResponseSchema,
  ProfileSchema,
  QuoteSchema,
  RegisterInputSchema,
  UpdateCartItemInputSchema,
  UpdateProfileInputSchema,
  UpdateWalletInputSchema,
  WalletConnectionInputSchema,
  WalletConnectionResponseSchema,
  WalletSchema,
  WalletsResponseSchema,
} from '@/contracts'
import { loadDb, saveDb } from '@/mocks/db/store'
import {
  changePasswordForUser,
  createWalletForUser,
  getProfileForUser,
  getWalletsForUser,
  updateAvatarForUser,
  updateProfileForUser,
  updateWalletForUser,
} from '@/mocks/domain/account'
import {
  addCartItem,
  applyCouponToCart,
  createQuoteForCart,
  getOrCreateCart,
  mergeGuestCartIntoUserCart,
  removeCartItem,
  removeCouponFromCart,
  updateCartItemQuantity,
} from '@/mocks/domain/cart'
import { getFeaturedNfts, getNftById, queryNfts } from '@/mocks/domain/catalog'
import { MockHttpError } from '@/mocks/domain/errors'
import {
  addFavoriteForUser,
  getFavoritesForUser,
  removeFavoriteForUser,
} from '@/mocks/domain/favorites'
import {
  createOrderFromQuote,
  createWalletConnection,
  deleteWalletConnection,
  getOrderForUser,
  getPendingOrdersForUser,
} from '@/mocks/domain/orders'
import {
  getAuthenticatedUser,
  loginUser,
  logoutSession,
  registerUser,
  toUserSummary,
} from '@/mocks/domain/session'
import { broadcastNftUpdated, dropAllSockets } from '@/mocks/realtime/server'
import { scheduleSettlement } from '@/mocks/realtime/settlements'
import {
  assertWalletConnectionAllowed,
  disruptFirstOrder,
  ORDER_TIMEOUT_RESPONSE_MS,
  SETTLEMENT_DELAY_MS,
  sessionTtlFor,
  settlementOutcome,
} from '@/mocks/scenarios/checkout'
import { withNetwork } from '@/mocks/scenarios/network'
import { getActiveScenarioId } from '@/mocks/scenarios/registry'
import { readJson, requireUser, resolveCartOwner } from './request'

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function toDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${file.type};base64,${btoa(binary)}`
}

export const handlers = [
  http.post(
    `${API}/auth/register`,
    withNetwork('POST /auth/register', async ({ request }) => {
      const db = loadDb()
      const body = await readJson(request, RegisterInputSchema)
      const ttlMs = sessionTtlFor(getActiveScenarioId())
      const result = AuthResponseSchema.parse(await registerUser(db, body, { ttlMs }))
      saveDb()
      return HttpResponse.json(result, { status: 201 })
    }),
  ),

  http.post(
    `${API}/auth/login`,
    withNetwork('POST /auth/login', async ({ request }) => {
      const db = loadDb()
      const body = await readJson(request, LoginInputSchema)
      const ttlMs = sessionTtlFor(getActiveScenarioId())
      const result = AuthResponseSchema.parse(await loginUser(db, body, { ttlMs }))
      saveDb()
      return HttpResponse.json(result)
    }),
  ),

  http.get(
    `${API}/auth/session`,
    withNetwork('GET /auth/session', ({ request }) => {
      const db = loadDb()
      const { user, session } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      return HttpResponse.json(AuthResponseSchema.parse({ user: toUserSummary(user), session }))
    }),
  ),

  http.post(
    `${API}/auth/logout`,
    withNetwork('POST /auth/logout', ({ request }) => {
      const db = loadDb()
      logoutSession(db, request.headers.get('Authorization'))
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    `${API}/nfts/featured`,
    withNetwork('GET /nfts/featured', () => {
      const items = getFeaturedNfts(loadDb())
      return HttpResponse.json(FeaturedNftsResponseSchema.parse({ items }))
    }),
  ),

  http.get(
    `${API}/nfts/:id`,
    withNetwork<{ id: string }>('GET /nfts/:id', ({ params }) => {
      return HttpResponse.json(NftSchema.parse(getNftById(loadDb(), params.id)))
    }),
  ),

  http.get(
    `${API}/nfts`,
    withNetwork('GET /nfts', ({ request }) => {
      const query = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(NftListResponseSchema.parse(queryNfts(loadDb(), query)))
    }),
  ),

  http.get(
    `${API}/me/favorites`,
    withNetwork('GET /me/favorites', ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      return HttpResponse.json(FavoritesResponseSchema.parse(getFavoritesForUser(db, user.id)))
    }),
  ),

  http.put(
    `${API}/me/favorites/:nftId`,
    withNetwork<{ nftId: string }>('PUT /me/favorites/:nftId', ({ request, params }) => {
      const db = loadDb()
      addFavoriteForUser(db, requireUser(db, request).id, params.nftId)
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.delete(
    `${API}/me/favorites/:nftId`,
    withNetwork<{ nftId: string }>('DELETE /me/favorites/:nftId', ({ request, params }) => {
      const db = loadDb()
      removeFavoriteForUser(db, requireUser(db, request).id, params.nftId)
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    `${API}/cart`,
    withNetwork('GET /cart', ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveCartOwner(db, request)
      const cart = CartSchema.parse(getOrCreateCart(db, owner, guestCartId))
      saveDb()
      return HttpResponse.json(cart)
    }),
  ),

  http.post(
    `${API}/cart/items`,
    withNetwork('POST /cart/items', async ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveCartOwner(db, request)
      const body = await readJson(request, AddCartItemInputSchema)
      const cart = CartSchema.parse(addCartItem(db, owner, body, guestCartId))
      saveDb()
      return HttpResponse.json(cart)
    }),
  ),

  http.patch(
    `${API}/cart/items/:itemId`,
    withNetwork<{ itemId: string }>('PATCH /cart/items/:itemId', async ({ request, params }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveCartOwner(db, request)
      const body = await readJson(request, UpdateCartItemInputSchema)
      const cart = CartSchema.parse(
        updateCartItemQuantity(db, owner, params.itemId, body.quantity, guestCartId),
      )
      saveDb()
      return HttpResponse.json(cart)
    }),
  ),

  http.delete(
    `${API}/cart/items/:itemId`,
    withNetwork<{ itemId: string }>('DELETE /cart/items/:itemId', ({ request, params }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveCartOwner(db, request)
      const cart = CartSchema.parse(removeCartItem(db, owner, params.itemId, guestCartId))
      saveDb()
      return HttpResponse.json(cart)
    }),
  ),

  http.put(
    `${API}/cart/coupon`,
    withNetwork('PUT /cart/coupon', async ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveCartOwner(db, request)
      const body = await readJson(request, ApplyCouponInputSchema)
      const cart = CartSchema.parse(applyCouponToCart(db, owner, body.code, guestCartId))
      saveDb()
      return HttpResponse.json(cart)
    }),
  ),

  http.delete(
    `${API}/cart/coupon`,
    withNetwork('DELETE /cart/coupon', ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveCartOwner(db, request)
      const cart = CartSchema.parse(removeCouponFromCart(db, owner, guestCartId))
      saveDb()
      return HttpResponse.json(cart)
    }),
  ),

  http.post(
    `${API}/cart/merge`,
    withNetwork('POST /cart/merge', async ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const body = await readJson(request, MergeCartInputSchema)
      const result = MergeCartResponseSchema.parse(
        mergeGuestCartIntoUserCart(db, user.id, body.guestCartId),
      )
      saveDb()
      return HttpResponse.json(result)
    }),
  ),

  http.post(
    `${API}/quotes`,
    withNetwork('POST /quotes', async ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveCartOwner(db, request)
      const body = await readJson(request, CreateQuoteInputSchema)
      const quote = QuoteSchema.parse(createQuoteForCart(db, owner, body.network, guestCartId))
      saveDb()
      return HttpResponse.json(quote)
    }),
  ),

  http.post(
    `${API}/wallet-connections`,
    withNetwork('POST /wallet-connections', async ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const body = await readJson(request, WalletConnectionInputSchema)
      assertWalletConnectionAllowed(getActiveScenarioId())
      const connection = WalletConnectionResponseSchema.parse(
        createWalletConnection(db, user.id, body),
      )
      saveDb()
      return HttpResponse.json(connection)
    }),
  ),

  http.delete(
    `${API}/wallet-connections/:id`,
    withNetwork<{ id: string }>('DELETE /wallet-connections/:id', ({ request, params }) => {
      const db = loadDb()
      deleteWalletConnection(db, requireUser(db, request).id, params.id)
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.post(
    `${API}/orders`,
    withNetwork('POST /orders', async ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const body = await readJson(request, CreateOrderInputSchema)
      const scenario = getActiveScenarioId()

      disruptFirstOrder(db, user.id, body, scenario).forEach(broadcastNftUpdated)
      try {
        const { order, reused, mutatedNfts } = await createOrderFromQuote(
          db,
          user.id,
          request.headers.get('Idempotency-Key'),
          body,
        )
        saveDb()
        mutatedNfts.forEach(broadcastNftUpdated)

        if (!reused) {
          scheduleSettlement({
            orderId: order.id,
            dueAt: new Date(Date.now() + SETTLEMENT_DELAY_MS).toISOString(),
            ...settlementOutcome(scenario),
          })
          // The drop outlasts the settlement, so the confirmation happens while offline.
          if (scenario === 'socket-drop') {
            setTimeout(() => dropAllSockets({ refuseForMs: SETTLEMENT_DELAY_MS }), 250)
          }
          if (scenario === 'order-timeout') await delay(ORDER_TIMEOUT_RESPONSE_MS)
        }

        return HttpResponse.json(OrderSchema.parse(order), { status: reused ? 200 : 201 })
      } catch (error) {
        // Failed revalidation still stores the fresh quote and the acknowledged price.
        saveDb()
        throw error
      }
    }),
  ),

  http.get(
    `${API}/orders/:id`,
    withNetwork<{ id: string }>('GET /orders/:id', ({ request, params }) => {
      const db = loadDb()
      const order = getOrderForUser(db, requireUser(db, request).id, params.id)
      return HttpResponse.json(OrderSchema.parse(order))
    }),
  ),

  http.get(
    `${API}/orders`,
    withNetwork('GET /orders', ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const status = new URL(request.url).searchParams.get('status') ?? 'pending'
      if (status !== 'pending') {
        throw new MockHttpError({
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Somente status=pending é suportado.',
        })
      }
      const items = getPendingOrdersForUser(db, user.id)
      return HttpResponse.json(PendingOrdersResponseSchema.parse({ items }))
    }),
  ),

  http.get(
    `${API}/me/profile`,
    withNetwork('GET /me/profile', ({ request }) => {
      const db = loadDb()
      return HttpResponse.json(
        ProfileSchema.parse(getProfileForUser(db, requireUser(db, request).id)),
      )
    }),
  ),

  http.patch(
    `${API}/me/profile`,
    withNetwork('PATCH /me/profile', async ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const body = await readJson(request, UpdateProfileInputSchema)
      const profile = ProfileSchema.parse(updateProfileForUser(db, user.id, body))
      saveDb()
      return HttpResponse.json(profile)
    }),
  ),

  http.put(
    `${API}/me/avatar`,
    withNetwork('PUT /me/avatar', async ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const file = await request
        .formData()
        .then((form) => form.get('file'))
        .catch(() => null)
      if (!(file instanceof File)) {
        throw new MockHttpError({
          status: 422,
          code: 'VALIDATION_FAILED',
          message: 'Envie a imagem no campo "file".',
          fieldErrors: { file: ['Envie uma imagem.'] },
        })
      }
      if (!AVATAR_TYPES.includes(file.type)) {
        throw new MockHttpError({
          status: 415,
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Formato não suportado. Use PNG, JPEG ou WebP.',
        })
      }
      if (file.size > AVATAR_MAX_BYTES) {
        throw new MockHttpError({
          status: 413,
          code: 'FILE_TOO_LARGE',
          message: 'A imagem deve ter no máximo 2 MB.',
        })
      }

      const result = AvatarResponseSchema.parse(
        updateAvatarForUser(db, user.id, await toDataUrl(file)),
      )
      saveDb()
      return HttpResponse.json(result)
    }),
  ),

  http.delete(
    `${API}/me/avatar`,
    withNetwork('DELETE /me/avatar', ({ request }) => {
      const db = loadDb()
      const result = AvatarResponseSchema.parse(
        updateAvatarForUser(db, requireUser(db, request).id, null),
      )
      saveDb()
      return HttpResponse.json(result)
    }),
  ),

  http.post(
    `${API}/me/password`,
    withNetwork('POST /me/password', async ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const body = await readJson(request, ChangePasswordInputSchema)
      await changePasswordForUser(db, user.id, body)
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    `${API}/me/wallets`,
    withNetwork('GET /me/wallets', ({ request }) => {
      const db = loadDb()
      const items = getWalletsForUser(db, requireUser(db, request).id)
      return HttpResponse.json(WalletsResponseSchema.parse({ items }))
    }),
  ),

  http.post(
    `${API}/me/wallets`,
    withNetwork('POST /me/wallets', async ({ request }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const body = await readJson(request, CreateWalletInputSchema)
      const wallet = WalletSchema.parse(createWalletForUser(db, user.id, body))
      saveDb()
      return HttpResponse.json(wallet, { status: 201 })
    }),
  ),

  http.patch(
    `${API}/me/wallets/:id`,
    withNetwork<{ id: string }>('PATCH /me/wallets/:id', async ({ request, params }) => {
      const db = loadDb()
      const user = requireUser(db, request)
      const body = await readJson(request, UpdateWalletInputSchema)
      const wallet = WalletSchema.parse(updateWalletForUser(db, user.id, params.id, body))
      saveDb()
      return HttpResponse.json(wallet)
    }),
  ),
]
