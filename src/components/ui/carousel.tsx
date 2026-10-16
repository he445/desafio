import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { copy } from '@/content/copy'
import { usePrefersReducedMotion } from '@/lib/use-media-query'
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
  const reduceMotion = usePrefersReducedMotion()

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

export function CarouselContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex', className)} {...props} />
}

export function CarouselItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      aria-roledescription={copy.a11y.slide}
      className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}
      {...props}
    />
  )
}

export function useCarouselIndex(api: CarouselApi | undefined): number {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      api?.on('select', onChange)
      api?.on('reInit', onChange)
      return () => {
        api?.off('select', onChange)
        api?.off('reInit', onChange)
      }
    },
    [api],
  )
  return React.useSyncExternalStore(
    subscribe,
    () => api?.selectedScrollSnap() ?? 0,
    () => 0,
  )
}

interface CarouselDotsProps {
  api: CarouselApi | undefined
  count: number
  className?: string
  dotClassName?: string
}

// Each dot is a 24 px target (the minimum for a touch target) around the drawn dot.
export function CarouselDots({ api, count, className, dotClassName }: CarouselDotsProps) {
  const index = useCarouselIndex(api)
  const reduceMotion = usePrefersReducedMotion()

  return (
    <div className={cn('pointer-events-none flex items-center justify-center', className)}>
      {Array.from({ length: count }, (_, position) => (
        <button
          key={position}
          type="button"
          aria-label={copy.a11y.carouselPage(position + 1, count)}
          aria-current={position === index ? 'true' : undefined}
          onClick={() => api?.scrollTo(position, reduceMotion)}
          className="pointer-events-auto flex size-6 items-center justify-center"
        >
          <span
            aria-hidden="true"
            className={cn(
              'block size-2 rounded-full border border-primary',
              position === index && 'bg-primary',
              dotClassName,
            )}
          />
        </button>
      ))}
    </div>
  )
}
