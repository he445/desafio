import { CatalogPage, expectRequestToMatchUrl } from '../support/catalog'
import { expect, test } from '../support/fixtures'

const isNftList = (url: string) => new URL(url).pathname === '/api/v1/nfts'

test.describe('home catalog', () => {
  test('the search narrows the list, and the URL and the request carry the same term', async ({
    page,
  }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    const request = page.waitForRequest(
      (candidate) =>
        isNftList(candidate.url()) && new URL(candidate.url()).searchParams.get('q') === 'emerald',
    )
    await catalog.search('emerald')

    await expect(page).toHaveURL(/[?&]q=emerald(&|#|$)/)
    expectRequestToMatchUrl(page.url(), (await request).url())
    await expect(catalog.cards).toHaveCount(1)
    expect(await catalog.titles()).toEqual(['Emerald Ape #042'])
    await expect(page.getByRole('link', { name: /Busca: emerald/ })).toBeVisible()
  })

  test('filters combine with the ordering and the request mirrors the URL', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await catalog.applyFilters({ category: 'Música', network: 'Solana' })
    await expect(catalog.cards).toHaveCount(6)

    const request = page.waitForRequest(
      (candidate) =>
        isNftList(candidate.url()) &&
        new URL(candidate.url()).searchParams.get('sort') === 'price_asc',
    )
    await catalog.applyFilters({ sort: 'Menor preço' })

    await expect(page).toHaveURL(/category=musica/)
    await expect(page).toHaveURL(/network=solana/)
    await expect(page).toHaveURL(/sort=price_asc/)
    expectRequestToMatchUrl(page.url(), (await request).url())
    await expect
      .poll(() => catalog.titles())
      .toEqual([
        'Obsidian Nomad #277',
        'Prism Walker #340',
        'Golden Beat #207',
        'Veridian Key #403',
        'Gold Horizon #466',
        'Nebula Sigil #529',
      ])
  })

  test('the price filter writes only the limits that were moved', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await catalog.applyFilters({ price: { minPageUps: 2, maxPageDowns: 3 } })

    await expect(page).toHaveURL(/minPrice=0\.22/)
    await expect(page).toHaveURL(/maxPrice=12(&|#|$)/)
    await expect(page.getByTestId('live-announcer')).toHaveText('42 resultados')
  })

  test('pagination moves through the pages, and any other change returns to the first', async ({
    page,
  }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    expect(await catalog.titles()).toHaveLength(9)

    await catalog.goToPage(2)
    await expect(page).toHaveURL(/page=2/)
    await expect
      .poll(() => catalog.titles())
      .toEqual([
        'Crimson Ape #270',
        'Obsidian Nomad #277',
        'Velvet Baron #284',
        'Solar Pulse #291',
        'Jade Drift #298',
        'Amber Totem #305',
        'Cobalt Echo #312',
        'Lunar Relic #319',
        'Quartz Sentinel #326',
      ])

    await catalog.applyFilters({ category: 'Música' })
    await expect(page).not.toHaveURL(/page=/)
    await expect(catalog.cards).toHaveCount(7)
  })

  test('a page past the last one is replaced by the last page without a new history entry', async ({
    page,
  }) => {
    const catalog = new CatalogPage(page)
    await catalog.open('/?page=99')

    await expect(page).toHaveURL(/page=6/)
    await expect(catalog.cards).toHaveCount(3)
    await expect(page.getByText('Esgotada')).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL('about:blank')
  })

  test('back and forward restore the earlier views', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await catalog.applyFilters({ category: 'Jogos' })
    await expect(catalog.cards).toHaveCount(5)
    await catalog.chooseTab('Em alta')
    await expect(page).toHaveURL(/tab=trending/)
    await expect(catalog.cards).toHaveCount(2)

    await page.goBack()
    await expect(page).toHaveURL(/category=jogos/)
    await expect(page).not.toHaveURL(/tab=/)
    await expect(catalog.cards).toHaveCount(5)

    await page.goBack()
    await expect(page).not.toHaveURL(/category=/)
    await expect(catalog.cards).toHaveCount(9)

    await page.goForward()
    await page.goForward()
    await expect(page).toHaveURL(/tab=trending/)
    await expect(catalog.cards).toHaveCount(2)
  })

  test('an answer that arrives late does not replace the newer view', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    const gate = await mock.hold({ method: 'GET', path: '/nfts', query: { category: 'musica' } })
    const held = page.waitForRequest(
      (candidate) =>
        isNftList(candidate.url()) &&
        new URL(candidate.url()).searchParams.get('category') === 'musica',
    )
    await catalog.applyFilters({ category: 'Música' })
    const heldRequest = await held
    // While the answer is held the previous list stays on screen and is marked as busy.
    await expect(page.locator('[aria-busy="true"]')).toBeVisible()
    await expect(catalog.cards).toHaveCount(9)

    await catalog.applyFilters({ category: 'Jogos' })
    await expect(catalog.cards).toHaveCount(5)

    await mock.release(gate)
    await heldRequest.response()
    // The overtaken request was cancelled by the client, not left to answer later.
    expect(heldRequest.failure()?.errorText).toBe('net::ERR_ABORTED')

    await expect(catalog.cards).toHaveCount(5)
    await expect(page).toHaveURL(/category=jogos/)
    expect(await catalog.titles()).toContain('Golden Signal #160')
    expect(await catalog.titles()).not.toContain('Golden Beat #207')
  })

  test('a search without results offers to clear the filters', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await catalog.search('sem-resultado')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()

    await page.getByRole('link', { name: 'Limpar filtros' }).click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(catalog.cards).toHaveCount(9)
  })

  test('the number of results is announced after a change, not on the first load', async ({
    page,
  }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await expect(page.getByTestId('live-announcer')).toHaveText('')

    await catalog.applyFilters({ category: 'Música' })
    await expect(page.getByTestId('live-announcer')).toHaveText('7 resultados')
  })

  test('the first picture of the page loads first and the carousel dots switch the slide', async ({
    page,
  }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    const priority = page.locator('img[fetchpriority="high"]')
    await expect(priority).toHaveCount(1)
    await expect(priority).toHaveAttribute('loading', 'eager')

    const dots = page.getByRole('button', { name: /^Página \d de 3$/ })
    await expect(dots).toHaveCount(3)
    await expect(dots.first()).toHaveAttribute('aria-current', 'true')
    await dots.nth(1).click()
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
  })

  test('the central button of the tab bar focuses the search field', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The tab bar only exists in the phone layout.')
    const catalog = new CatalogPage(page)
    await catalog.open()

    await page.getByRole('navigation', { name: 'Navegação inferior' }).getByRole('button').click()
    await expect(page.getByRole('searchbox', { name: 'Explorar coleções' })).toBeFocused()
  })

  test('the header search opens with the term the URL already searches for', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The header only exists in the desktop layout.')
    const catalog = new CatalogPage(page)
    await catalog.open('/?q=emerald')

    await page.getByRole('button', { name: 'Explorar coleções' }).click()
    await expect(page.getByRole('searchbox', { name: 'Explorar coleções' })).toHaveValue('emerald')
  })
})
