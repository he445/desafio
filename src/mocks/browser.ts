import { setupWorker } from 'msw/browser'
import { applyScenario, createMockControl } from './control'
import { loadDb, resetDb } from './db/store'
import { handlers } from './handlers'
import { realtimeWsHandler } from './realtime/server'
import { resumeSettlements } from './realtime/settlements'
import { resetNetworkState } from './scenarios/network'
import { isScenarioId } from './scenarios/registry'

export const worker = setupWorker(...handlers, realtimeWsHandler)

function applyBootUrlParams(): void {
  const url = new URL(window.location.href)
  const scenario = url.searchParams.get('scenario')
  const reset = url.searchParams.get('reset') === '1'
  if (!reset && scenario === null) return

  const scenarioId = isScenarioId(scenario) ? scenario : undefined
  if (reset) {
    resetNetworkState()
    resetDb(scenarioId)
  } else if (scenarioId) {
    applyScenario(scenarioId)
  }

  url.searchParams.delete('scenario')
  url.searchParams.delete('reset')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export async function startMocks(): Promise<void> {
  applyBootUrlParams()
  loadDb()

  await worker.start({
    quiet: import.meta.env.PROD,
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })

  resumeSettlements()
  window.__mock = createMockControl()
  document.documentElement.dataset.mocks = 'ready'
}
