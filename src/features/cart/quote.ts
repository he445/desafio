import type { CartItem, NetworkId, Quote, QuoteIssue } from '@/contracts'
import { copy } from '@/content/copy'
import { multiplyEth } from '@/lib/eth'

// The cart summary quotes on Ethereum, the network of the Figma confirmation. The fee is
// labelled as an estimate; the checkout quotes again on the network the buyer picks.
export const CART_QUOTE_NETWORK: NetworkId = 'ethereum'

const BLOCKING: ReadonlySet<QuoteIssue['code']> = new Set([
  'INSUFFICIENT_STOCK',
  'EDITION_SOLD_OUT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
])

export function stockLimit(item: CartItem): number {
  return Math.min(item.available, item.maxPerOrder)
}

export function issuesForItem(quote: Quote | undefined, item: CartItem): QuoteIssue[] {
  return (quote?.issues ?? []).filter((issue) => issue.editionId === item.editionId)
}

export function couponIssue(quote: Quote | undefined): QuoteIssue | undefined {
  return quote?.issues.find(
    (issue) => issue.code === 'COUPON_INVALID' || issue.code === 'COUPON_EXPIRED',
  )
}

// The line total comes from the quote of this exact cart version; until it arrives the line
// shows price × quantity, which is only for display.
export function lineTotal(item: CartItem, quote: Quote | undefined, cartVersion: number): string {
  const line =
    quote?.cartVersion === cartVersion
      ? quote.lines.find((candidate) => candidate.editionId === item.editionId)
      : undefined
  return line?.lineTotal ?? multiplyEth(item.unitPrice, item.quantity)
}

// One sentence per kind of problem, in the order a person would fix them.
export function checkoutBlockers(quote: Quote): string[] {
  const codes = new Set(quote.issues.filter((issue) => BLOCKING.has(issue.code)).map((i) => i.code))
  const reasons: string[] = []
  if (codes.has('EDITION_SOLD_OUT')) reasons.push(copy.cart.blockedSoldOut)
  if (codes.has('INSUFFICIENT_STOCK')) reasons.push(copy.cart.blockedStock)
  const coupon = couponIssue(quote)
  if (coupon) {
    reasons.push(
      copy.cart.blockedCoupon(
        coupon.message ??
          (coupon.code === 'COUPON_EXPIRED'
            ? copy.validation.couponExpired
            : copy.validation.couponInvalid),
      ),
    )
  }
  return reasons
}
