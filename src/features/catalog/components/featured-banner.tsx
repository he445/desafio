import { Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedQuery } from '../queries'

const squares = [
  { size: 22, left: 16, top: 299 },
  { size: 45, left: 248, top: 343 },
  { size: 15, left: 38, top: 105 },
]

// The banner under the filters points at the fourth featured NFT.
export function FeaturedBanner() {
  const { data, isPending } = useFeaturedQuery()

  if (isPending) return <Skeleton aria-hidden="true" className="h-[470px]" />

  const items = data?.items ?? []
  const nft = items[3] ?? items.at(-1)
  const image = nft?.images[0]
  if (!nft || !image) return null

  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      preload="intent"
      className="relative block h-[470px] overflow-hidden bg-banner"
    >
      <p className="px-5 pt-6 text-2xl font-bold text-highlight">
        {copy.home.filters.featuredTitle}
      </p>
      <p className="mt-4 text-center text-[22px]/4 font-bold text-foreground">
        {copy.home.filters.featuredSubtitle}
      </p>
      <ResponsiveImage
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="310px"
        className="mt-4 h-[368px] w-full rounded-[22px] object-cover"
      />
      {squares.map(({ size, left, top }) => (
        <span
          key={top}
          aria-hidden="true"
          className="absolute rounded-[4px] bg-primary/60"
          style={{ width: size, height: size, left, top }}
        />
      ))}
    </Link>
  )
}
