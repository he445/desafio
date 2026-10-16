import { delay, http, HttpResponse } from 'msw'
import {
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
  type CartOwner,
} from '@/contracts'
import { getActiveScenarioId, loadDb, saveDb } from '@/mocks/db/store'
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
  transitionOrderState,
} from '@/mocks/domain/orders'
import {
  getAuthenticatedUser,
  loginUser,
  logoutSession,
  registerUser,
  toUserSummary,
} from '@/mocks/domain/session'
import { broadcastNftUpdated, broadcastOrderUpdated, dropAllSockets } from '@/mocks/realtime/server'
import { withNetwork } from '@/mocks/scenarios'

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1'

function resolveOptionalCartOwner(request: Request): {
  owner: CartOwner
  guestCartId?: string
} {
  const db = loadDb()
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { user } = getAuthenticatedUser(db, authHeader)
      return { owner: { kind: 'user', userId: user.id } }
    } catch {
      // Fall back to guest cart when unauthenticated
    }
  }
  const guestCartId = request.headers.get('X-Guest-Cart-Id') || undefined
  return { owner: { kind: 'guest' }, guestCartId }
}

function scheduleOrderSettlement(orderId: string): void {
  const scenarioId = getActiveScenarioId()
  if (scenarioId === 'socket-drop') {
    setTimeout(() => {
      dropAllSockets({ refuseForMs: 1200 })
    }, 250)
  }

  setTimeout(() => {
    const db = loadDb()
    const targetStatus = scenarioId === 'payment-declined' ? 'rejected' : 'confirmed'
    const rejectionReason = scenarioId === 'payment-declined' ? 'insufficient_funds' : null
    const transitioned = transitionOrderState(db, orderId, targetStatus, rejectionReason)
    if (transitioned) {
      saveDb()
      for (const nft of transitioned.mutatedNfts) {
        broadcastNftUpdated(nft)
      }
      broadcastOrderUpdated(transitioned.order)
    }
  }, 1500)
}

export const handlers = [
  http.post(
    `${API}/auth/register`,
    withNetwork('POST /auth/register', async ({ request }) => {
      const db = loadDb()
      const body = RegisterInputSchema.parse(await request.json())
      const result = AuthResponseSchema.parse(await registerUser(db, body))
      saveDb()
      return HttpResponse.json(result, { status: 201 })
    }),
  ),

  http.post(
    `${API}/auth/login`,
    withNetwork('POST /auth/login', async ({ request }) => {
      const db = loadDb()
      const body = LoginInputSchema.parse(await request.json())
      const result = AuthResponseSchema.parse(await loginUser(db, body))
      saveDb()
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.get(
    `${API}/auth/session`,
    withNetwork('GET /auth/session', ({ request }) => {
      const db = loadDb()
      const { user, session } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const result = AuthResponseSchema.parse({
        user: toUserSummary(user),
        session,
      })
      return HttpResponse.json(result, { status: 200 })
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
      const db = loadDb()
      const items = getFeaturedNfts(db)
      const result = FeaturedNftsResponseSchema.parse({ items })
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.get(
    `${API}/nfts/:id`,
    withNetwork<{ id: string }>('GET /nfts/:id', ({ params }) => {
      const db = loadDb()
      const nft = NftSchema.parse(getNftById(db, String(params.id)))
      return HttpResponse.json(nft, { status: 200 })
    }),
  ),

  http.get(
    `${API}/nfts`,
    withNetwork('GET /nfts', ({ request }) => {
      const db = loadDb()
      const url = new URL(request.url)
      const rawQuery: Record<string, string> = {}
      url.searchParams.forEach((value, key) => {
        rawQuery[key] = value
      })
      const result = NftListResponseSchema.parse(queryNfts(db, rawQuery))
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.get(
    `${API}/me/favorites`,
    withNetwork('GET /me/favorites', ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const result = FavoritesResponseSchema.parse(getFavoritesForUser(db, user.id))
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.put(
    `${API}/me/favorites/:nftId`,
    withNetwork<{ nftId: string }>('PUT /me/favorites/:nftId', ({ request, params }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      addFavoriteForUser(db, user.id, String(params.nftId))
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.delete(
    `${API}/me/favorites/:nftId`,
    withNetwork<{ nftId: string }>('DELETE /me/favorites/:nftId', ({ request, params }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      removeFavoriteForUser(db, user.id, String(params.nftId))
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    `${API}/cart`,
    withNetwork('GET /cart', ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveOptionalCartOwner(request)
      const cart = CartSchema.parse(getOrCreateCart(db, owner, guestCartId))
      saveDb()
      return HttpResponse.json(cart, { status: 200 })
    }),
  ),

  http.post(
    `${API}/cart/items`,
    withNetwork('POST /cart/items', async ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveOptionalCartOwner(request)
      const body = AddCartItemInputSchema.parse(await request.json())
      const cart = CartSchema.parse(addCartItem(db, owner, body, guestCartId))
      saveDb()
      return HttpResponse.json(cart, { status: 200 })
    }),
  ),

  http.patch(
    `${API}/cart/items/:itemId`,
    withNetwork<{ itemId: string }>('PATCH /cart/items/:itemId', async ({ request, params }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveOptionalCartOwner(request)
      const body = UpdateCartItemInputSchema.parse(await request.json())
      const cart = CartSchema.parse(
        updateCartItemQuantity(db, owner, String(params.itemId), body.quantity, guestCartId),
      )
      saveDb()
      return HttpResponse.json(cart, { status: 200 })
    }),
  ),

  http.delete(
    `${API}/cart/items/:itemId`,
    withNetwork<{ itemId: string }>('DELETE /cart/items/:itemId', ({ request, params }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveOptionalCartOwner(request)
      const cart = CartSchema.parse(removeCartItem(db, owner, String(params.itemId), guestCartId))
      saveDb()
      return HttpResponse.json(cart, { status: 200 })
    }),
  ),

  http.put(
    `${API}/cart/coupon`,
    withNetwork('PUT /cart/coupon', async ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveOptionalCartOwner(request)
      const body = ApplyCouponInputSchema.parse(await request.json())
      const cart = CartSchema.parse(applyCouponToCart(db, owner, body.code, guestCartId))
      saveDb()
      return HttpResponse.json(cart, { status: 200 })
    }),
  ),

  http.delete(
    `${API}/cart/coupon`,
    withNetwork('DELETE /cart/coupon', ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveOptionalCartOwner(request)
      const cart = CartSchema.parse(removeCouponFromCart(db, owner, guestCartId))
      saveDb()
      return HttpResponse.json(cart, { status: 200 })
    }),
  ),

  http.post(
    `${API}/cart/merge`,
    withNetwork('POST /cart/merge', async ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const body = MergeCartInputSchema.parse(await request.json())
      const result = MergeCartResponseSchema.parse(
        mergeGuestCartIntoUserCart(db, user.id, body.guestCartId),
      )
      saveDb()
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.post(
    `${API}/quotes`,
    withNetwork('POST /quotes', async ({ request }) => {
      const db = loadDb()
      const { owner, guestCartId } = resolveOptionalCartOwner(request)
      const body = CreateQuoteInputSchema.parse(await request.json())
      const quote = QuoteSchema.parse(createQuoteForCart(db, owner, body.network, guestCartId))
      saveDb()
      return HttpResponse.json(quote, { status: 200 })
    }),
  ),

  http.post(
    `${API}/wallet-connections`,
    withNetwork('POST /wallet-connections', async ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const body = WalletConnectionInputSchema.parse(await request.json())
      const conn = WalletConnectionResponseSchema.parse(createWalletConnection(db, user.id, body))
      saveDb()
      return HttpResponse.json(conn, { status: 200 })
    }),
  ),

  http.delete(
    `${API}/wallet-connections/:id`,
    withNetwork<{ id: string }>('DELETE /wallet-connections/:id', ({ request, params }) => {
      const db = loadDb()
      getAuthenticatedUser(db, request.headers.get('Authorization'))
      deleteWalletConnection(db, String(params.id))
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.post(
    `${API}/orders`,
    withNetwork('POST /orders', async ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const body = CreateOrderInputSchema.parse(await request.json())
      const idempotencyKey = request.headers.get('Idempotency-Key')

      try {
        const { order, reused, mutatedNfts } = await createOrderFromQuote(
          db,
          user.id,
          idempotencyKey,
          body,
        )
        saveDb()

        for (const nft of mutatedNfts) {
          broadcastNftUpdated(nft)
        }

        if (!reused) {
          scheduleOrderSettlement(order.id)
        }

        if (!reused && getActiveScenarioId() === 'order-timeout') {
          await delay(10_000)
        }

        const parsedOrder = OrderSchema.parse(order)
        return HttpResponse.json(parsedOrder, { status: reused ? 200 : 201 })
      } catch (err) {
        saveDb()
        if (err instanceof MockHttpError && err.details?.updatedNft) {
          broadcastNftUpdated(err.details.updatedNft as never)
        }
        throw err
      }
    }),
  ),

  http.get(
    `${API}/orders/:id`,
    withNetwork<{ id: string }>('GET /orders/:id', ({ request, params }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const order = OrderSchema.parse(getOrderForUser(db, user.id, String(params.id)))
      return HttpResponse.json(order, { status: 200 })
    }),
  ),

  http.get(
    `${API}/orders`,
    withNetwork('GET /orders', ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const items = getPendingOrdersForUser(db, user.id)
      const result = PendingOrdersResponseSchema.parse({ items })
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.get(
    `${API}/me/profile`,
    withNetwork('GET /me/profile', ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const profile = ProfileSchema.parse(getProfileForUser(db, user.id))
      return HttpResponse.json(profile, { status: 200 })
    }),
  ),

  http.patch(
    `${API}/me/profile`,
    withNetwork('PATCH /me/profile', async ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const body = UpdateProfileInputSchema.parse(await request.json())
      const profile = ProfileSchema.parse(updateProfileForUser(db, user.id, body))
      saveDb()
      return HttpResponse.json(profile, { status: 200 })
    }),
  ),

  http.put(
    `${API}/me/avatar`,
    withNetwork('PUT /me/avatar', async ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const contentType = request.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const json = (await request.json()) as { avatarUrl?: string | null }
        const result = AvatarResponseSchema.parse(
          updateAvatarForUser(db, user.id, json.avatarUrl ?? null),
        )
        saveDb()
        return HttpResponse.json(result, { status: 200 })
      }

      const formData = await request.formData()
      const file = formData.get('file')
      if (!(file instanceof File)) {
        throw new MockHttpError({
          status: 422,
          code: 'VALIDATION_FAILED',
          message: 'Arquivo de avatar inválido.',
        })
      }

      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new MockHttpError({
          status: 415,
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Formato não suportado. Use PNG, JPEG ou WebP.',
        })
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new MockHttpError({
          status: 413,
          code: 'FILE_TOO_LARGE',
          message: 'A imagem deve ter no máximo 2 MB.',
        })
      }

      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (const b of bytes) {
        binary += String.fromCharCode(b)
      }
      const dataUrl = `data:${file.type};base64,${btoa(binary)}`
      const result = AvatarResponseSchema.parse(updateAvatarForUser(db, user.id, dataUrl))
      saveDb()
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.post(
    `${API}/me/password`,
    withNetwork('POST /me/password', async ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const body = ChangePasswordInputSchema.parse(await request.json())
      await changePasswordForUser(db, user.id, body)
      saveDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    `${API}/me/wallets`,
    withNetwork('GET /me/wallets', ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const items = getWalletsForUser(db, user.id)
      const result = WalletsResponseSchema.parse({ items })
      return HttpResponse.json(result, { status: 200 })
    }),
  ),

  http.post(
    `${API}/me/wallets`,
    withNetwork('POST /me/wallets', async ({ request }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const body = CreateWalletInputSchema.parse(await request.json())
      const wallet = WalletSchema.parse(createWalletForUser(db, user.id, body))
      saveDb()
      return HttpResponse.json(wallet, { status: 201 })
    }),
  ),

  http.patch(
    `${API}/me/wallets/:id`,
    withNetwork<{ id: string }>('PATCH /me/wallets/:id', async ({ request, params }) => {
      const db = loadDb()
      const { user } = getAuthenticatedUser(db, request.headers.get('Authorization'))
      const body = UpdateWalletInputSchema.parse(await request.json())
      const wallet = WalletSchema.parse(updateWalletForUser(db, user.id, String(params.id), body))
      saveDb()
      return HttpResponse.json(wallet, { status: 200 })
    }),
  ),
]
