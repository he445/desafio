import { expect, gotoReady, signInThroughApi, test } from '../support/fixtures'
import { EMERALD, NftDetailPage } from '../support/nft-detail'

const favoritePath = `/me/favorites/${EMERALD.id}`

test.describe('favorites', () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page, '/')
    await signInThroughApi(page, 'rafael@nftmarket.test')
  })

  test('the heart changes at once and the choice survives a refresh', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await detail.open()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'false')

    const gate = await mock.hold({ method: 'PUT', path: favoritePath })
    await detail.favorite.click()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
    const saved = page.waitForResponse((response) => response.url().endsWith(favoritePath))
    await mock.release(gate)
    expect((await saved).status()).toBe(204)

    await page.reload()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')

    await gotoReady(page, '/favorites')
    await expect(page.getByRole('link', { name: new RegExp(EMERALD.title) })).toBeVisible()
  })

  test('a failed save rolls the heart back, says so, and a new try persists', async ({
    page,
    mock,
  }) => {
    const detail = new NftDetailPage(page)
    await detail.open()

    await mock.setRules([
      {
        match: { method: 'PUT', path: favoritePath },
        fail: { kind: 'http', status: 500, code: 'INTERNAL' },
      },
    ])
    await detail.favorite.click()
    await expect(page.getByText('Não foi possível atualizar seus favoritos.')).toBeVisible()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'false')

    await mock.clearRules()
    const saved = page.waitForResponse((response) => response.url().endsWith(favoritePath))
    await detail.favorite.click()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
    expect((await saved).status()).toBe(204)
    await page.reload()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
  })

  test('the list shows the empty state and offers the catalog', async ({ page }) => {
    await gotoReady(page, '/favorites')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
    await page.getByRole('link', { name: 'Explorar NFTs' }).click()
    await expect(page).toHaveURL(/\/#mercado$/)
  })
})

test('a visitor who favorites goes to the login and comes back to the NFT', async ({ page }) => {
  const detail = new NftDetailPage(page)
  await detail.open()

  await detail.favorite.click()
  await expect(page).toHaveURL(`/login?redirect=${encodeURIComponent(`/nft/${EMERALD.id}`)}`)

  await signInThroughApi(page, 'rafael@nftmarket.test')
  await page.reload()
  await expect(page).toHaveURL(`/nft/${EMERALD.id}`)
  await expect(detail.heading).toHaveText(EMERALD.title)
})
