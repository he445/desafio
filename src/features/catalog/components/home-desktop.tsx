import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { ActiveFilters } from './active-filters'
import { CatalogFilters } from './catalog-filters'
import { CatalogResults } from './catalog-results'
import { CatalogToolbar } from './catalog-toolbar'

export function HomeDesktop() {
  return (
    <div className="flex flex-col gap-24">
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

      <section
        id="mercado"
        aria-label={copy.nav.market}
        className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[310px_842px]"
      >
        <CatalogFilters />
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <CatalogToolbar />
            <ActiveFilters />
          </div>
          <CatalogResults />
        </div>
      </section>
    </div>
  )
}
