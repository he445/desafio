import { useState, type ReactNode } from 'react'
import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import type { NftImage } from '@/contracts'
import { copy } from '@/content/copy'
import { ChevronLeftIcon } from '@/components/icons'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { ResponsiveImage } from '@/components/ui/responsive-image'

interface NftHeroMobileProps {
  images: NftImage[]
  favoriteButton: ReactNode
}

export function NftHeroMobile({ images, favoriteButton }: NftHeroMobileProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const [api, setApi] = useState<CarouselApi>()

  const handleBack = () => {
    if (canGoBack) router.history.back()
    else void navigate({ to: '/', hash: 'mercado' })
  }

  return (
    <div className="-mx-6 h-[506px] bg-card-m pt-[max(24px,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between px-7">
        <button
          type="button"
          onClick={handleBack}
          aria-label={copy.a11y.back}
          className="flex size-[35px] items-center justify-center rounded-full border border-line bg-surface-raised text-foreground"
        >
          <ChevronLeftIcon size={20} />
        </button>
        {favoriteButton}
      </div>
      <Carousel
        setApi={setApi}
        aria-label={copy.detail.gallery}
        className="mx-auto mt-2 w-[361px] max-w-[calc(100%-48px)]"
      >
        <CarouselContent>
          {images.map((image, position) => (
            <CarouselItem
              key={image.src}
              aria-label={copy.detail.imageOf(position + 1, images.length)}
            >
              <ResponsiveImage
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="361px"
                priority={position === 0}
                className="h-[356px] w-full rounded-hero object-cover"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <CarouselDots
            api={api}
            count={images.length}
            className="absolute inset-x-0 bottom-[50px] gap-1.5"
            dotClassName="size-[7px]"
          />
        )}
      </Carousel>
    </div>
  )
}
