import { recordAnnouncements } from '../support/announcements'
import { CartPage, seedGuestCart } from '../support/cart'
import { expect, test } from '../support/fixtures'
import { EMERALD, NftDetailPage } from '../support/nft-detail'

const FIFTY = { nftId: EMERALD.id, editionId: EMERALD.editions.fifty }

declare global {
  interface Window {
    __sameDocument?: boolean
  }
}

// Marks the document, so a test proves the change arrived over the socket and not by a reload.
async function markDocument(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    window.__sameDocument = true
  })
}

async function expectSameDocument(page: import('@playwright/test').Page): Promise<void> {
  expect(await page.evaluate(() => window.__sameDocument)).toBe(true)
}

test('a price change reaches the open cart: line warning, new summary and one announcement', async ({
  page,
  mock,
}) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [{ ...FIFTY, quantity: 1 }])
  await cart.open()
  const line = cart.line(EMERALD.title, '1/50')
  await expect(cart.summaryValue('Subtotal')).toHaveText('1.19 ETH')
  await mock.waitForSocket()
  await markDocument(page)
  const announcements = await recordAnnouncements(page)

  await mock.changeEdition({ ...FIFTY, price: '1.35' })

  await expect(line).toContainText('Preço mudou de 1.19 para 1.35 ETH')
  await expect(cart.summaryValue('Subtotal')).toHaveText('1.35 ETH')
  await expect
    .poll(announcements)
    .toEqual(['O preço de Emerald Ape #042 (1/50) mudou para 1.35 ETH'])
  await expectSameDocument(page)
})

test('a stock drop reaches the open cart and blocks checkout until the line is adjusted', async ({
  page,
  mock,
}) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [{ ...FIFTY, quantity: 4 }])
  await cart.open()
  const line = cart.line(EMERALD.title, '1/50')
  await expect(cart.checkout).not.toHaveAttribute('aria-disabled')
  await mock.waitForSocket()
  await markDocument(page)

  await mock.changeEdition({ ...FIFTY, available: 2 })

  await expect(line).toContainText('Restam 2 unidades')
  await expect(cart.checkout).toHaveAttribute('aria-disabled', 'true')
  await line.getByRole('button', { name: 'Ajustar para 2' }).click()
  await expect(cart.checkout).not.toHaveAttribute('aria-disabled')
  await expectSameDocument(page)
})

test('the detail page shows the new price without a reload', async ({ page, mock }) => {
  const detail = new NftDetailPage(page)
  await detail.open(`/nft/${EMERALD.id}?edition=${EMERALD.editions.fifty}`)
  await expect(detail.price('1.19')).toBeVisible()
  await mock.waitForSocket()
  await markDocument(page)

  await mock.changeEdition({ ...FIFTY, price: '1.35' })

  await expect(detail.price('1.35')).toBeVisible()
  await expectSameDocument(page)
})
