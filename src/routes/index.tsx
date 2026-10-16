import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogSearchSchema, DEFAULT_CATALOG_SEARCH } from '@/contracts'
import { copy } from '@/content/copy'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { HomeDesktop } from '@/features/catalog/components/home-desktop'
import { nftListQueryOptions } from '@/features/catalog/queries'

function HomePage() {
  return <HomeDesktop />
}

export const Route = createFileRoute('/')({
  validateSearch: CatalogSearchSchema,
  search: {
    middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)],
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    // Not awaited: the page renders its skeletons at once and fills in as the data arrives.
    void context.queryClient.prefetchQuery(nftListQueryOptions(deps.search))
  },
  head: () => ({
    meta: [
      { title: copy.meta.pageTitle(copy.nav.home) },
      { name: 'description', content: copy.meta.description },
    ],
  }),
  component: HomePage,
  errorComponent: RouteErrorBoundary,
})
