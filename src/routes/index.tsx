import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogSearchSchema, DEFAULT_CATALOG_SEARCH } from '@/contracts'
import { copy } from '@/content/copy'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { HomeDesktop } from '@/features/catalog/components/home-desktop'
import { HomeMobile } from '@/features/catalog/components/home-mobile'
import { featuredQueryOptions, nftListQueryOptions } from '@/features/catalog/queries'
import { useIsDesktop } from '@/lib/use-media-query'

function HomePage() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <HomeDesktop /> : <HomeMobile />
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
    void context.queryClient.prefetchQuery(featuredQueryOptions())
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
