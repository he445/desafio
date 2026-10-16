import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DEFAULT_CATALOG_SEARCH, type Nft } from '@/contracts'
import { copy } from '@/content/copy'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { NftCard } from '@/features/catalog/components/nft-card'
import { nftListQueryOptions } from '@/features/catalog/queries'

const PER_PAGE = 5

export function RelatedNfts({ nft }: { nft: Nft }) {
  const [api, setApi] = useState<CarouselApi>()
  const { data } = useQuery(
    nftListQueryOptions({ ...DEFAULT_CATALOG_SEARCH, collection: nft.collection.id, pageSize: 15 }),
  )
  const items = data?.items.filter((item) => item.id !== nft.id) ?? []
  if (items.length === 0) return null

  return (
    <section aria-labelledby="related-title" className="mt-24">
      <h2
        id="related-title"
        className="border-b border-line pb-3 text-[17px] font-bold text-highlight"
      >
        {copy.detail.moreFromCollection}
      </h2>
      <Carousel
        setApi={setApi}
        opts={{ slidesToScroll: PER_PAGE }}
        aria-label={copy.detail.moreFromCollection}
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
