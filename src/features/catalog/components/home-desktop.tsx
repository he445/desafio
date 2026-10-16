import { copy } from '@/content/copy'
import { ActiveFilters } from './active-filters'
import { BlogSection } from './blog-section'
import { CatalogFilters } from './catalog-filters'
import { CatalogResults } from './catalog-results'
import { CatalogToolbar } from './catalog-toolbar'
import { FeaturedBanner } from './featured-banner'
import { HeroDesktop } from './hero-desktop'
import { PromoCards } from './promo-cards'

export function HomeDesktop() {
  return (
    <div className="flex flex-col gap-24">
      <HeroDesktop />

      <section
        id="mercado"
        aria-label={copy.nav.market}
        className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-12 xl:grid-cols-[310px_842px]"
      >
        <div className="flex flex-col gap-6">
          <CatalogFilters />
          <FeaturedBanner />
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <CatalogToolbar />
            <ActiveFilters />
          </div>
          <CatalogResults />
        </div>
      </section>

      <PromoCards />
      <BlogSection />
    </div>
  )
}
