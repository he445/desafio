import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogSearchSchema, DEFAULT_CATALOG_SEARCH } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { CatalogResults } from '@/features/catalog/components/catalog-results'
import { nftListQueryOptions } from '@/features/catalog/queries'

function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm font-medium tracking-[0.1em]">{copy.home.heroDesktop.eyebrow}</p>
        <h1 className="text-[28px] font-bold text-heading lg:text-[43px]/[70px]">
          {copy.home.heroDesktop.titleLine1} {copy.home.heroDesktop.titleLine2}
        </h1>
        <p className="max-w-[557px] text-sm/6 text-body">{copy.home.heroDesktop.description}</p>
        <div className="pt-4">
          <Button asChild size="hero">
            <NavLink to="/" hash="mercado">
              {copy.home.heroDesktop.cta}
            </NavLink>
          </Button>
        </div>
      </section>

      <section id="mercado" aria-label={copy.nav.market}>
        <CatalogResults />
      </section>
    </div>
  )
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
