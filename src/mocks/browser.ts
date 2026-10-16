import { setupWorker } from 'msw/browser'
import { createMockControl } from './control'
import { loadDb, resetDb, setActiveScenarioId } from './db/store'
import { handlers } from './handlers'
import { realtimeWsHandler } from './realtime/server'
import { resetNetworkState } from './scenarios'

export const worker = setupWorker(...handlers, realtimeWsHandler)

function applyBootUrlParams(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  const scenarioParam = url.searchParams.get('scenario')
  const resetParam = url.searchParams.get('reset')
  let mutatedUrl = false

  if (resetParam === '1') {
    resetNetworkState()
    resetDb(scenarioParam ?? undefined)
    url.searchParams.delete('reset')
    if (scenarioParam) {
      url.searchParams.delete('scenario')
    }
    mutatedUrl = true
  } else if (scenarioParam) {
    resetNetworkState()
    setActiveScenarioId(scenarioParam)
    const db = loadDb()
    if (scenarioParam === 'empty-catalog' || db.nfts.length === 0) {
      resetDb(scenarioParam)
    }
    url.searchParams.delete('scenario')
    mutatedUrl = true
  }

  if (mutatedUrl) {
    const nextUrl =
      url.pathname +
      (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') +
      url.hash
    window.history.replaceState(window.history.state, '', nextUrl)
  }
}

export async function startMocks(): Promise<void> {
  applyBootUrlParams()
  loadDb()

  await worker.start({
    quiet: true,
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/api/')) {
        print.error()
      }
    },
  })

  if (typeof window !== 'undefined') {
    window.__mock = createMockControl()
    document.documentElement.dataset.mocks = 'ready'
  }
}
