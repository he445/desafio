import { useState } from 'react'
import { copy } from '@/content/copy'
import { ArrowRightIcon } from '@/components/icons'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  useCarouselIndex,
  type CarouselApi,
} from '@/components/ui/carousel'
import { NavLink } from '@/components/ui/nav-link'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedQuery } from '../queries'
import { FeaturedSlide } from './featured-slide'

const hero = copy.home.heroMobile

// The banner of the phone layout: the big picture is the current slide, the small one is
// the next.
export function HeroMobile() {
  const { data, isPending } = useFeaturedQuery()
  const slides = data?.items.slice(0, 3) ?? []
  const [api, setApi] = useState<CarouselApi>()
  const current = useCarouselIndex(api)
  const next = slides.length > 1 ? slides[(current + 1) % slides.length] : undefined
  const nextImage = next?.images[0]

  return (
    <div className="relative min-h-[190px] overflow-hidden rounded-xl bg-surface pb-7">
      <span
        aria-hidden="true"
        className="absolute -top-[31px] -left-20 size-[248px] rounded-full bg-orb"
      />
      <span
        aria-hidden="true"
        className="absolute -top-[10px] left-[73px] size-[248px] rounded-full bg-orb"
      />

      <div className="relative flex gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">{hero.eyebrow}</p>
          <h1 className="mt-[6px] text-lg/[29px] font-bold text-heading">
            <span className="block">{hero.titleLine1}</span>{' '}
            <span className="block">{hero.titleLine2}</span>
          </h1>
          <p className="mt-[6px] text-xs/[18px] text-body">{hero.description}</p>
          <NavLink
            from="/"
            to="/"
            search={(prev) => prev}
            hash="mercado"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-highlight"
          >
            {hero.cta}
            <ArrowRightIcon size={16} />
          </NavLink>
        </div>

        <div className="relative size-[138px] max-w-[38%] shrink-0">
          {isPending && <Skeleton className="size-[138px] rounded-2xl" />}
          {slides.length > 0 && (
            <Carousel setApi={setApi} aria-label={copy.catalog.heroLabel} className="size-full">
              <CarouselContent>
                {slides.map((nft, position) => (
                  <FeaturedSlide
                    key={nft.id}
                    nft={nft}
                    position={position}
                    total={slides.length}
                    active={position === current}
                    sizes="138px"
                    imageClassName="aspect-square w-full rounded-2xl object-cover"
                  />
                ))}
              </CarouselContent>
            </Carousel>
          )}
          {nextImage && (
            <ResponsiveImage
              src={nextImage.src}
              alt=""
              width={nextImage.width}
              height={nextImage.height}
              sizes="58px"
              className="pointer-events-none absolute top-[88px] left-[14px] size-[58px] rounded-xl object-cover"
            />
          )}
        </div>
      </div>

      <CarouselDots
        api={api}
        count={slides.length}
        dotClassName="size-[7px]"
        className="absolute inset-x-0 bottom-[3px] gap-0"
      />
    </div>
  )
}
