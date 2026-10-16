import { useId } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import type { Cart, Quote } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api-error'
import { displayDiscount, displayEth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { checkoutBlockers, couponIssue } from '../quote'
import { CouponField } from './coupon-field'

interface CartSummaryProps {
  cart: Cart
  quote: Quote | undefined
  quoteError: unknown
  // A newer cart version is being quoted; the numbers on screen belong to the previous one.
  isQuoteStale: boolean
  onRetryQuote: () => void
  variant: 'desktop' | 'mobile'
}

export function CartSummary({
  cart,
  quote,
  quoteError,
  isQuoteStale,
  onRetryQuote,
  variant,
}: CartSummaryProps) {
  const navigate = useNavigate()
  const titleId = useId()
  const reasonId = useId()
  const desktop = variant === 'desktop'

  // Until the quote of the current cart arrives the button waits quietly; the reasons only
  // show for problems the person can fix.
  const reasons = quote && !isQuoteStale ? checkoutBlockers(quote) : []
  const blocked = Boolean(quoteError) || !quote || isQuoteStale || reasons.length > 0
  const applied = couponIssue(quote)

  const goToCheckout = () => {
    if (blocked) return
    // Without a session the guard sends the guest to /login?redirect=/checkout.
    void navigate({ to: '/checkout' })
  }

  const value = cn('whitespace-nowrap', desktop ? 'text-lg' : 'text-base')
  const rows = quote && (
    <dl
      aria-busy={isQuoteStale || undefined}
      className={cn(
        'space-y-3 transition-opacity motion-reduce:transition-none',
        desktop ? 'mt-6' : 'mt-3',
        isQuoteStale && 'opacity-60',
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-[15px]">{copy.cart.subtotal}</dt>
        <dd className={value}>{displayEth(quote.subtotal)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-[15px]">{copy.cart.discount}</dt>
        <dd className={value}>{displayDiscount(quote.discount)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-[15px]">{copy.cart.networkFee}</dt>
        <dd className="text-right">
          <span className={cn('block', value)}>{displayEth(quote.networkFee)}</span>
          <span className="block text-xs text-highlight">{copy.cart.estimatedFee}</span>
        </dd>
      </div>
      <div className={cn('flex items-baseline justify-between gap-4', desktop ? 'pt-3' : 'pt-0')}>
        <dt className="text-base font-bold">{copy.cart.total}</dt>
        <dd className="text-lg font-bold whitespace-nowrap text-highlight">
          {displayEth(quote.total)}
        </dd>
      </div>
    </dl>
  )

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        desktop
          ? 'w-[332px] shrink-0'
          : '-mx-6 mt-auto rounded-t-[40px] bg-surface px-6 pt-6 pb-[max(36px,env(safe-area-inset-bottom))]',
      )}
    >
      <h2
        id={titleId}
        className={cn(
          'text-lg font-bold text-heading',
          desktop ? 'border-b border-line pb-2.5' : 'sr-only',
        )}
      >
        {copy.cart.summaryTitle}
      </h2>
      <CouponField
        appliedCode={cart.couponCode}
        appliedIssue={applied?.message}
        variant={variant}
      />

      {quoteError ? (
        <div role="alert" className="mt-6 rounded-card border border-line p-4 text-sm">
          <p className="font-bold text-heading">{copy.cart.quoteErrorTitle}</p>
          <p className="mt-1 text-body">
            {isApiError(quoteError) ? quoteError.message : copy.states.routeErrorFallback}
          </p>
          <Button type="button" variant="outline" className="mt-3" onClick={onRetryQuote}>
            {copy.states.retry}
          </Button>
        </div>
      ) : quote ? (
        rows
      ) : (
        <SummarySkeleton desktop={desktop} />
      )}

      <Button
        type="button"
        variant={desktop ? 'form' : 'ctaMobile'}
        size={desktop ? 'default' : 'ctaMobile'}
        aria-disabled={blocked || undefined}
        aria-describedby={reasons.length > 0 ? reasonId : undefined}
        onClick={goToCheckout}
        className={cn('w-full', desktop ? 'mt-6 text-[15px]' : 'mt-8')}
      >
        {copy.cart.checkoutCta}
      </Button>
      {reasons.length > 0 && (
        <ul id={reasonId} className="mt-3 space-y-1 text-sm text-body">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {desktop && (
        <p className="mt-3 text-center">
          <Link to="/" hash="mercado" className="text-[15px] text-highlight hover:underline">
            {copy.cart.continueExploring}
          </Link>
        </p>
      )}
    </section>
  )
}

function SummarySkeleton({ desktop }: { desktop: boolean }) {
  return (
    <div aria-busy="true" className={desktop ? 'mt-6' : 'mt-3'}>
      <p className="sr-only">{copy.cart.quoteLoading}</p>
      <div aria-hidden="true" className="space-y-3">
        {[0, 1].map((row) => (
          <Skeleton key={row} className="h-6 rounded-field" />
        ))}
        <Skeleton className="h-10 rounded-field" />
        <Skeleton className={cn('h-7 rounded-field', desktop && 'mt-6')} />
      </div>
    </div>
  )
}
