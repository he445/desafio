import type { Page } from '@playwright/test'

declare global {
  interface Window {
    __announcements?: string[]
  }
}

// Records every text the polite live region receives, so a test can count announcements
// instead of only reading the last one.
export async function recordAnnouncements(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const region = document.querySelector('[data-testid="live-announcer"]')
    if (!region) throw new Error('Live region not found')
    window.__announcements = []
    new MutationObserver(() => {
      const text = region.textContent?.trim()
      if (text) window.__announcements?.push(text)
    }).observe(region, { childList: true, characterData: true, subtree: true })
  })
  return () => page.evaluate(() => window.__announcements ?? [])
}
