import { expect, test } from '@playwright/test'

test.describe('Foundation & Simulated Server', () => {
  test('boots MSW before rendering and supports direct navigation and refresh on /cart', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-mocks', 'ready')
    await expect(
      page.getByRole('heading', { name: /SEJA DONO DO FUTURO DA ARTE DIGITAL/i }),
    ).toBeVisible()

    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-mocks', 'ready')
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  })

  test('intercepts all REST endpoints via MSW Service Worker and validates contracts', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-mocks', 'ready')

    const summary = await page.evaluate(async () => {
      const nftsRes = await fetch('/api/v1/nfts?page=1&pageSize=9')
      const nfts = await nftsRes.json()

      const featuredRes = await fetch('/api/v1/nfts/featured')
      const featured = await featuredRes.json()

      const detailRes = await fetch('/api/v1/nfts/emerald-ape-042')
      const detail = await detailRes.json()

      const loginRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'marina@nftmarket.test',
          password: 'Senha@1234',
        }),
      })
      const auth = await loginRes.json()
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.session.token}`,
      }

      const sessionRes = await fetch('/api/v1/auth/session', {
        headers: authHeaders,
      })
      const sessionData = await sessionRes.json()

      const favRes = await fetch('/api/v1/me/favorites', {
        headers: authHeaders,
      })
      const favorites = await favRes.json()

      const addCartRes = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          nftId: 'emerald-ape-042',
          editionId: 'emerald-ape-042-1-50',
          quantity: 1,
        }),
      })
      const cartAfterAdd = await addCartRes.json()

      const couponRes = await fetch('/api/v1/cart/coupon', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ code: 'BEMVINDO10' }),
      })
      const cartAfterCoupon = await couponRes.json()

      const quoteRes = await fetch('/api/v1/quotes', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ network: 'ethereum' }),
      })
      const quote = await quoteRes.json()

      const profileRes = await fetch('/api/v1/me/profile', {
        headers: authHeaders,
      })
      const profile = await profileRes.json()

      const walletsRes = await fetch('/api/v1/me/wallets', {
        headers: authHeaders,
      })
      const wallets = await walletsRes.json()

      const connRes = await fetch('/api/v1/wallet-connections', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          walletId: wallets.items[0].id,
          network: 'ethereum',
          provider: 'metamask',
        }),
      })
      const conn = await connRes.json()

      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Idempotency-Key': 'smoke-order-key-1',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          connectionId: conn.connectionId,
          buyer: {
            displayName: profile.displayName,
            username: profile.username,
            profileName: profile.username,
            email: profile.email,
            ensName: profile.ensName ?? 'nova.kurio',
            referralCode: profile.referralCode,
            note: null,
          },
        }),
      })
      const order = await orderRes.json()

      return {
        nftsTotal: nfts.total,
        featuredCount: featured.items.length,
        detailId: detail.id,
        sessionUserId: sessionData.user.id,
        favoritesCount: favorites.nftIds.length,
        cartItemsCount: cartAfterAdd.items.length,
        couponCode: cartAfterCoupon.couponCode,
        quoteTotal: quote.total,
        walletsCount: wallets.items.length,
        orderStatus: order.status,
        orderCount: window.__mock?.countOrders(auth.user.id) ?? 0,
      }
    })

    expect(summary).toEqual({
      nftsTotal: 48,
      featuredCount: 6,
      detailId: 'emerald-ape-042',
      sessionUserId: 'user-marina',
      favoritesCount: 3,
      cartItemsCount: 1,
      couponCode: 'BEMVINDO10',
      quoteTotal: '1.087',
      walletsCount: 2,
      orderStatus: 'pending',
      orderCount: 1,
    })
  })
})
