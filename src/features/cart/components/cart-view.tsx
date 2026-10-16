import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { DEFAULT_CATALOG_SEARCH } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { NftCarouselSection } from '@/features/catalog/components/nft-carousel-section'
import { nftListQueryOptions } from '@/features/catalog/queries'
import { isApiError } from '@/lib/api-error'
import { useCartQuery, useCartQuote } from '../queries'
import { lineTotal } from '../quote'
import { CartLine, CartTableHeader } from './cart-line'
import { CartSkeleton } from './cart-skeleton'
import { CartSummary } from './cart-summary'

const EMPTY_TITLE_ID = 'cart-empty-title'

export function CartView({ variant }: { variant: 'desktop' | 'mobile' }) {
  const cartQuery = useCartQuery()
  const cart = cartQuery.data
  const quoteQuery = useCartQuote(cart)
  const listRef = useRef<HTMLUListElement>(null)
  // Index of the row just removed: focus moves to the row that took its place.
  const focusAfterRemoval = useRef<number | null>(null)
  const itemCount = cart?.items.length ?? 0

  useEffect(() => {
    const index = focusAfterRemoval.current
    if (index === null) return
    focusAfterRemoval.current = null
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-cart-remove]')
    const next = buttons?.[Math.min(index, buttons.length - 1)]
    if (next) next.focus()
    else document.getElementById(EMPTY_TITLE_ID)?.focus()
  }, [itemCount])

  if (cartQuery.isPending) return <CartSkeleton variant={variant} />

  // A failed background refetch keeps the cart on screen; only a cart that never loaded
  // turns into the error card.
  if (!cart) {
    return (
      <div role="alert" className="mt-3 rounded-card bg-surface p-8 text-center">
        <h2 className="text-lg font-bold text-heading">{copy.cart.errorTitle}</h2>
        <p className="mt-2 text-sm text-body">
          {isApiError(cartQuery.error) ? cartQuery.error.message : copy.states.routeErrorFallback}
        </p>
        <Button type="button" className="mt-6" onClick={() => void cartQuery.refetch()}>
          {copy.states.retry}
        </Button>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="mt-3 rounded-card bg-surface p-8 text-center">
        <h2 id={EMPTY_TITLE_ID} tabIndex={-1} className="text-lg font-bold text-heading">
          {copy.cart.emptyTitle}
        </h2>
        <Button asChild className="mt-6">
          <Link to="/" hash="mercado">
            {copy.cart.emptyCta}
          </Link>
        </Button>
      </div>
    )
  }

  const quote = quoteQuery.data
  const isQuoteStale = quoteQuery.isPlaceholderData || (quote && quote.cartVersion !== cart.version)
  const lines = (
    <ul
      ref={listRef}
      aria-label={copy.cart.itemsLabel}
      aria-busy={cartQuery.isFetching || undefined}
      className={variant === 'desktop' ? 'mt-3 space-y-3' : 'mt-3 space-y-5'}
    >
      {cart.items.map((item, index) => (
        <CartLine
          key={item.id}
          item={item}
          lineTotal={lineTotal(item, quote, cart.version)}
          quote={quote}
          variant={variant}
          onRemoved={() => {
            focusAfterRemoval.current = index
          }}
        />
      ))}
    </ul>
  )
  const summary = (
    <CartSummary
      cart={cart}
      quote={quote}
      quoteError={quoteQuery.isError ? quoteQuery.error : null}
      isQuoteStale={Boolean(isQuoteStale)}
      onRetryQuote={() => void quoteQuery.refetch()}
      variant={variant}
    />
  )

  if (variant === 'mobile') {
    return (
      <>
        {lines}
        <div className="h-8 shrink-0" />
        {summary}
      </>
    )
  }

  return (
    <div className="mt-3 flex items-start gap-[86px]">
      <div className="w-[782px]">
        <CartTableHeader />
        {lines}
      </div>
      {summary}
    </div>
  )
}

export function AlsoViewed() {
  const { data } = useQuery(
    nftListQueryOptions({ ...DEFAULT_CATALOG_SEARCH, tab: 'trending', pageSize: 15 }),
  )
  return <NftCarouselSection title={copy.cart.alsoViewed} items={data?.items ?? []} />
}
