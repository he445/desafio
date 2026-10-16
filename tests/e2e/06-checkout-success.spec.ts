import { CheckoutPage } from '../support/checkout'
import { expect, test } from '../support/fixtures'
import { EMERALD } from '../support/nft-detail'

const FIFTY = { nftId: EMERALD.id, editionId: EMERALD.editions.fifty, quantity: 1 }

test('the desktop checkout fills the collector profile from the wallet and follows the network', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The collector profile form only exists in the desktop layout.')
  const checkout = new CheckoutPage(page)
  await checkout.openWithCart([FIFTY])

  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Marina Costa')
  await expect(page.getByLabel('Código de indicação')).toHaveValue('KURIO-2048')
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
    '0xA91F3b7C2d9E0f4A6b8C1d3E5f7A9b0C2d4EE82C',
  )
  await expect(page.getByRole('list', { name: 'Seus NFTs' })).toContainText(EMERALD.title)
  await expect(checkout.confirm).toHaveAttribute('aria-disabled', 'true')
  await expect(
    page.getByText('Conecte a carteira em “Carteira e rede” para confirmar.'),
  ).toBeVisible()

  await checkout.connect('MetaMask')
  await expect(page.getByLabel('Tipo de carteira')).toHaveText('MetaMask')
  await expect(checkout.confirm).not.toHaveAttribute('aria-disabled')

  await page.getByRole('combobox', { name: 'Rede' }).click()
  await expect(page.getByRole('option', { name: 'Solana (sem carteira)' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  await page.getByRole('option', { name: 'Polygon' }).click()
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
    '0x5D3e9a1B7c2F4d6E8a0B1c3D5e7F9a2B4c6D8e0F',
  )
  await expect(page.getByLabel('ENS ou carteira secundária (opcional)')).toHaveValue(
    'nova.kurio.eth',
  )
  // A connection belongs to one wallet: switching networks asks for a new one.
  await expect(checkout.provider('MetaMask')).not.toContainText('Conectada')
  await expect(checkout.confirm).toHaveAttribute('aria-disabled', 'true')
  await checkout.connect('Coinbase Wallet')
  await expect(checkout.confirm).not.toHaveAttribute('aria-disabled')
})

test('the phone checkout lists the saved wallets and connects the chosen one', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The saved wallet cards only exist in the phone layout.')
  const checkout = new CheckoutPage(page)
  await checkout.openWithCart([FIFTY])

  const wallets = page.getByRole('radiogroup', { name: 'Carteira conectada' })
  await expect(wallets.getByRole('radio', { name: /Principal/ })).toBeChecked()
  await expect(page.getByText('Total:')).toBeVisible()

  await wallets.getByRole('radio', { name: /Reserva/ }).check()
  await expect(wallets).toContainText('Rede Polygon')
  await checkout.connect('Coinbase Wallet')
  await expect(checkout.confirm).not.toHaveAttribute('aria-disabled')
})
