import type { Page } from '@playwright/test'
import { recordAnnouncements } from '../support/announcements'
import { expect, loginAs, test } from '../support/fixtures'
import { EMERALD, NftDetailPage } from '../support/nft-detail'

const FIFTY = { nftId: EMERALD.id, editionId: EMERALD.editions.fifty }
const FIFTY_DETAIL = `/nft/${EMERALD.id}?edition=${EMERALD.editions.fifty}`

async function serverVersion(page: Page): Promise<number> {
  return page.evaluate(async (id) => {
    const response = await fetch(`/api/v1/nfts/${id}`)
    return ((await response.json()) as { version: number }).version
  }, EMERALD.id)
}

test.describe('duplicate and out-of-order events', () => {
  test.use({ scenario: 'duplicate-events' })

  test('a repeated or older event neither regresses the price nor announces twice', async ({
    page,
    mock,
  }) => {
    const detail = new NftDetailPage(page)
    await detail.open(FIFTY_DETAIL)
    await mock.waitForSocket()
    const announcements = await recordAnnouncements(page)

    // The scenario sends every event twice and then a copy with the previous version.
    await mock.changeEdition({ ...FIFTY, price: '1.35' })
    await expect(detail.price('1.35')).toBeVisible()

    const current = await serverVersion(page)
    await mock.emitRaw({
      eventId: crypto.randomUUID(),
      type: 'nft.updated',
      resource: { kind: 'nft', id: EMERALD.id },
      version: current - 1,
      occurredAt: new Date().toISOString(),
      data: {
        editions: [{ id: EMERALD.editions.fifty, price: '0.5', available: 12 }],
        priceFrom: '0.5',
      },
    })

    await expect
      .poll(announcements)
      .toEqual(['O preço de Emerald Ape #042 (1/50) mudou para 1.35 ETH'])
    await page.waitForTimeout(500)
    expect(await announcements()).toHaveLength(1)
    await expect(detail.price('1.35')).toBeVisible()
    await expect(detail.price('0.50')).toHaveCount(0)
  })
})

test('navigating away and back keeps a single listener per event', async ({ page, mock }) => {
  const detail = new NftDetailPage(page)
  await detail.open(FIFTY_DETAIL)
  const leave = detail.isDesktop
    ? page.getByRole('link', { name: 'Início', exact: true }).first()
    : page.getByRole('button', { name: 'Voltar' })
  await leave.click()
  await expect(page).toHaveURL(/\/(#mercado)?$/)
  await page.goBack()
  await expect(detail.heading).toHaveText(EMERALD.title)
  await mock.waitForSocket()
  const announcements = await recordAnnouncements(page)

  await mock.changeEdition({ ...FIFTY, price: '1.35' })

  await expect.poll(announcements).toHaveLength(1)
  await page.waitForTimeout(500)
  expect(await announcements()).toHaveLength(1)
})

test('a change made while the socket is down shows up after it reconnects', async ({
  page,
  mock,
}) => {
  const detail = new NftDetailPage(page)
  await detail.open(FIFTY_DETAIL)
  await mock.waitForSocket()
  const reconnecting = page.getByText('Reconectando…')

  await mock.dropSockets(3500)
  await mock.changeEdition({ ...FIFTY, price: '1.35' })

  await expect(reconnecting).toBeVisible()
  await expect(detail.price('1.19')).toBeVisible()
  await expect(detail.price('1.35')).toBeVisible({ timeout: 15_000 })
  await expect(reconnecting).toBeHidden()
})

test('the socket follows the session: authenticated after login, anonymous after logout', async ({
  page,
  mock,
  isMobile,
}) => {
  test.skip(isMobile, 'The sign out button lives in the desktop account sidebar.')
  await loginAs(page, 'marina', '/login?redirect=/favorites')
  await mock.waitForSocket('user-marina')

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await mock.waitForSocket(null)
  expect(await page.evaluate(() => window.__mock?.listSockets())).not.toContain('user-marina')
})
