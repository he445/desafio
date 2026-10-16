import { expect, type Locator, type Page } from '@playwright/test'
import { seedGuestCart, type CartLineSeed } from './cart'
import { loginAs, type USERS } from './fixtures'

export class CheckoutPage {
  constructor(readonly page: Page) {}

  // A visitor fills the cart, signs in from the login page and lands on the checkout, so the
  // cart merge and the guarded route run as they do for a buyer.
  async openWithCart(lines: CartLineSeed[], user: keyof typeof USERS = 'marina'): Promise<void> {
    await seedGuestCart(this.page, lines)
    await loginAs(this.page, user, '/login?redirect=/checkout')
    await expect(this.page).toHaveURL(/\/checkout$/)
    await expect(this.page).toHaveTitle('Pagamento | Kurio')
  }

  get providers(): Locator {
    return this.page.getByRole('list', { name: 'Carteira e rede' })
  }

  provider(name: string): Locator {
    return this.providers.getByRole('button', { name: new RegExp(`^${name}`) })
  }

  get confirm(): Locator {
    return this.page.getByRole('button', { name: 'Confirmar compra' })
  }

  get review(): Locator {
    return this.page.getByRole('region', { name: 'Os valores mudaram desde a sua revisão.' })
  }

  async connect(name: string): Promise<void> {
    await this.provider(name).click()
    await expect(this.provider(name)).toContainText('Conectada')
  }
}
