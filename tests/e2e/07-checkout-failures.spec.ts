import { CartPage } from '../support/cart'
import { CheckoutPage } from '../support/checkout'
import { expect, gotoReady, loginAs, test } from '../support/fixtures'
import { EMERALD } from '../support/nft-detail'

const FIFTY = { nftId: EMERALD.id, editionId: EMERALD.editions.fifty, quantity: 1 }

test('a double click on confirm creates a single order', async ({ page, mock }) => {
  const checkout = new CheckoutPage(page)
  await checkout.openWithCart([FIFTY])
  await checkout.connect('MetaMask')

  await checkout.confirm.dblclick()

  await expect(page).toHaveURL(checkout.orderPath)
  await expect(checkout.receipt).toBeVisible()
  expect(await mock.countOrders('user-marina')).toBe(1)
})

test('an order of another user is not shown', async ({ page }) => {
  await loginAs(page, 'rafael')
  await gotoReady(page, '/orders/order-seed-marina-1')
  await expect(
    page.getByRole('heading', { name: 'Você não tem acesso a este pedido' }),
  ).toBeVisible()
})

test.describe('payment declined', () => {
  test.use({ scenario: 'payment-declined' })

  test('the refusal explains why and the cart keeps its items', async ({ page }) => {
    const checkout = new CheckoutPage(page)
    await checkout.openWithCart([FIFTY])
    await checkout.connect('MetaMask')
    await checkout.confirmPurchase()

    const refusal = page.getByRole('alert').filter({ hasText: 'Pagamento recusado' })
    await expect(refusal).toContainText('Saldo insuficiente na carteira')
    await expect(checkout.receipt).toHaveCount(0)
    await refusal.getByRole('link', { name: 'Voltar ao carrinho' }).click()

    const cart = new CartPage(page)
    await expect(cart.line(EMERALD.title, '1/50')).toBeVisible()
  })
})

test.describe('response lost to a timeout', () => {
  test.use({ scenario: 'order-timeout' })

  test('the resend with the same key recovers the order already created', async ({
    page,
    mock,
  }) => {
    test.setTimeout(45_000)
    const checkout = new CheckoutPage(page)
    await checkout.openWithCart([FIFTY])
    await checkout.connect('MetaMask')

    await checkout.confirm.click()
    await expect(page.getByText('Verificando seu pedido…')).toBeVisible({ timeout: 12_000 })
    await expect(page).toHaveURL(checkout.orderPath)

    await expect(checkout.receipt).toBeVisible()
    expect(await mock.countOrders('user-marina')).toBe(1)
  })
})

test.describe('price changed before the order', () => {
  test.use({ scenario: 'price-change-checkout' })

  test('the refused quote is reviewed and the new one confirmed', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    await checkout.openWithCart([FIFTY])
    await checkout.connect('MetaMask')

    await checkout.confirm.click()
    await expect(page.getByRole('alert')).toContainText('Os valores mudaram')
    await expect(checkout.confirm).toHaveAttribute('aria-disabled', 'true')
    await checkout.review.getByRole('button', { name: 'Revisar nova cotação' }).click()

    await checkout.confirmPurchase()
    await expect(checkout.receipt).toContainText('1.34 ETH')
    expect(await mock.countOrders('user-marina')).toBe(1)
  })
})

test.describe('edition sold out before the order', () => {
  test.use({ scenario: 'sold-out-checkout' })

  test('the purchase stops and points back to the cart', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    await checkout.openWithCart([FIFTY])
    await checkout.connect('MetaMask')

    await checkout.confirm.click()

    await expect(page.getByRole('alert')).toContainText(
      `Estoque insuficiente para ${EMERALD.title}`,
    )
    await expect(checkout.confirm).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByRole('link', { name: 'Voltar ao carrinho' })).toBeVisible()
    expect(await mock.countOrders('user-marina')).toBe(0)
  })
})

test.describe('wallet disconnects before the order', () => {
  test.use({ scenario: 'wallet-disconnect' })

  test('the option asks to reconnect and the purchase goes through after it', async ({
    page,
    mock,
  }) => {
    const checkout = new CheckoutPage(page)
    await checkout.openWithCart([FIFTY])
    await checkout.connect('MetaMask')

    await checkout.confirm.click()
    await expect(checkout.provider('MetaMask')).toContainText('Desconectada · Reconectar')
    await expect(checkout.confirm).toHaveAttribute('aria-disabled', 'true')

    await checkout.connect('MetaMask')
    await checkout.confirmPurchase()
    await expect(checkout.receipt).toBeVisible()
    expect(await mock.countOrders('user-marina')).toBe(1)
  })
})

test.describe('wallet refuses the connection', () => {
  test.use({ scenario: 'wallet-rejected' })

  test('the option says it was refused and the purchase stays blocked', async ({ page }) => {
    const checkout = new CheckoutPage(page)
    await checkout.openWithCart([FIFTY])

    await checkout.provider('MetaMask').click()

    await expect(checkout.provider('MetaMask')).toContainText('Recusada · Tentar de novo')
    await expect(checkout.confirm).toHaveAttribute('aria-disabled', 'true')
  })
})
