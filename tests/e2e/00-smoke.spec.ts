import { expect, gotoReady, test } from '../support/fixtures'

test('boots the mock before rendering and survives a refresh on a deep route', async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, '/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    isMobile ? 'SEJA DONO DA CULTURA DIGITAL' : 'SEJA DONO DO FUTURO DA ARTE DIGITAL',
  )

  await gotoReady(page, '/cart')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Carrinho de NFTs')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-mocks', 'ready')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Carrinho de NFTs')
})
