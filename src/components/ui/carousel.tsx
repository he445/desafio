import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
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

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        api?.scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        api?.scrollNext()
      }
    },
    [api],
  )

  return (
    <div
      role="region"
      aria-roledescription="carousel"
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
