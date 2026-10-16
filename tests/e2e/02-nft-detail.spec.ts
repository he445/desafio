import { expect, test } from '../support/fixtures'
import { EMERALD, NftDetailPage } from '../support/nft-detail'

test.describe('NFT detail', () => {
  test('opens from a direct link and survives a refresh', async ({ page }) => {
    const detail = new NftDetailPage(page)
    await detail.open()
    await expect(page).toHaveTitle(`${EMERALD.title} | Kurio`)

    await page.reload()
    await expect(detail.heading).toHaveText(EMERALD.title)
    await expect(detail.edition('1/10')).toBeChecked()
    await expect(detail.price('1.49')).toBeVisible()
  })

  test('shows its own not found page for an unknown id', async ({ page }) => {
    const detail = new NftDetailPage(page)
    await page.goto('/nft/nft-que-nao-existe')
    await expect(detail.heading).toHaveText('NFT não encontrado')
    await page.getByRole('link', { name: 'Voltar ao mercado' }).click()
    await expect(page).toHaveURL(/\/#mercado$/)
  })

  test('warns about a sold out or unknown edition in the URL and picks one in stock', async ({
    page,
  }) => {
    const detail = new NftDetailPage(page)
    for (const edition of [EMERALD.editions.unique, 'edicao-inventada']) {
      await detail.open(`/nft/${EMERALD.id}?edition=${edition}`)
      await expect(
        page.getByRole('status').filter({ hasText: 'Esta edição está indisponível' }),
      ).toBeVisible()
      await expect(detail.edition('1/10')).toBeChecked()
    }
    await expect(detail.edition('1/1')).toBeDisabled()
    await expect(detail.edition('1/1')).toContainText('Esgotada')

    await detail.edition('1/50').click()
    await expect(page).toHaveURL(new RegExp(`edition=${EMERALD.editions.fifty}`))
    await expect(page.getByText('Esta edição está indisponível')).toHaveCount(0)
    await expect(detail.price('1.19')).toBeVisible()
    await expect(page.getByText('Tiragem 50 · 12 disponíveis')).toBeVisible()
  })

  test('stops the quantity at the edition limit, counting what is already in the cart', async ({
    page,
  }) => {
    const detail = new NftDetailPage(page)
    await detail.open(`/nft/${EMERALD.id}?edition=${EMERALD.editions.ten}`)

    await expect(detail.quantity).toHaveText('1')
    await detail.increase.click()
    await expect(detail.quantity).toHaveText('2')
    await expect(detail.increase).toBeDisabled()
    await expect(page.getByText('Limite desta edição: 2 por pedido.')).toBeVisible()

    await detail.buy.click()
    await expect(page).toHaveURL('/cart')

    await detail.open(`/nft/${EMERALD.id}?edition=${EMERALD.editions.ten}`)
    await expect(page.getByText('Você já tem 2 desta edição no carrinho')).toBeVisible()
    await expect(detail.buy).toBeDisabled()
  })

  test('the gallery follows the arrow keys', async ({ page }) => {
    const detail = new NftDetailPage(page)
    await detail.open()
    await expect(page.locator('img[fetchpriority="high"]')).toHaveCount(1)

    if (detail.isDesktop) {
      const first = page.getByRole('button', { name: 'Imagem 1 de 4' })
      await first.focus()
      await page.keyboard.press('ArrowDown')
      const second = page.getByRole('button', { name: 'Imagem 2 de 4' })
      await expect(second).toBeFocused()
      await expect(second).toHaveAttribute('aria-pressed', 'true')
    } else {
      await page.getByRole('button', { name: 'Página 1 de 4' }).press('ArrowRight')
      await expect(page.getByRole('button', { name: 'Página 2 de 4' })).toHaveAttribute(
        'aria-current',
        'true',
      )
    }
  })

  test('the phone buy bar adds to the cart without leaving the page', async ({ page }) => {
    const detail = new NftDetailPage(page)
    test.skip(detail.isDesktop, 'the cart button only exists in the phone buy bar')
    await detail.open()

    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()
    await page.getByRole('button', { name: 'Ver carrinho' }).click()
    await expect(page).toHaveURL('/cart')
  })
})
