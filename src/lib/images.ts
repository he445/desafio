export const IMAGE_WIDTHS = [320, 640, 960] as const

export interface ImageSets {
  avif: string
  webp: string
}

// scripts/build-assets.mjs writes <art>-<view>.webp (640 px) next to
// <art>-<view>-<width>.avif and .webp in three widths; the srcsets follow those names.
export function imageSets(src: string): ImageSets | null {
  const match = /^(\/images\/nfts\/[a-z]+-\d)\.webp$/.exec(src)
  if (!match) return null
  const base = match[1]
  const set = (format: 'avif' | 'webp') =>
    IMAGE_WIDTHS.map((width) => `${base}-${width}.${format} ${width}w`).join(', ')
  return { avif: set('avif'), webp: set('webp') }
}
