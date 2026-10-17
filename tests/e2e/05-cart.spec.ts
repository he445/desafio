import type { Quote } from '../../src/contracts'
import { CartPage, seedGuestCart } from '../support/cart'
import { expect, loginAs, test } from '../support/fixtures'
import { EMERALD, NftDetailPage } from '../support/nft-detail'

const FIFTY = { nftId: EMERALD.id, editionId: EMERALD.editions.fifty }
const TEN = { nftId: EMERALD.id, editionId: EMERALD.editions.ten }

const isQuote = (url: string) => new URL(url).pathname === '/api/v1/quotes'

function displayed(amount: string): string {
  const [whole, fraction = ''] = amount.split('.')
  return `${whole}.${fraction.padEnd(2, '0')} ETH`
}

test('a visitor adds from the detail page and the cart keeps it after a refresh', async ({
  page,
}) => {
  const detail = new NftDetailPage(page)
  const cart = new CartPage(page)
  await detail.open(`/nft/${EMERALD.id}?edition=${EMERALD.editions.fifty}`)
  await detail.increase.click()
  await detail.buy.click()
  await expect(page).toHaveURL('/cart')

  const line = cart.line(EMERALD.title, '1/50')
  await expect(cart.quantityOf(line)).toHaveText('2')
  await expect(line).toContainText('1.19 ETH')

  await page.reload()
  await expect(cart.quantityOf(cart.line(EMERALD.title, '1/50'))).toHaveText('2')
})

test('the totals on screen are the ones the quote returned', async ({ page }) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [
    { ...FIFTY, quantity: 2 },
    { ...TEN, quantity: 1 },
  ])
  const quoted = page.waitForResponse((response) => isQuote(response.url()))
  await cart.open()
  const quote = (await (await quoted).json()) as Quote

  await expect(cart.summaryValue('Subtotal')).toHaveText(displayed(quote.subtotal))
  await expect(cart.summaryValue('Taxa de rede')).toContainText(displayed(quote.networkFee))
  await expect(cart.summaryValue('Total')).toHaveText(displayed(quote.total))
  expect(quote.subtotal).toBe('3.87')
  expect(quote.total).toBe('3.886')
  await expect(cart.checkout).not.toHaveAttribute('aria-disabled')
})

test('quantities change through the server and a stock conflict is handled', async ({
  page,
  mock,
}) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [{ ...FIFTY, quantity: 1 }])
  await cart.open()
  const line = cart.line(EMERALD.title, '1/50')
  const increase = line.getByRole('button', { name: 'Aumentar quantidade' })

  const patched = page.waitForRequest(
    (request) => request.method() === 'PATCH' && request.url().includes('/cart/items/'),
  )
  await increase.click()
  expect((await patched).postDataJSON()).toEqual({ quantity: 2 })
  await expect(cart.quantityOf(line)).toHaveText('2')
  await expect(cart.summaryValue('Subtotal')).toHaveText('2.38 ETH')

  // Someone else bought most of the stock. The stock event makes the page refetch the cart and
  // disable "+"; holding that refetch keeps the page stale, so the server's 409 is what refuses
  // the third unit.
  const gate = await mock.hold({ method: 'GET', path: '/cart' })
  await mock.changeEdition({ ...FIFTY, available: 2 })
  await increase.click()
  await expect(page.getByText('Limite disponível para esta edição: 2.')).toBeVisible()
  await mock.release(gate)
  await expect(cart.quantityOf(line)).toHaveText('2')
  await expect(increase).toBeDisabled()
})

test('server warnings: a price change informs, missing stock blocks until adjusted', async ({
  page,
  mock,
}) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [{ ...FIFTY, quantity: 4 }])
  await mock.changeEdition({ ...FIFTY, price: '1.35', available: 2 })
  await cart.open()
  const line = cart.line(EMERALD.title, '1/50')

  await expect(line).toContainText('Preço mudou de 1.19 para 1.35 ETH')
  await expect(line).toContainText('Restam 2 unidades')
  await expect(cart.checkout).toHaveAttribute('aria-disabled', 'true')
  await expect(
    page.getByText('Ajuste a quantidade dos itens destacados para continuar.'),
  ).toBeVisible()

  await line.getByRole('button', { name: 'Ajustar para 2' }).click()
  await expect(cart.quantityOf(line)).toHaveText('2')
  await expect(line).not.toContainText('Restam 2 unidades')
  await expect(line).toContainText('Preço mudou de 1.19 para 1.35 ETH')
  await expect(cart.summaryValue('Subtotal')).toHaveText('2.70 ETH')
  await expect(cart.checkout).not.toHaveAttribute('aria-disabled')
})

test('removing a line moves the focus to the next one, and the last one empties the cart', async ({
  page,
}) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [
    { ...FIFTY, quantity: 1 },
    { ...TEN, quantity: 1 },
  ])
  await cart.open()
  await expect(cart.lines).toHaveCount(2)

  await cart.lines
    .first()
    .getByRole('button', { name: `Remover ${EMERALD.title}` })
    .click()
  await expect(cart.lines).toHaveCount(1)
  await expect(
    cart.line(EMERALD.title, '1/10').getByRole('button', { name: `Remover ${EMERALD.title}` }),
  ).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeFocused()
  await expect(cart.summary).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('coupons: invalid and expired codes are reported on the field, a valid one is a chip', async ({
  page,
}) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [{ ...FIFTY, quantity: 1 }])
  await cart.open()

  await cart.applyCoupon('XPTO')
  await expect(page.getByText('Código promocional inválido')).toBeVisible()
  await expect(cart.couponInput).toHaveAttribute('aria-invalid', 'true')
  await expect(cart.couponInput).toBeFocused()

  await cart.applyCoupon('VERAO25')
  await expect(page.getByText('Código promocional expirado')).toBeVisible()

  const quoted = page.waitForResponse((response) => isQuote(response.url()))
  await cart.applyCoupon('bemvindo10')
  const quote = (await (await quoted).json()) as Quote
  expect(quote.couponCode).toBe('BEMVINDO10')
  expect(quote.discount).toBe('0.119')
  const remove = page.getByRole('button', { name: 'Remover o cupom BEMVINDO10' })
  await expect(remove).toBeFocused()
  await expect(cart.summaryValue('Desconto do lançamento')).toHaveText('(-) 0.119 ETH')
  await expect(cart.summaryValue('Total')).toHaveText('1.087 ETH')

  await page.reload()
  await remove.click()
  await expect(cart.couponInput).toBeFocused()
  await expect(cart.summaryValue('Desconto do lançamento')).toHaveText('(-) 0.00 ETH')
})

test('a visitor goes to the login from the cart and the items survive it', async ({ page }) => {
  const cart = new CartPage(page)
  await seedGuestCart(page, [{ ...FIFTY, quantity: 2 }])
  await cart.open()

  await cart.checkout.click()
  await expect(page).toHaveURL('/login?redirect=%2Fcheckout')
  await loginAs(page, 'rafael')
  await expect(page).toHaveURL('/checkout')

  await cart.open()
  await expect(cart.quantityOf(cart.line(EMERALD.title, '1/50'))).toHaveText('2')
  await expect(
    page.evaluate(() => localStorage.getItem('nftmkt:guest-cart-id')),
  ).resolves.toBeNull()
})

test('the header counts the units in the cart', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The phone layout has no header on these screens.')
  const cart = new CartPage(page)
  await seedGuestCart(page, [
    { ...FIFTY, quantity: 2 },
    { ...TEN, quantity: 1 },
  ])
  await cart.open()
  await expect(page.getByRole('link', { name: 'Carrinho, 3 itens' })).toBeVisible()

  await cart
    .line(EMERALD.title, '1/10')
    .getByRole('button', { name: /^Remover/ })
    .click()
  await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()
})
