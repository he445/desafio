import type { Page } from '@playwright/test'
import { seedGuestCart } from '../support/cart'
import { CheckoutPage } from '../support/checkout'
import { expect, gotoReady, test } from '../support/fixtures'
import { EMERALD } from '../support/nft-detail'

const FIXED_NOW = new Date('2026-10-15T15:00:00-03:00')
const LINES = [
  { nftId: EMERALD.id, editionId: EMERALD.editions.fifty, quantity: 2 },
  { nftId: 'golden-beat-207', editionId: 'golden-beat-207-1-10', quantity: 1 },
]

// A full-page capture does not scroll, so lazy images below the fold would stay blank. Every
// image is loaded and decoded before the shot, and the fonts too.
async function settle(page: Page): Promise<void> {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = Array.from(document.images)
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  })
}

async function expectScreen(page: Page, name: string): Promise<void> {
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    mask: [page.locator('[data-sonner-toaster]')],
  })
}

test.describe('visual regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW)
  })

  test('home', async ({ page }) => {
    await gotoReady(page, '/')
    await expectScreen(page, 'home')
  })

  test('nft detail', async ({ page }) => {
    await gotoReady(page, `/nft/${EMERALD.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(EMERALD.title)
    await expectScreen(page, 'nft-detail')
  })

  test('cart', async ({ page }) => {
    await seedGuestCart(page, LINES)
    await gotoReady(page, '/cart')
    await expect(page.getByRole('list', { name: 'Itens do carrinho' })).toBeVisible()
    await expectScreen(page, 'cart')
  })

  test('payment', async ({ page }) => {
    await new CheckoutPage(page).openWithCart(LINES)
    await expectScreen(page, 'payment')
  })
})
