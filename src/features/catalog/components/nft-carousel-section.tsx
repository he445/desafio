import { useId, useState } from 'react'
import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { NftCard } from './nft-card'

const PER_PAGE = 5

export function NftCarouselSection({ title, items }: { title: string; items: Nft[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const titleId = useId()
  if (items.length === 0) return null

  return (
    <section aria-labelledby={titleId} className="mt-24">
      <h2 id={titleId} className="border-b border-line pb-3 text-[17px] font-bold text-highlight">
        {title}
      </h2>
      <Carousel
        setApi={setApi}
        opts={{ slidesToScroll: PER_PAGE }}
        aria-label={title}
        className="mt-8"
      >
        <CarouselContent className="-ml-[26px]">
          {items.map((item, position) => (
            <CarouselItem
              key={item.id}
              aria-label={copy.a11y.slideOf(position + 1, items.length)}
              className="basis-[245px] pl-[26px]"
            >
              <NftCard nft={item} variant="carousel" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {items.length > PER_PAGE && (
        <CarouselDots
          api={api}
          count={Math.ceil(items.length / PER_PAGE)}
          className="mt-8 gap-2"
          dotClassName="size-3"
        />
      )}
    </section>
  )
}
