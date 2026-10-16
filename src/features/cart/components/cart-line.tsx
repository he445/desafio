import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { CartItem, Quote } from '@/contracts'
import { copy } from '@/content/copy'
import { DangerIcon, DeleteIcon } from '@/components/icons'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { isApiError } from '@/lib/api-error'
import { displayEth, displayTokenId, formatEthNumberDisplay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRemoveCartItem, useUpdateCartItem } from '../queries'
import { issuesForItem, stockLimit } from '../quote'

export const CART_GRID = 'grid grid-cols-[250px_77px_75px_87px_24px] gap-x-[61px]'

// Visual column titles; each row carries its own hidden labels for screen readers.
export function CartTableHeader() {
  return (
    <div aria-hidden="true" className="border-b border-line pb-3">
      <div className={cn(CART_GRID, 'pr-6 text-base font-medium text-heading')}>
        <span>{copy.cart.colNfts}</span>
        <span>{copy.cart.colPrice}</span>
        <span>{copy.cart.colEditions}</span>
        <span>{copy.cart.colTotal}</span>
        <span />
      </div>
    </div>
  )
}

interface CartLineProps {
  item: CartItem
  lineTotal: string
  quote: Quote | undefined
  variant: 'desktop' | 'mobile'
  onRemoved: () => void
}

function failureMessage(error: unknown): string {
  return isApiError(error) ? error.message : copy.cart.updateFailed
}

export function CartLine({ item, lineTotal, quote, variant, onRemoved }: CartLineProps) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  // While the server answers, the stepper shows the number the person asked for; the cache
  // keeps the server's cart, so a failure goes back to it without a rollback.
  const quantity = update.isPending ? update.variables.quantity : item.quantity
  const limit = Math.max(stockLimit(item), item.quantity)

  const setQuantity = (next: number) => {
    update.mutate(
      { itemId: item.id, quantity: next },
      { onError: (error) => toast.error(failureMessage(error)) },
    )
  }

  const removeItem = () => {
    remove.mutate(item.id, {
      onSuccess: () => {
        toast(copy.cart.removed(item.title))
        onRemoved()
      },
      onError: (error) => toast.error(failureMessage(error)),
    })
  }

  const title = (
    <Link
      to="/nft/$nftId"
      params={{ nftId: item.nftId }}
      search={{ edition: item.editionId }}
      className="hover:text-highlight"
    >
      {item.title}
    </Link>
  )
  const stepper = (
    <QuantityStepper
      value={quantity}
      max={limit}
      onChange={setQuantity}
      disabled={busy || item.available === 0}
      label={copy.cart.quantityOf(item.title)}
      variant={variant === 'desktop' ? 'cart' : 'cartMobile'}
    />
  )
  const removeButton = (
    <button
      type="button"
      data-cart-remove
      aria-label={copy.cart.removeItem(item.title)}
      disabled={busy}
      onClick={removeItem}
      className="flex size-6 items-center justify-center text-body hover:text-highlight disabled:opacity-40"
    >
      <DeleteIcon size={24} />
    </button>
  )
  // The wrapper keeps the <source> of the <picture> out of the row's flex gap.
  const image = (size: number, className: string) => (
    <div className="shrink-0">
      <ResponsiveImage
        src={item.image}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        className={cn('object-cover', className)}
      />
    </div>
  )

  return (
    <li aria-busy={busy || undefined}>
      {variant === 'desktop' ? (
        <div className={cn(CART_GRID, 'h-[70px] items-center bg-surface pr-6')}>
          <div className="flex min-w-0 items-center gap-4">
            {image(70, 'size-[70px] rounded-btn')}
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-heading">{title}</h3>
              <p className="truncate text-sm/4 text-muted-foreground">
                {copy.detail.editionLabel} {item.editionName}
              </p>
              <p className="truncate text-sm/4 text-muted-foreground">
                {copy.detail.tokenIdPrefix} {displayTokenId(item.tokenId)}
              </p>
            </div>
          </div>
          <p className="text-base font-bold whitespace-nowrap text-body">
            <span className="sr-only">{copy.cart.priceLabel} </span>
            {displayEth(item.unitPrice)}
          </p>
          {stepper}
          <p className="text-base font-bold whitespace-nowrap text-highlight">
            <span className="sr-only">{copy.cart.lineTotalLabel} </span>
            {displayEth(lineTotal)}
          </p>
          {removeButton}
        </div>
      ) : (
        <div className="relative h-[100px] overflow-hidden rounded-mobile-card bg-surface shadow-card-m">
          {image(100, 'absolute inset-y-0 left-0 size-[100px]')}
          <h3 className="absolute top-[13px] right-11 left-[109px] truncate text-[15px] font-bold text-heading">
            {title}
          </h3>
          <p className="absolute top-[35px] left-[109px] text-sm text-body">
            {copy.detail.editionLabel} {item.editionName}
          </p>
          <p className="absolute top-[69px] left-[109px] text-lg/6 font-bold text-highlight">
            <span className="sr-only">{copy.cart.priceLabel} </span>
            {displayEth(item.unitPrice)}
          </p>
          <div className="absolute top-2.5 right-3">{removeButton}</div>
          <div className="absolute right-[13px] bottom-[9px]">{stepper}</div>
        </div>
      )}
      <LineNotices item={item} quote={quote} busy={busy} onAdjust={(next) => setQuantity(next)} />
    </li>
  )
}

function LineNotices({
  item,
  quote,
  busy,
  onAdjust,
}: {
  item: CartItem
  quote: Quote | undefined
  busy: boolean
  onAdjust: (quantity: number) => void
}) {
  const notices = issuesForItem(quote, item)
  const limit = stockLimit(item)

  return (
    <div role="status">
      {notices.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-coral">
          {notices.map((issue) => (
            <li key={issue.code} className="flex flex-wrap items-center gap-x-2">
              <DangerIcon size={16} className="shrink-0" />
              {issue.code === 'PRICE_CHANGED' && issue.previousPrice && issue.currentPrice && (
                <span>
                  {copy.cart.priceChanged(
                    formatEthNumberDisplay(issue.previousPrice),
                    formatEthNumberDisplay(issue.currentPrice),
                  )}
                </span>
              )}
              {issue.code === 'INSUFFICIENT_STOCK' && (
                <>
                  <span>{copy.cart.stockLeft(item.available)}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onAdjust(limit)}
                    className="font-bold text-highlight underline underline-offset-2 disabled:opacity-40"
                  >
                    {copy.cart.adjustTo(limit)}
                  </button>
                </>
              )}
              {issue.code === 'EDITION_SOLD_OUT' && <span>{copy.cart.soldOut}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
