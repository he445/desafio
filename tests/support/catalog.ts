import { expect, type Locator, type Page } from '@playwright/test'
import { gotoReady } from './fixtures'

export interface Filters {
  category?: string
  network?: string
  sort?: string
  // Presses on the Page Up and Page Down keys of the slider thumbs (10 steps of 0.01 ETH each).
  price?: { minPageUps?: number; maxPageDowns?: number }
}

// The home page has two compositions (a sidebar on desktop, a sheet on phones). This hides the
// difference, so a test says what a person does and not where the control lives.
export class CatalogPage {
  constructor(readonly page: Page) {}

  get isDesktop(): boolean {
    return (this.page.viewportSize()?.width ?? 0) >= 1024
  }

  get cards(): Locator {
    return this.page.getByRole('list', { name: 'NFTs do catálogo' }).getByRole('listitem')
  }

  async titles(): Promise<string[]> {
    const names = await this.cards.locator('a > p:first-of-type').allTextContents()
    return names.map((name) => name.trim())
  }

  async open(path = '/'): Promise<void> {
    await gotoReady(this.page, path)
    await expect(this.cards.first()).toBeVisible()
  }

  async search(term: string): Promise<void> {
    if (this.isDesktop) {
      await this.page.getByRole('button', { name: 'Explorar coleções' }).click()
      const box = this.page.getByRole('searchbox', { name: 'Explorar coleções' })
      await box.fill(term)
      await box.press('Enter')
    } else {
      // The phone field writes to the URL after a pause in the typing.
      await this.page.getByRole('searchbox', { name: 'Explorar coleções' }).fill(term)
    }
  }

  async applyFilters({ category, network, sort, price }: Filters): Promise<void> {
    const { page } = this
    if (this.isDesktop) {
      const sidebar = page.getByRole('complementary', { name: 'Filtros' })
      if (category) await sidebar.getByRole('link', { name: new RegExp(`^${category}`) }).click()
      if (network) await sidebar.getByRole('link', { name: new RegExp(`^${network}`) }).click()
      if (sort) await this.chooseSort(sort)
      if (price) {
        await this.movePrice(sidebar, price)
        await sidebar.getByRole('button', { name: 'Aplicar' }).click()
      }
      return
    }

    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    if (sort) await this.chooseSort(sort, sheet)
    if (category) await sheet.getByRole('button', { name: new RegExp(`^${category}`) }).click()
    if (network) await sheet.getByRole('button', { name: new RegExp(`^${network}`) }).click()
    if (price) await this.movePrice(sheet, price)
    await sheet.getByRole('button', { name: 'Aplicar' }).click()
    await expect(sheet).toBeHidden()
  }

  private async chooseSort(label: string, within: Page | Locator = this.page): Promise<void> {
    await within.getByRole('combobox', { name: /Ordenar por/ }).click()
    await this.page.getByRole('option', { name: label }).click()
  }

  private async movePrice(
    within: Locator,
    { minPageUps = 0, maxPageDowns = 0 }: NonNullable<Filters['price']>,
  ): Promise<void> {
    const min = within.getByRole('slider', { name: 'Preço mínimo' })
    const max = within.getByRole('slider', { name: 'Preço máximo' })
    await min.focus()
    for (let press = 0; press < minPageUps; press += 1) await min.press('PageUp')
    await max.focus()
    for (let press = 0; press < maxPageDowns; press += 1) await max.press('PageDown')
  }

  async chooseTab(name: string): Promise<void> {
    await this.page
      .getByRole('navigation', { name: 'Abas do catálogo' })
      .getByRole('link', { name })
      .click()
  }

  async goToPage(number: number): Promise<void> {
    await this.page
      .getByRole('navigation', { name: 'Paginação' })
      .getByRole('link', { name: `Página ${number}` })
      .click()
  }
}

// The request the app made for the current view must carry what the URL says; every other
// parameter has to be a default.
const DEFAULTS: Record<string, string> = {
  tab: 'all',
  status: 'all',
  sort: 'recent',
  page: '1',
  pageSize: '9',
}

export function expectRequestToMatchUrl(pageUrl: string, requestUrl: string): void {
  const fromPage = new URL(pageUrl).searchParams
  const fromRequest = new URL(requestUrl).searchParams
  for (const [key, value] of fromPage) expect(fromRequest.get(key), key).toBe(value)
  for (const [key, value] of fromRequest) {
    if (!fromPage.has(key)) expect(value, key).toBe(DEFAULTS[key])
  }
}
