import type { Page, Request } from '@playwright/test'
import { expect, gotoReady, loginAs, PASSWORD, test, USERS } from '../support/fixtures'
import { EMERALD, NftDetailPage } from '../support/nft-detail'

const favoritesGrid = 'ul[aria-label="Lista de interesse"] li'

test.describe('registration', () => {
  test('a taken e-mail is reported on its field, and a new one signs in and follows the redirect', async ({
    page,
  }) => {
    await gotoReady(page, '/register?redirect=%2Ffavorites')
    await page.getByLabel('Nome de usuário', { exact: true }).fill('nova.colecionadora')
    const email = page.getByLabel('E-mail', { exact: true })
    await email.fill(USERS.marina)
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirmar senha', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()

    await expect(page.getByText('E-mail já cadastrado')).toBeVisible()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toBeFocused()
    await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('')

    await email.fill('nova.colecionadora@nftmarket.test')
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirmar senha', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()

    await expect(page).toHaveURL('/favorites')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  })

  test('the form checks the password rules and the confirmation before sending', async ({
    page,
  }) => {
    await gotoReady(page, '/register')
    await page.getByLabel('Senha', { exact: true }).fill('curta1')
    await page.getByLabel('Confirmar senha', { exact: true }).fill('outra')
    await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()

    await expect(page.getByText('Campo obrigatório').first()).toBeVisible()
    await expect(page.getByText('A senha precisa de pelo menos 8 caracteres')).toBeVisible()
    await expect(page.getByText('As senhas não conferem')).toBeVisible()
    await expect(page.getByLabel('Nome de usuário', { exact: true })).toBeFocused()
  })
})

test('wrong credentials show a focused summary and clear the password', async ({ page }) => {
  await gotoReady(page, '/login')
  await page.getByLabel('E-mail', { exact: true }).fill(USERS.marina)
  await page.getByLabel('Senha', { exact: true }).fill('Errada@123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  const alert = page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos' })
  await expect(alert).toBeFocused()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('')
})

test('a private route sends a visitor to the login and back', async ({ page }) => {
  await gotoReady(page, '/checkout')
  await expect(page).toHaveURL('/login?redirect=%2Fcheckout')
  await loginAs(page, 'marina')
  await expect(page).toHaveURL('/checkout')
})

// The detail page asks for the favorites and the cart as soon as it renders. Expiring the session
// while one of them still waits for its answer turns it, not the click, into the 401, and the page
// leaves for the login before the click. A response wait set before the navigation can also be met
// by the page being left, so the test waits until no API request has been open for half a second.
function trackApi(page: Page): () => Promise<void> {
  const open = new Set<Request>()
  let lastChange = Date.now()
  page.on('request', (request) => {
    if (!new URL(request.url()).pathname.startsWith('/api/v1/')) return
    open.add(request)
    lastChange = Date.now()
  })
  const settle = (request: Request) => {
    if (open.delete(request)) lastChange = Date.now()
  }
  page.on('requestfinished', settle)
  page.on('requestfailed', settle)
  return () => expect.poll(() => open.size === 0 && Date.now() - lastChange > 500).toBe(true)
}

test.describe('session expiry', () => {
  test('the same person signs in again and lands where they were', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const apiSettled = trackApi(page)
    await loginAs(page, 'rafael')
    const path = `/nft/${EMERALD.id}?edition=${EMERALD.editions.fifty}`
    await detail.open(path)
    await apiSettled()

    await mock.expireSession()
    await detail.favorite.click()

    await expect(page).toHaveURL(/\/login\?.*reason=expired/)
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()
    await loginAs(page, 'rafael')
    await expect(page).toHaveURL(path)
    await expect(detail.edition('1/50')).toBeChecked()
  })

  test('someone else signing in does not land on the previous page', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const apiSettled = trackApi(page)
    await loginAs(page, 'marina')
    await detail.open()
    await apiSettled()

    await mock.expireSession()
    await detail.favorite.click()
    await expect(page).toHaveURL(/\/login\?.*reason=expired/)
    await loginAs(page, 'rafael')
    await expect(page).toHaveURL('/')
  })
})

test('after a logout and a new login, nothing of the previous user shows up', async ({ page }) => {
  await loginAs(page, 'marina')
  await gotoReady(page, '/favorites')
  await expect(page.locator(favoritesGrid)).toHaveCount(3)

  // Records any frame in which a favorites card is on screen from here on.
  await page.evaluate((selector) => {
    const w = window as unknown as { __leak?: boolean }
    new MutationObserver(() => {
      if (window.location.pathname === '/favorites' && document.querySelector(selector)) {
        w.__leak = true
      }
    }).observe(document.body, { childList: true, subtree: true })
  }, favoritesGrid)

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await page.evaluate(() => {
    ;(window as unknown as { __leak?: boolean }).__leak = false
  })

  // Everything below is client side navigation, so marina's cache would still be in memory.
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024
  if (isDesktop) {
    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/login/)
    await loginAs(page, 'rafael')
    await page.getByRole('button', { name: 'Conta' }).click()
    await page.getByRole('menuitem', { name: 'Lista de interesse' }).click()
  } else {
    await page
      .getByRole('navigation', { name: 'Navegação inferior' })
      .getByRole('link', { name: 'Lista de interesse' })
      .click()
    await expect(page).toHaveURL(/\/login/)
    await loginAs(page, 'rafael')
  }

  await expect(page).toHaveURL('/favorites')
  await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __leak?: boolean }).__leak)).toBeFalsy()
})
