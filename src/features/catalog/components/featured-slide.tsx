import { Link } from '@tanstack/react-router'
import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { CarouselItem } from '@/components/ui/carousel'
import { ResponsiveImage } from '@/components/ui/responsive-image'

interface FeaturedSlideProps {
  nft: Nft
  position: number
  total: number
  active: boolean
  sizes: string
  imageClassName: string
}

// One picture of the home carousel. A slide that is not showing stays out of the reading and
// tab order, and only the first picture of the page is loaded with priority.
export function FeaturedSlide({
  nft,
  position,
  total,
  active,
  sizes,
  imageClassName,
}: FeaturedSlideProps) {
  const [image] = nft.images

  return (
    <CarouselItem
      aria-label={copy.a11y.slideOf(position + 1, total)}
      aria-hidden={active ? undefined : true}
    >
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        preload="intent"
        tabIndex={active ? undefined : -1}
        className="block"
      >
        {image && (
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={sizes}
            priority={position === 0}
            className={imageClassName}
          />
        )}
      </Link>
    </CarouselItem>
  )
}
