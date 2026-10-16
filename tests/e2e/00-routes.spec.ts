import type { Page } from '@playwright/test'
import { expect, gotoReady, signInThroughApi, test } from '../support/fixtures'

interface RouteCase {
  path: string
  heading: string | { desktop: string; mobile: string }
}

const PUBLIC_ROUTES: RouteCase[] = [
  {
    path: '/',
    heading: {
      desktop: 'SEJA DONO DO FUTURO DA ARTE DIGITAL',
      mobile: 'SEJA DONO DA CULTURA DIGITAL',
    },
  },
  { path: '/nft/emerald-ape-042', heading: 'Emerald Ape #042' },
  { path: '/nft/nft-que-nao-existe', heading: 'NFT não encontrado' },
  { path: '/cart', heading: 'Carrinho de NFTs' },
  { path: '/login', heading: 'Entrar' },
  {
    path: '/register',
    heading: { desktop: 'Criar conta', mobile: 'Criar perfil de colecionador' },
  },
  { path: '/rota-que-nao-existe', heading: 'Página não encontrada' },
]

const PRIVATE_ROUTES: RouteCase[] = [
  { path: '/checkout', heading: { desktop: 'Pagamento', mobile: 'Pagamento com carteira' } },
  { path: '/orders/order-seed-marina-1', heading: 'Pedido' },
  { path: '/profile', heading: 'Meu perfil' },
  { path: '/wallets', heading: 'Carteiras' },
  { path: '/favorites', heading: 'Lista de interesse' },
]

async function expectSingleHeading(page: Page, heading: RouteCase['heading']) {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024
  const expected = typeof heading === 'string' ? heading : heading[isDesktop ? 'desktop' : 'mobile']
  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toHaveCount(1)
  await expect(h1).toHaveText(expected)
}

test('every public route resolves on direct access', async ({ page }) => {
  for (const route of PUBLIC_ROUTES) {
    await gotoReady(page, route.path)
    await expectSingleHeading(page, route.heading)
  }
})

test('a private route sends a visitor to the login and back after signing in', async ({ page }) => {
  for (const route of PRIVATE_ROUTES) {
    await gotoReady(page, route.path)
    await expect(page).toHaveURL(`/login?redirect=${encodeURIComponent(route.path)}`)
    await expectSingleHeading(page, 'Entrar')
  }

  await signInThroughApi(page, 'marina@nftmarket.test')
  await page.reload()
  await expect(page).toHaveURL('/favorites')
  await expectSingleHeading(page, 'Lista de interesse')

  for (const route of PRIVATE_ROUTES) {
    await gotoReady(page, route.path)
    await expect(page).toHaveURL(route.path)
    await expectSingleHeading(page, route.heading)
  }
})

test('a signed-in user skips the login and never follows a redirect off the site', async ({
  page,
}) => {
  await gotoReady(page, '/')
  await signInThroughApi(page, 'marina@nftmarket.test')

  await gotoReady(page, '/login?redirect=%2Fwallets')
  await expect(page).toHaveURL('/wallets')

  for (const target of ['https://example.com/phish', '//example.com', '/\\example.com']) {
    await gotoReady(page, `/register?redirect=${encodeURIComponent(target)}`)
    await expect(page).toHaveURL('/')
  }
})
