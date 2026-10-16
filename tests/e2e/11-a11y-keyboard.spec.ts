import type { Locator, Page } from '@playwright/test'
import { expectNoHorizontalOverflow, expectNoSeriousViolations } from '../support/a11y'
import { CheckoutPage } from '../support/checkout'
import { expect, gotoReady, PASSWORD, signInThroughApi, test, USERS } from '../support/fixtures'
import { EMERALD } from '../support/nft-detail'

const FIFTY = { nftId: EMERALD.id, editionId: EMERALD.editions.fifty, quantity: 1 }

const PUBLIC_SCREENS = [
  { path: '/', heading: /./ },
  { path: `/nft/${EMERALD.id}`, heading: EMERALD.title },
  { path: '/cart', heading: /./ },
  { path: '/login', heading: /./ },
  { path: '/register', heading: /./ },
  { path: '/no-such-page', heading: /./ },
]

// Moves the focus with Tab only, the way a keyboard user reaches a control.
async function tabTo(page: Page, target: Locator, limit = 120): Promise<void> {
  for (let step = 0; step < limit; step += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((node) => node === document.activeElement)) return
  }
  throw new Error(`Tab never reached ${target.toString()}`)
}

const PRIVATE_SCREENS = ['/favorites', '/profile', '/wallets', '/orders/order-seed-marina-1']

test.describe('axe and reflow on every screen @responsive', () => {
  for (const screen of PUBLIC_SCREENS) {
    test(`visitor on ${screen.path}`, async ({ page }) => {
      await gotoReady(page, screen.path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(screen.heading)
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
      await expectNoSeriousViolations(page)
      await expectNoHorizontalOverflow(page)
    })
  }

  for (const path of PRIVATE_SCREENS) {
    test(`buyer on ${path}`, async ({ page }) => {
      await gotoReady(page, '/')
      await signInThroughApi(page, USERS.marina)
      // The receipt of a confirmed order opens by itself; the purchase test covers it.
      await page.evaluate(() => sessionStorage.setItem('receipt-shown:order-seed-marina-1', '1'))
      await gotoReady(page, path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
      await expectNoSeriousViolations(page)
      await expectNoHorizontalOverflow(page)
    })
  }

  test('buyer on /checkout', async ({ page }) => {
    await new CheckoutPage(page).openWithCart([FIFTY])
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await expectNoSeriousViolations(page)
    await expectNoHorizontalOverflow(page)
  })
})

test('nothing overflows at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  for (const { path } of PUBLIC_SCREENS) {
    await gotoReady(page, path)
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  }
  await signInThroughApi(page, USERS.marina)
  for (const path of PRIVATE_SCREENS) {
    await gotoReady(page, path)
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  }
})

test('the skip link moves the focus to the main content', async ({ page }) => {
  await gotoReady(page, `/nft/${EMERALD.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(EMERALD.title)
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})

test('a purchase runs from the catalog to the receipt with the keyboard alone', async ({
  page,
}) => {
  const checkout = new CheckoutPage(page)
  await gotoReady(page, `/nft/${EMERALD.id}?edition=${EMERALD.editions.fifty}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(EMERALD.title)
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024
  await tabTo(
    page,
    page.getByRole('button', { name: desktop ? 'COMPRAR' : 'Comprar NFT', exact: true }),
  )
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/cart$/)

  await tabTo(page, page.getByRole('button', { name: /finalizar/i }).first())
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/login/)
  await tabTo(page, page.getByLabel('E-mail', { exact: true }))
  await page.keyboard.type(USERS.marina)
  await tabTo(page, page.getByLabel('Senha', { exact: true }))
  await page.keyboard.type(PASSWORD)
  await page.keyboard.press('Enter')
  await page.waitForURL((url) => url.pathname === '/checkout')

  await tabTo(page, checkout.provider('MetaMask'))
  await page.keyboard.press('Enter')
  await expect(checkout.provider('MetaMask')).toContainText('Conectada')
  await tabTo(page, checkout.confirm)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(checkout.orderPath)

  // The receipt opens by itself with the focus inside, keeps it there and gives it back to
  // the button that reopens it.
  await expect(checkout.receipt).toBeVisible()
  await expect(checkout.receipt.locator(':focus')).toHaveCount(1)
  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press('Tab')
    await expect(checkout.receipt.locator(':focus')).toHaveCount(1)
  }
  await page.keyboard.press('Escape')
  await expect(checkout.receipt).toHaveCount(0)
  const reopen = page.getByRole('button', { name: 'Ver recibo' })
  await tabTo(page, reopen)
  await page.keyboard.press('Enter')
  await expect(checkout.receipt).toBeVisible()
  await expectNoSeriousViolations(page)
  await page.keyboard.press('Escape')
  await expect(reopen).toBeFocused()
})

test('the catalog controls keep the focus inside and return it to the trigger', async ({
  page,
}) => {
  await gotoReady(page, '/')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024
  const trigger = desktop
    ? page.getByRole('combobox', { name: 'Ordenar por:' })
    : page.getByRole('button', { name: 'Abrir filtros' })
  await tabTo(page, trigger)
  await page.keyboard.press('Enter')
  const popup = desktop ? page.getByRole('listbox') : page.getByRole('dialog')
  await expect(popup).toBeVisible()
  // Radix hides the page behind the open listbox from assistive technology and keeps the
  // focus in it, so axe would flag a background that nobody can reach; the listbox is scanned.
  await expectNoSeriousViolations(page, desktop ? '[role="listbox"]' : undefined)
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press(desktop ? 'ArrowDown' : 'Tab')
    await expect(popup.locator(':focus')).toHaveCount(1)
  }
  await page.keyboard.press('Escape')
  await expect(popup).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('a sign-up with errors links each message to its field and focuses the first', async ({
  page,
}) => {
  await gotoReady(page, '/register')
  const submit = page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).last()
  await tabTo(page, submit)
  await page.keyboard.press('Enter')

  const invalid = page.locator('[aria-invalid="true"]')
  await expect(invalid.first()).toBeFocused()
  const count = await invalid.count()
  expect(count).toBeGreaterThan(1)
  for (let index = 0; index < count; index += 1) {
    const field = invalid.nth(index)
    const describedBy = await field.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`[id="${describedBy}"]`)).not.toBeEmpty()
  }
  await expectNoSeriousViolations(page)
})
