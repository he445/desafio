import { createRouter, stringifySearchWith } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import { queryClient } from './query-client'

// The default serializer quotes numeric strings (minPrice=%220.5%22) so they parse back as
// strings. The search schemas already coerce numbers, so only non-numeric JSON gets quoted.
function parseQuotableJson(value: string): unknown {
  const parsed: unknown = JSON.parse(value)
  if (typeof parsed === 'number') throw new TypeError('numbers are written as is')
  return parsed
}

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  stringifySearch: stringifySearchWith(JSON.stringify, parseQuotableJson),
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultPendingMs: 200,
  defaultPendingMinMs: 400,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
