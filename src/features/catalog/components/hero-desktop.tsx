import { useState } from 'react'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  useCarouselIndex,
  type CarouselApi,
} from '@/components/ui/carousel'
import { NavLink } from '@/components/ui/nav-link'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedQuery } from '../queries'
import { FeaturedSlide } from './featured-slide'

const hero = copy.home.heroDesktop

// The text is fixed; the carousel swaps the picture among the first three featured NFTs.
export function HeroDesktop() {
  const { data, isPending } = useFeaturedQuery()
  const slides = data?.items.slice(0, 3) ?? []
  const [api, setApi] = useState<CarouselApi>()
  const current = useCarouselIndex(api)

  return (
    <div className="relative flex h-[450px] justify-between pl-10">
      <div className="max-w-[600px] flex-1 pt-[43px]">
        <p className="text-sm font-medium tracking-[0.1em] text-foreground">{hero.eyebrow}</p>
        <h1 className="mt-2 text-[43px]/[70px] font-bold text-heading">
          <span className="block">{hero.titleLine1}</span>{' '}
          <span className="block">{hero.titleLine2}</span>
        </h1>
        <p className="mt-1 max-w-[557px] text-sm/6 text-body">{hero.description}</p>
        <Button asChild size="hero" className="mt-8 text-base">
          <NavLink from="/" to="/" search={(prev) => prev} hash="mercado">
            {hero.cta}
          </NavLink>
        </Button>
      </div>

      <div className="size-[450px] shrink-0">
        {isPending && <Skeleton className="size-[450px] rounded-hero" />}
        {!isPending && slides.length === 0 && (
          <div aria-hidden="true" className="size-[450px] rounded-hero bg-surface" />
        )}
        {slides.length > 0 && (
          <Carousel setApi={setApi} aria-label={copy.catalog.heroLabel}>
            <CarouselContent>
              {slides.map((nft, position) => (
                <FeaturedSlide
                  key={nft.id}
                  nft={nft}
                  position={position}
                  total={slides.length}
                  active={position === current}
                  sizes="450px"
                  imageClassName="size-[450px] rounded-hero object-cover"
                />
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>

      <CarouselDots api={api} count={slides.length} className="absolute inset-x-0 bottom-[43px]" />
    </div>
  )
}
