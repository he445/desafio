import { useRef, useState, type KeyboardEvent } from 'react'
import type { NftImage } from '@/contracts'
import { copy } from '@/content/copy'
import { SearchIcon } from '@/components/icons'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { cn } from '@/lib/utils'

const NEXT_KEYS = ['ArrowDown', 'ArrowRight']
const PREVIOUS_KEYS = ['ArrowUp', 'ArrowLeft']

export function NftGallery({ images, title }: { images: NftImage[]; title: string }) {
  const [index, setIndex] = useState(0)
  const thumbs = useRef<Array<HTMLButtonElement | null>>([])
  const current = images[index] ?? images[0]

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = NEXT_KEYS.includes(event.key) ? 1 : PREVIOUS_KEYS.includes(event.key) ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + images.length) % images.length
    setIndex(next)
    thumbs.current[next]?.focus()
  }

  if (!current) return null

  return (
    <div className="flex gap-7">
      <div
        role="toolbar"
        aria-label={copy.detail.gallery}
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
        className="flex shrink-0 flex-col gap-4"
      >
        {images.map((image, position) => (
          <button
            key={image.src}
            ref={(node) => {
              thumbs.current[position] = node
            }}
            type="button"
            aria-label={copy.detail.imageOf(position + 1, images.length)}
            aria-pressed={position === index}
            tabIndex={position === index ? 0 : -1}
            onClick={() => setIndex(position)}
            className={cn(
              'size-[100px] overflow-hidden rounded-card border border-transparent',
              position === index && 'border-primary',
            )}
          >
            <ResponsiveImage
              src={image.src}
              alt=""
              width={image.width}
              height={image.height}
              sizes="100px"
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>
      <div className="relative aspect-square w-full max-w-[444px] min-w-0 rounded-btn bg-surface p-5">
        <ResponsiveImage
          src={current.src}
          alt={current.alt}
          width={current.width}
          height={current.height}
          sizes="404px"
          priority={index === 0}
          className="size-full rounded-hero object-cover"
        />
        <Dialog>
          <DialogTrigger
            aria-label={copy.detail.zoom}
            className="absolute top-[13px] right-3 flex size-[30px] items-center justify-center rounded-full bg-surface-raised text-foreground"
          >
            <SearchIcon size={20} />
          </DialogTrigger>
          <DialogContent bottomBar={false} className="max-w-[min(90vw,760px)] p-6">
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <ResponsiveImage
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="(min-width: 800px) 712px, 90vw"
              className="h-auto w-full rounded-hero"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
