import { Link } from '@tanstack/react-router'
import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { displayEth } from '@/lib/format'

const CARD_IMAGE_SIZES = '(min-width: 1024px) 250px, 168px'

export function NftCard({ nft }: { nft: Nft }) {
  const [image] = nft.images
  const soldOut = nft.editions.every((edition) => edition.available === 0)

  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} preload="intent" className="block">
      <div className="relative flex h-[200px] items-center justify-center rounded-[20px] bg-card-m shadow-card-m lg:h-[300px] lg:rounded-none lg:bg-surface lg:bg-none lg:shadow-none">
        {image && (
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={CARD_IMAGE_SIZES}
            className="aspect-square w-[calc(100%-8px)] max-w-[168px] rounded-2xl object-cover lg:max-w-[250px] lg:rounded-media"
          />
        )}
        {nft.rare && (
          <span className="absolute top-4 left-0 flex h-8 w-[68px] items-center justify-center rounded-r-md bg-primary text-[13px] font-medium text-ink lg:hidden">
            {copy.home.filters.rareBadge}
          </span>
        )}
        {soldOut && (
          <span className="absolute bottom-3 left-3 rounded-btn bg-ink/80 px-2 py-1 text-xs font-bold text-foreground">
            {copy.detail.soldOut}
          </span>
        )}
      </div>
      <p className="mt-3 px-2 text-[15px] text-foreground lg:px-0 lg:text-base/4">{nft.title}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-3 px-2 text-base font-bold text-highlight lg:mt-3 lg:px-0 lg:text-lg/4">
        <span>{displayEth(nft.priceFrom)}</span>
        {nft.compareAtPrice && (
          <s className="font-normal text-muted-foreground">
            <span className="sr-only">{copy.catalog.previousPrice} </span>
            {displayEth(nft.compareAtPrice)}
          </s>
        )}
      </p>
    </Link>
  )
}
