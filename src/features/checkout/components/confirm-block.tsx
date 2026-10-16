import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CheckoutState } from '../hooks/use-checkout'

interface ConfirmBlockProps {
  checkout: CheckoutState
  variant: 'desktop' | 'mobile'
  // Desktop: the button submits the buyer form, which validates before anything is sent.
  formId?: string
  onConfirm?: () => void
  className?: string
}

export function ConfirmBlock({
  checkout,
  variant,
  formId,
  onConfirm,
  className,
}: ConfirmBlockProps) {
  const reasonId = useId()
  const desktop = variant === 'desktop'
  const reason = checkout.blockReason

  return (
    <div className={className}>
      <Button
        type={formId ? 'submit' : 'button'}
        form={formId}
        variant={desktop ? 'default' : 'ctaMobile'}
        size={desktop ? 'default' : 'ctaMobile'}
        aria-disabled={!checkout.canConfirm || undefined}
        aria-describedby={reason ? reasonId : undefined}
        onClick={(event) => {
          if (!checkout.canConfirm) {
            event.preventDefault()
            return
          }
          onConfirm?.()
        }}
        className={cn('w-full text-[15px]', desktop && 'h-[45px] rounded-card')}
      >
        {copy.checkout.confirmPurchase}
      </Button>
      {reason && (
        <div id={reasonId} className="mt-3 space-y-1 text-sm text-body">
          <p>{reason}</p>
          {checkout.cartBlockers.length > 0 && (
            <>
              <ul className="space-y-1">
                {checkout.cartBlockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
              <Link to="/cart" className="inline-block text-highlight hover:underline">
                {copy.checkout.backToCart}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
