import { startTransition, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { cn } from '@/lib/utils'
import { AppProviders } from './providers'
import { router } from './router'

// tailwind-merge builds its class map on its first call. main.tsx runs this while the worker starts,
// so that work does not land in the first render.
export function prepareRender(): void {
  cn('p-0')
}

export async function renderApp(container: HTMLElement): Promise<void> {
  // The first route usually resolves within the router's pending delay. Rendering after it builds
  // that route inside the transition below, in slices, and not in the synchronous update the
  // router's store sends once the route is ready. A slower route renders on time with its pending
  // component, and a failed load is left to the router, which loads again on mount.
  await Promise.race([
    router.load().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, router.options.defaultPendingMs)),
  ])
  const root = createRoot(container)
  // As a transition, the first render gives the main thread back every few milliseconds instead of
  // holding it until the whole tree is built.
  startTransition(() => {
    root.render(
      <StrictMode>
        <AppProviders />
      </StrictMode>,
    )
  })
}
