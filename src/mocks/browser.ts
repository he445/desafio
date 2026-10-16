import { setupWorker } from 'msw/browser'

export const worker = setupWorker()

export async function startMocks(): Promise<void> {
  await worker.start({
    quiet: import.meta.env.PROD,
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/api/')) {
        print.error()
      }
    },
  })

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.mocks = 'ready'
  }
}
