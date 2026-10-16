import { CartPage, seedGuestCart } from '../support/cart'
import { CatalogPage } from '../support/catalog'
import { expect, gotoReady, test } from '../support/fixtures'

const isNftList = (url: string) => new URL(url).pathname === '/api/v1/nfts'
const isCart = (url: string) => new URL(url).pathname === '/api/v1/cart'
const FIFTY = { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50' }

test.describe('slow network', () => {
  test.use({ scenario: 'slow' })

  test('the catalog shows skeletons while it loads and then the cards', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await gotoReady(page, '/')

    await expect(page.locator('[aria-busy="true"]')).toBeVisible()
    await expect(page.getByText('Carregando catálogo…')).toBeAttached()
    await expect(catalog.cards).toHaveCount(0)

    await expect(catalog.cards.first()).toBeVisible()
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  })

  test('the NFT detail shows its skeleton and then the NFT', async ({ page }) => {
    await gotoReady(page, '/nft/emerald-ape-042')

    await expect(page.getByText('Carregando NFT…')).toBeAttached()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('Carregando NFT…')).toHaveCount(0)
  })

  test('the cart shows skeletons for the lines and then for the summary', async ({ page }) => {
    const cart = new CartPage(page)
    await seedGuestCart(page, [{ ...FIFTY, quantity: 1 }])
    await cart.open()

    await expect(page.getByText('Carregando carrinho…')).toBeAttached()
    await expect(cart.lines).toHaveCount(1)
    await expect(page.getByText('Carregando carrinho…')).toHaveCount(0)
    await expect(page.getByText('Atualizando o resumo…')).toBeAttached()
    await expect(cart.checkout).toHaveAttribute('aria-disabled', 'true')
    await expect(cart.summaryValue('Total')).toHaveText('1.206 ETH')
    await expect(page.getByText('Atualizando o resumo…')).toHaveCount(0)
  })
})

test.describe('offline', () => {
  test.use({ scenario: 'offline' })

  test('the cart explains the failure and tries again on demand', async ({ page }) => {
    await gotoReady(page, '/cart')

    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar o carrinho' })
    await expect(alert).toContainText('Sem conexão com o servidor')
    const asked = page.waitForRequest((request) => isCart(request.url()))
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await asked
  })
})

test.describe('server error', () => {
  test.use({ scenario: 'server-error' })

  test('the catalog explains the failure and tries again on demand', async ({ page }) => {
    await gotoReady(page, '/')

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('Não foi possível carregar o catálogo')
    const retry = alert.getByRole('button', { name: 'Tentar novamente' })
    await expect(retry).toBeVisible()

    const asked = page.waitForRequest((request) => isNftList(request.url()))
    await retry.click()
    await asked
  })
})

test.describe('transient failure', () => {
  test.use({ scenario: 'flaky' })

  test('the catalog recovers by itself when the first answer is a 503', async ({ page }) => {
    const statuses: number[] = []
    page.on('response', (response) => {
      if (isNftList(response.url())) statuses.push(response.status())
    })
    const catalog = new CatalogPage(page)
    await gotoReady(page, '/')

    await expect(catalog.cards.first()).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(statuses[0]).toBe(503)
    expect(statuses).toContain(200)
  })
})

test.describe('empty catalog', () => {
  test.use({ scenario: 'empty-catalog' })

  test('the catalog says there is nothing to show and offers no filter to clear', async ({
    page,
  }) => {
    await gotoReady(page, '/')

    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Limpar filtros' })).toHaveCount(0)
  })
})

test('the catalog recovers when the connection comes back', async ({ page, mock }) => {
  const catalog = new CatalogPage(page)
  await catalog.open()

  await mock.setRules([{ match: { method: 'GET', path: '/nfts' }, fail: { kind: 'network' } }])
  await catalog.chooseTab('Em alta')
  await expect(page.getByRole('alert')).toContainText('Sem conexão com o servidor')

  await mock.clearRules()
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(catalog.cards).toHaveCount(9)
  await expect(page).toHaveURL(/tab=trending/)
})

test('the NFT detail explains a failure and recovers on demand', async ({ page, mock }) => {
  const catalog = new CatalogPage(page)
  await catalog.open()

  await mock.setRules([
    {
      match: { method: 'GET', path: '/nfts/emerald-ape-042' },
      fail: { kind: 'http', status: 500, code: 'INTERNAL' },
    },
  ])
  await catalog.cards
    .getByRole('link', { name: /Emerald Ape #042/ })
    .first()
    .click()
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Algo deu errado')

  await mock.clearRules()
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
})

test('the cart summary explains a failed quote and recovers on demand', async ({ page, mock }) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [{ ...FIFTY, quantity: 1 }])
  await cart.open()
  await expect(cart.summaryValue('Total')).toHaveText('1.206 ETH')

  await mock.setRules([
    {
      match: { method: 'POST', path: '/quotes' },
      fail: { kind: 'http', status: 500, code: 'INTERNAL' },
    },
  ])
  await cart.lines.first().getByRole('button', { name: 'Aumentar quantidade' }).click()
  const alert = cart.summary.getByRole('alert')
  await expect(alert).toContainText('Não foi possível calcular o resumo.')
  await expect(cart.checkout).toHaveAttribute('aria-disabled', 'true')

  await mock.clearRules()
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(cart.summaryValue('Total')).toHaveText('2.396 ETH')
  await expect(cart.checkout).not.toHaveAttribute('aria-disabled')
})
