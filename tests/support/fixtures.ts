import { test as base, expect, type Page } from '@playwright/test'
import type { MockControl } from '../../src/mocks/control'
import type { NetworkRule } from '../../src/mocks/scenarios/network'
import { SCENARIO_STORAGE_KEY, type ScenarioId } from '../../src/mocks/scenarios/registry'
import { SESSION_STORAGE_KEY } from '../../src/lib/storage'

export { expect }

export const PASSWORD = 'Senha@1234'

// A typed driver over window.__mock: the only way a test changes what the simulated server does.
class MockDriver {
  constructor(private readonly page: Page) {}

  private async ready(): Promise<void> {
    await expect(this.page.locator('html')).toHaveAttribute('data-mocks', 'ready')
  }

  async setRules(rules: NetworkRule[]): Promise<void> {
    await this.ready()
    await this.page.evaluate((next) => window.__mock?.setRules(next), rules)
  }

  async clearRules(): Promise<void> {
    await this.ready()
    await this.page.evaluate(() => window.__mock?.clearRules())
  }

  // Holds the next request that matches until release() is called with the returned gate.
  async hold(match: NetworkRule['match']): Promise<string> {
    await this.ready()
    const gate = await this.page.evaluate((next) => window.__mock?.hold(next), match)
    if (!gate) throw new Error('window.__mock is not available')
    return gate
  }

  async release(gate: string): Promise<void> {
    await this.page.evaluate((id) => window.__mock?.release(id), gate)
  }

  // Changes price or stock on the server, as another buyer or the seller would.
  async changeEdition(change: {
    nftId: string
    editionId: string
    price?: string
    available?: number
  }): Promise<void> {
    await this.ready()
    await this.page.evaluate((next) => window.__mock?.changeEdition(next), change)
  }

  // Events emitted before the page connects are lost, so a test waits for the socket of the
  // expected user (null for a visitor) before it changes anything on the server.
  async waitForSocket(userId: string | null = null): Promise<void> {
    await this.ready()
    await expect
      .poll(() => this.page.evaluate(() => window.__mock?.listSockets() ?? []))
      .toContain(userId)
  }

  // Sends an event exactly as given, to exercise duplicates and stale versions.
  async emitRaw(event: Parameters<MockControl['emitRaw']>[0]): Promise<void> {
    await this.ready()
    await this.page.evaluate((next) => window.__mock?.emitRaw(next), event)
  }

  async dropSockets(refuseForMs: number): Promise<void> {
    await this.ready()
    await this.page.evaluate((ms) => window.__mock?.dropSockets({ refuseForMs: ms }), refuseForMs)
  }

  // Orders the user created during the test; the seeded history is left out.
  async countOrders(userId: string): Promise<number> {
    await this.ready()
    return this.page.evaluate((id) => window.__mock?.countOrders(id) ?? 0, userId)
  }

  // Every open session reaches its expiry now; the next private request answers 401.
  async expireSession(): Promise<void> {
    await this.ready()
    await this.page.evaluate(() => window.__mock?.expireSession())
  }
}

interface Fixtures {
  scenario: ScenarioId
  mock: MockDriver
}

export const test = base.extend<Fixtures>({
  // Applied before the first load, together with the hidden scenario panel. A scenario the
  // test changes later with window.__mock is not overwritten by the next page load.
  scenario: ['default', { option: true }],
  page: async ({ page, scenario }, use) => {
    await page.addInitScript(
      ({ id, key }) => {
        window.__hideScenarioPanel = true
        if (id !== 'default' && window.localStorage.getItem(key) === null) {
          window.localStorage.setItem(key, id)
        }
      },
      { id: scenario, key: SCENARIO_STORAGE_KEY },
    )
    await use(page)
  },
  mock: async ({ page }, use) => {
    await use(new MockDriver(page))
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

export const USERS = {
  marina: 'marina@nftmarket.test',
  rafael: 'rafael@nftmarket.test',
} as const

// Signs in through the form, so the whole session flow runs: the login request, the cart
// merge and the redirect.
export async function loginAs(
  page: Page,
  user: keyof typeof USERS,
  path = '/login',
): Promise<void> {
  if (!new URL(page.url(), 'http://localhost').pathname.startsWith('/login')) {
    await gotoReady(page, path)
  }
  await page.getByLabel('E-mail', { exact: true }).fill(USERS[user])
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
}
