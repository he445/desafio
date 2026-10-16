import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { copy } from '@/content/copy'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

export type CarouselApi = UseEmblaCarouselType[1]

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  opts?: Parameters<typeof useEmblaCarousel>[0]
  setApi?: (api: CarouselApi) => void
}

export function Carousel({ opts, setApi, className, children, ...props }: CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel({
    align: 'start',
    ...opts,
  })

  React.useEffect(() => {
    if (api && setApi) {
      setApi(api)
    }
  }, [api, setApi])

  // With reduced motion the keyboard jumps straight to the slide instead of animating.
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        api?.scrollPrev(reduceMotion)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        api?.scrollNext(reduceMotion)
      }
    },
    [api, reduceMotion],
  )

  return (
    <div
      role="region"
      aria-roledescription={copy.a11y.carousel}
      onKeyDownCapture={handleKeyDown}
      className={cn('relative', className)}
      {...props}
    >
      <div ref={carouselRef} className="overflow-hidden">
        {children}
      </div>
    </div>
  )
}
