import { CatalogPage } from '../support/catalog'
import { expect, gotoReady, test } from '../support/fixtures'

const isNftList = (url: string) => new URL(url).pathname === '/api/v1/nfts'

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
