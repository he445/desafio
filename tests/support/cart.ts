import { expect, type Locator, type Page } from '@playwright/test'
import { GUEST_CART_ID_KEY } from '../../src/lib/storage'
import { gotoReady } from './fixtures'

export interface CartLineSeed {
  nftId: string
  editionId: string
  quantity: number
}

// Fills the visitor's cart on the simulated server before the test looks at the page; what
// the test asserts still goes through the cart screen.
export async function seedGuestCart(page: Page, lines: CartLineSeed[]): Promise<void> {
  await gotoReady(page, '/')
  await page.evaluate(
    async ({ lines, key }) => {
      let guestCartId = window.localStorage.getItem(key)
      if (!guestCartId) {
        guestCartId = `guest-${crypto.randomUUID()}`
        window.localStorage.setItem(key, guestCartId)
      }
      for (const line of lines) {
        const response = await fetch('/api/v1/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Guest-Cart-Id': guestCartId },
          body: JSON.stringify(line),
        })
        if (!response.ok) throw new Error(`Seeding the cart failed with ${response.status}`)
      }
    },
    { lines, key: GUEST_CART_ID_KEY },
  )
}

export class CartPage {
  constructor(readonly page: Page) {}

  get lines(): Locator {
    return this.page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')
  }

  line(title: string, edition: string): Locator {
    return this.lines
      .filter({ has: this.page.getByRole('heading', { name: title }) })
      .filter({ hasText: `Edição: ${edition}` })
  }

  quantityOf(line: Locator): Locator {
    return line.getByRole('group', { name: /^Quantidade de / }).locator('[aria-live]')
  }

  get summary(): Locator {
    return this.page.getByRole('region', { name: 'Resumo da carteira' })
  }

  summaryValue(label: string): Locator {
    return this.summary
      .locator('dl > div')
      .filter({ has: this.page.locator('dt').getByText(label, { exact: true }) })
      .locator('dd')
  }

  get checkout(): Locator {
    return this.page.getByRole('button', { name: 'Conectar e finalizar' })
  }

  get couponInput(): Locator {
    return this.page.getByLabel('Código promocional')
  }

  async open(): Promise<void> {
    await gotoReady(this.page, '/cart')
    await expect(this.page).toHaveTitle('Carrinho de NFTs | Kurio')
  }

  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code)
    await this.page.getByRole('button', { name: 'Aplicar' }).click()
  }
}
