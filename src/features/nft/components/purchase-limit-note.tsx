import { copy } from '@/content/copy'
import { cn } from '@/lib/utils'
import type { NftPurchase } from '../hooks/use-nft-purchase'

// Shown once the stepper reaches the most this order can take, so the disabled "+" has a reason.
export function PurchaseLimitNote({
  purchase,
  className,
}: {
  purchase: NftPurchase
  className?: string
}) {
  const { selected, limit, inCart, quantity } = purchase
  let message: string | undefined
  if (selected && limit === 0) message = copy.detail.cartFull(inCart)
  else if (selected && quantity >= limit) message = copy.detail.limitReached(limit, inCart)

  return (
    <p aria-live="polite" className={cn('min-h-5 text-sm text-body', className)}>
      {message}
    </p>
  )
}
