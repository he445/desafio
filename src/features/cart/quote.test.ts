import { describe, expect, it } from 'vitest'
import type { CartItem, Quote } from '@/contracts'
import { checkoutBlockers, couponIssue, issuesForItem, lineTotal, stockLimit } from './quote'

const item: CartItem = {
  id: 'ci-1',
  nftId: 'emerald-ape-042',
  editionId: 'emerald-ape-042-1-50',
  title: 'Emerald Ape #042',
  tokenId: '0042',
  editionName: '1/50',
  image: '/images/nfts/emerald-1.webp',
  quantity: 3,
  unitPrice: '1.19',
  unitPriceWhenAdded: '1.19',
  available: 12,
  maxPerOrder: 5,
  nftVersion: 1,
}

const line: Quote['lines'][number] = {
  nftId: item.nftId,
  editionId: item.editionId,
  quantity: 3,
  unitPrice: '1.19',
  lineTotal: '3.57',
  nftVersion: 1,
}

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'quote-1',
    cartVersion: 4,
    network: 'ethereum',
    couponCode: null,
    lines: [line],
    subtotal: '3.57',
    discount: '0',
    networkFee: '0.016',
    total: '3.586',
    issues: [],
    expiresAt: '2026-10-16T12:10:00.000Z',
    ...overrides,
  }
}

describe('stockLimit', () => {
  it('is the smaller of the stock and the per-order limit', () => {
    expect(stockLimit(item)).toBe(5)
    expect(stockLimit({ ...item, available: 2 })).toBe(2)
  })
})

describe('lineTotal', () => {
  it('uses the quote line when the quote belongs to this cart version', () => {
    expect(lineTotal(item, quote({ lines: [{ ...line, lineTotal: '9' }] }), 4)).toBe('9')
  })

  it('multiplies price and quantity while the quote is for another version', () => {
    expect(lineTotal({ ...item, quantity: 2 }, quote(), 5)).toBe('2.38')
    expect(lineTotal(item, undefined, 4)).toBe('3.57')
  })
})

describe('issues', () => {
  const priceChanged: Quote['issues'][number] = {
    code: 'PRICE_CHANGED',
    editionId: item.editionId,
    previousPrice: '1.1',
    currentPrice: '1.19',
  }
  const issues: Quote['issues'] = [
    priceChanged,
    { code: 'INSUFFICIENT_STOCK', editionId: 'other-edition' },
    { code: 'COUPON_EXPIRED', message: 'Código promocional expirado' },
  ]

  it('keeps only the issues of one line', () => {
    expect(issuesForItem(quote({ issues }), item).map((issue) => issue.code)).toEqual([
      'PRICE_CHANGED',
    ])
  })

  it('finds the coupon issue', () => {
    expect(couponIssue(quote({ issues }))?.code).toBe('COUPON_EXPIRED')
    expect(couponIssue(quote())).toBeUndefined()
  })

  it('blocks the checkout for stock and coupon problems, never for a price change', () => {
    expect(checkoutBlockers(quote({ issues: [priceChanged] }))).toEqual([])
    expect(checkoutBlockers(quote({ issues }))).toEqual([
      'Ajuste a quantidade dos itens destacados para continuar.',
      'Código promocional expirado. Remova o cupom para continuar.',
    ])
    expect(
      checkoutBlockers(quote({ issues: [{ code: 'EDITION_SOLD_OUT', editionId: 'x' }] })),
    ).toEqual(['Remova os itens esgotados para continuar.'])
  })
})
