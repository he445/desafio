import { test as base, expect, type Page } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../../src/lib/storage'

export { expect }

export const PASSWORD = 'Senha@1234'

// The scenario panel floats over the page and is not part of the product under test.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.__hideScenarioPanel = true
    })
    await use(page)
  },
})

export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await expect(page.locator('html')).toHaveAttribute('data-mocks', 'ready')
}

// For tests about routing rather than the login form: the session comes straight from the API
// and is stored where the app reads it.
export async function signInThroughApi(page: Page, email: string): Promise<void> {
  await page.evaluate(
    async ({ email, password, storageKey }) => {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) throw new Error(`Login failed with ${response.status}`)
      const auth = (await response.json()) as { session: unknown }
      window.localStorage.setItem(storageKey, JSON.stringify(auth.session))
    },
    { email, password: PASSWORD, storageKey: SESSION_STORAGE_KEY },
  )
}
