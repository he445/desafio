import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { HeartIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFavorite } from '../queries'

type FavoriteButtonVariant = 'detail' | 'hero' | 'card'

export function FavoriteButton({
  nft,
  variant,
  className,
}: {
  nft: Nft
  variant: FavoriteButtonVariant
  className?: string
}) {
  const { isFavorite, toggle } = useFavorite(nft)

  if (variant === 'detail') {
    return (
      <Button
        type="button"
        variant="outline"
        size="detail"
        aria-pressed={isFavorite}
        onClick={toggle}
        className={className}
      >
        <HeartIcon size={20} filled={isFavorite} />
        {isFavorite ? copy.detail.favorited : copy.detail.favorite}
      </Button>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={copy.favorites.add(nft.title)}
      onClick={toggle}
      className={cn(
        'flex items-center justify-center rounded-full text-foreground',
        variant === 'hero'
          ? 'size-[35px] border border-line bg-surface-raised'
          : 'size-7 bg-ink/60',
        isFavorite && 'text-highlight',
        className,
      )}
    >
      <HeartIcon size={variant === 'hero' ? 20 : 16} filled={isFavorite} />
    </button>
  )
}
