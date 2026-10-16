import { imageSets } from '@/lib/images'

interface ResponsiveImageProps {
  src: string
  alt: string
  width: number
  height: number
  sizes: string
  // The image that paints first on the page: no lazy loading and the highest fetch priority.
  priority?: boolean
  className?: string
}

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className,
}: ResponsiveImageProps) {
  const sets = imageSets(src)
  const image = (
    <img
      src={src}
      srcSet={sets?.webp}
      sizes={sets ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? undefined : 'async'}
      className={className}
    />
  )
  if (!sets) return image

  return (
    <picture className="contents">
      <source type="image/avif" srcSet={sets.avif} sizes={sizes} />
      {image}
    </picture>
  )
}
