import { Link } from '@tanstack/react-router'
import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { displayEth } from '@/lib/format'
import { cn } from '@/lib/utils'

const CARD_IMAGE_SIZES = '(min-width: 1024px) 250px, 168px'

// `grid` is the catalog card (phone and desktop); `carousel` is the 219 px card of the
// desktop carousels.
export function NftCard({
  nft,
  variant = 'grid',
  priority = false,
}: {
  nft: Nft
  variant?: 'grid' | 'carousel'
  priority?: boolean
}) {
  const [image] = nft.images
  const soldOut = nft.editions.every((edition) => edition.available === 0)
  const carousel = variant === 'carousel'

  return (
    <div className="relative">
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} preload="intent" className="block">
        <div
          className={cn(
            'relative flex items-center justify-center',
            carousel
              ? 'h-[255px] bg-surface'
              : 'h-[200px] rounded-[20px] bg-card-m shadow-card-m lg:h-[300px] lg:rounded-none lg:bg-surface lg:bg-none lg:shadow-none',
          )}
        >
          {image && (
            <ResponsiveImage
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes={carousel ? '212px' : CARD_IMAGE_SIZES}
              priority={priority}
              className={cn(
                'aspect-square object-cover',
                carousel
                  ? 'w-[212px] max-w-[calc(100%-8px)] rounded-thumb'
                  : 'w-[calc(100%-8px)] max-w-[168px] rounded-2xl lg:max-w-[250px] lg:rounded-media',
              )}
            />
          )}
          {nft.rare && !carousel && (
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
        <p
          className={cn(
            'mt-3 text-[15px] text-foreground',
            !carousel && 'px-2 lg:px-0 lg:text-base/4',
          )}
        >
          {nft.title}
        </p>
        <p
          className={cn(
            'flex flex-wrap items-baseline gap-x-3 text-base font-bold text-highlight',
            carousel ? 'mt-2' : 'mt-2 px-2 lg:mt-3 lg:px-0 lg:text-lg/4',
          )}
        >
          <span>{displayEth(nft.priceFrom)}</span>
          {nft.compareAtPrice && (
            <s className="font-normal text-muted-foreground">
              <span className="sr-only">{copy.catalog.previousPrice} </span>
              {displayEth(nft.compareAtPrice)}
            </s>
          )}
        </p>
      </Link>
      {!carousel && (
        <FavoriteButton
          nft={nft}
          variant="card"
          className="absolute top-3 right-[11px] lg:hidden"
        />
      )}
    </div>
  )
}
