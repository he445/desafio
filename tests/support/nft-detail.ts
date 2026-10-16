import { expect, type Locator, type Page } from '@playwright/test'
import { gotoReady } from './fixtures'

export const EMERALD = {
  id: 'emerald-ape-042',
  title: 'Emerald Ape #042',
  editions: {
    unique: 'emerald-ape-042-1-1',
    ten: 'emerald-ape-042-1-10',
    fifty: 'emerald-ape-042-1-50',
  },
} as const

// The detail page has a desktop column and a phone sheet with a fixed buy bar. This hides
// where each control lives, so a test reads as what a person does.
export class NftDetailPage {
  constructor(readonly page: Page) {}

  get isDesktop(): boolean {
    return (this.page.viewportSize()?.width ?? 0) >= 1024
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 })
  }

  get favorite(): Locator {
    return this.page.getByRole('button', { name: /^Favorit(ar|ado)\b/ })
  }

  get buy(): Locator {
    return this.page.getByRole('button', {
      name: this.isDesktop ? 'COMPRAR' : 'Comprar NFT',
      exact: true,
    })
  }

  get increase(): Locator {
    return this.page.getByRole('button', { name: 'Aumentar quantidade' })
  }

  get quantity(): Locator {
    return this.page.getByRole('group', { name: 'Quantidade' }).locator('[aria-live]')
  }

  edition(name: string): Locator {
    return this.page.getByRole('radio', { name: new RegExp(`^${name.replace('/', '\\/')}\\b`) })
  }

  price(amount: string): Locator {
    return this.page
      .locator('p')
      .filter({ hasText: new RegExp(`^${amount} ETH$`) })
      .first()
  }

  async open(path = `/nft/${EMERALD.id}`): Promise<void> {
    await gotoReady(this.page, path)
    await expect(this.heading).toHaveText(EMERALD.title)
  }
}
