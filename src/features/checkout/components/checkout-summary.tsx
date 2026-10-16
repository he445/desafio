import type { Cart, Quote } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { displayDiscount, displayEth, displayQuantity, displayTokenId } from '@/lib/format'
import { cn } from '@/lib/utils'

function cartItemFor(cart: Cart, editionId: string) {
  return cart.items.find((item) => item.editionId === editionId)
}

export function CheckoutItems({ cart, quote }: { cart: Cart; quote: Quote }) {
  return (
    <ul className="space-y-3" aria-label={copy.checkout.yourNfts}>
      {quote.lines.map((line) => {
        const item = cartItemFor(cart, line.editionId)
        if (!item) return null
        return (
          <li
            key={line.editionId}
            className="flex h-[70px] items-center gap-3 rounded-card bg-surface pr-3"
          >
            <ResponsiveImage
              src={item.image}
              alt=""
              width={70}
              height={70}
              sizes="70px"
              className="size-[70px] shrink-0 rounded-card object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-heading">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {displayTokenId(item.tokenId)}{' '}
                <span className="text-foreground">{displayQuantity(line.quantity)}</span>
              </p>
            </div>
            <p className="text-lg font-bold whitespace-nowrap text-highlight">
              {displayEth(line.lineTotal)}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

export function CheckoutTotals({ quote, className }: { quote: Quote; className?: string }) {
  return (
    <dl className={cn('space-y-3 text-[15px]', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <dt>{copy.cart.subtotal}</dt>
        <dd className="text-lg whitespace-nowrap">{displayEth(quote.subtotal)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt>{copy.cart.discount}</dt>
        <dd className="text-lg whitespace-nowrap">{displayDiscount(quote.discount)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt>{copy.cart.networkFee}</dt>
        <dd className="text-right">
          <span className="block text-lg whitespace-nowrap">{displayEth(quote.networkFee)}</span>
          <span className="block text-xs text-highlight">{copy.cart.estimatedFee}</span>
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="text-base font-bold">{copy.cart.total}</dt>
        <dd className="text-lg font-bold whitespace-nowrap text-highlight">
          {displayEth(quote.total)}
        </dd>
      </div>
    </dl>
  )
}

interface QuoteReviewProps {
  cart: Cart
  quote: Quote
  nextQuote: Quote | undefined
  onAccept: () => void
}

// Before and after, side by side, for every line whose price moved and for the total.
export function QuoteReview({ cart, quote, nextQuote, onAccept }: QuoteReviewProps) {
  if (!nextQuote) {
    return (
      <p aria-busy="true" className="rounded-card border border-line p-4 text-sm text-body">
        {copy.checkout.quoteUpdating}
      </p>
    )
  }

  const changed = nextQuote.lines.flatMap((line) => {
    const before = quote.lines.find((candidate) => candidate.editionId === line.editionId)
    const item = cartItemFor(cart, line.editionId)
    if (!item || before?.lineTotal === line.lineTotal) return []
    return [{ key: line.editionId, label: `${item.title} (${item.editionName})`, before, line }]
  })

  return (
    <section
      aria-label={copy.checkout.quoteChanged}
      className="rounded-card border border-primary p-4 text-sm"
    >
      <p className="font-bold text-heading">{copy.checkout.quoteChanged}</p>
      <table className="mt-3 w-full text-left">
        <thead className="text-muted-foreground">
          <tr>
            <th scope="col" className="sr-only">
              {copy.checkout.yourNfts}
            </th>
            <th scope="col" className="text-right font-normal">
              {copy.checkout.quoteBefore}
            </th>
            <th scope="col" className="text-right font-normal">
              {copy.checkout.quoteAfter}
            </th>
          </tr>
        </thead>
        <tbody>
          {changed.map(({ key, label, before, line }) => (
            <tr key={key}>
              <th scope="row" className="py-1 pr-2 font-normal">
                {label}
              </th>
              <td className="py-1 text-right whitespace-nowrap">
                {before ? displayEth(before.lineTotal) : '—'}
              </td>
              <td className="py-1 text-right whitespace-nowrap text-highlight">
                {displayEth(line.lineTotal)}
              </td>
            </tr>
          ))}
          <tr className="font-bold">
            <th scope="row" className="pt-2 pr-2">
              {copy.cart.total}
            </th>
            <td className="pt-2 text-right whitespace-nowrap">{displayEth(quote.total)}</td>
            <td className="pt-2 text-right whitespace-nowrap text-highlight">
              {displayEth(nextQuote.total)}
            </td>
          </tr>
        </tbody>
      </table>
      <Button type="button" variant="outline" className="mt-3 w-full" onClick={onAccept}>
        {copy.checkout.reviewNewQuote}
      </Button>
    </section>
  )
}
