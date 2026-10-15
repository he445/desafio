import { expect, test } from '@playwright/test'

test.describe('Phase 0 smoke', () => {
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
})
