import { useEffect, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const LONGEST_WAIT_MS = 3000

function whenIdle(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout: 1000 })
    else setTimeout(resolve, 0)
  })
}

function whenNothingFetching(queryClient: QueryClient): Promise<void> {
  return new Promise((resolve) => {
    if (queryClient.isFetching() === 0) return resolve()
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (queryClient.isFetching() > 0) return
      unsubscribe()
      resolve()
    })
  })
}

function whenPriorityImagesLoad(): Promise<void> {
  const pending = [...document.querySelectorAll<HTMLImageElement>('img[fetchpriority="high"]')]
  return Promise.all(
    pending
      .filter((image) => !image.complete)
      .map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', resolve, { once: true })
          }),
      ),
  ).then(() => undefined)
}

// True once the first screen is complete: its route resolved, no request of its queries in flight,
// its priority images loaded and the browser idle, or after 3 s at most. The realtime client and
// the scenario panel wait for it, so they do not compete with that screen for the network and the
// main thread.
export function useFirstScreenSettled(): boolean {
  const queryClient = useQueryClient()
  const routeResolved = useRouterState({ select: (state) => state.resolvedLocation !== undefined })
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!routeResolved || settled) return
    let cancelled = false
    const settle = () => {
      if (!cancelled) setSettled(true)
    }
    const fallback = setTimeout(settle, LONGEST_WAIT_MS)
    // The idle callback between the two waits lets React commit the data, and with it the images.
    void whenNothingFetching(queryClient)
      .then(whenIdle)
      .then(whenPriorityImagesLoad)
      .then(whenIdle)
      .then(settle)
    return () => {
      cancelled = true
      clearTimeout(fallback)
    }
  }, [routeResolved, settled, queryClient])

  return settled
}
