import { CheckoutPage } from '../support/checkout'
import { expect, test } from '../support/fixtures'
import { EMERALD } from '../support/nft-detail'

const FIFTY = { nftId: EMERALD.id, editionId: EMERALD.editions.fifty, quantity: 1 }

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
