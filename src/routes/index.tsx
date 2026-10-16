import { createFileRoute, Link, stripSearchParams } from '@tanstack/react-router'
import { CatalogSearchSchema, DEFAULT_CATALOG_SEARCH } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { RouteErrorBoundary } from '@/components/layout/route-error'

function HomePage() {
  return (
    <section className="space-y-4">
      <p className="text-sm font-medium tracking-[0.1em]">{copy.home.heroDesktop.eyebrow}</p>
      <h1 className="text-[28px] font-bold text-heading lg:text-[43px]/[70px]">
        {copy.home.heroDesktop.titleLine1} {copy.home.heroDesktop.titleLine2}
      </h1>
      <p className="max-w-[557px] text-sm/6 text-body">{copy.home.heroDesktop.description}</p>
      <div className="pt-4">
        <Button asChild size="hero">
          <Link to="/" hash="mercado">
            {copy.home.heroDesktop.cta}
          </Link>
        </Button>
      </div>
    </section>
  )
}

export const Route = createFileRoute('/')({
  validateSearch: CatalogSearchSchema,
  search: {
    middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)],
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
