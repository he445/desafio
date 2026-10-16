import { copy } from '@/content/copy'
import { useCatalogSearch } from '../hooks/use-catalog-search'
import { ActiveFilters } from './active-filters'
import { CatalogResults } from './catalog-results'
import { CatalogTabs } from './catalog-tabs'
import { HeroMobile } from './hero-mobile'
import { MobileSearchBar } from './mobile-search-bar'

export function HomeMobile() {
  const search = useCatalogSearch()

  return (
    <div className="flex flex-col gap-4 pt-[max(24px,env(safe-area-inset-top))]">
      <MobileSearchBar />
      <HeroMobile />

      <section id="mercado" aria-label={copy.nav.market} className="flex flex-col gap-4">
        <CatalogTabs tab={search.tab} />
        <ActiveFilters />
        <CatalogResults />
      </section>
    </div>
  )
}
