import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Serious and critical violations fail the test; moderate and minor ones do not. `include`
// narrows the scan to an open popup whose background is aria-hidden on purpose.
export async function expectNoSeriousViolations(page: Page, include?: string): Promise<void> {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  if (include) builder.include(include)
  const { violations } = await builder.analyze()
  const blocking = violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
    }))
  expect(blocking).toEqual([])
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}
