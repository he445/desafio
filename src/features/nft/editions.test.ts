import { describe, expect, it } from 'vitest'
import type { CartItem, Edition } from '@/contracts'
import { clampQuantity, quantityInCart, quantityLimit, resolveEdition } from './editions'

const editions: Edition[] = [
  { id: 'a-1-1', name: '1/1', price: '3.5', supply: 1, available: 0, maxPerOrder: 1 },
  { id: 'a-1-10', name: '1/10', price: '1.49', supply: 10, available: 2, maxPerOrder: 2 },
  { id: 'a-1-50', name: '1/50', price: '1.19', supply: 50, available: 12, maxPerOrder: 5 },
]

function cartItem(editionId: string, quantity: number): CartItem {
  return {
    id: `item-${editionId}`,
    nftId: 'a',
    editionId,
    title: 'A',
    tokenId: '0001',
    editionName: '1/10',
    image: '/images/nfts/emerald-1.webp',
    quantity,
    unitPrice: '1',
    unitPriceWhenAdded: '1',
    available: 10,
    maxPerOrder: 5,
    nftVersion: 1,
  }
}

describe('resolveEdition', () => {
  it('picks the first edition in stock when the URL names none', () => {
    expect(resolveEdition(editions, undefined)).toEqual({
      selected: editions[1],
      requestedUnavailable: false,
    })
  })

  it('keeps the edition the URL names while it is in stock', () => {
    expect(resolveEdition(editions, 'a-1-50').selected?.id).toBe('a-1-50')
  })

  it('flags a sold out or unknown edition and falls back to the first in stock', () => {
    for (const id of ['a-1-1', 'does-not-exist']) {
      expect(resolveEdition(editions, id)).toEqual({
        selected: editions[1],
        requestedUnavailable: true,
      })
    }
  })

  it('selects nothing when every edition is sold out', () => {
    const soldOut = editions.map((edition) => ({ ...edition, available: 0 }))
    expect(resolveEdition(soldOut, undefined).selected).toBeUndefined()
  })
})

describe('quantityLimit', () => {
  it('is the smaller of stock and the per order cap, minus what is already in the cart', () => {
    const items = [cartItem('a-1-50', 2), cartItem('a-1-10', 1)]
    expect(quantityLimit(editions[2]!, quantityInCart(items, 'a-1-50'))).toBe(3)
    expect(quantityLimit(editions[1]!, quantityInCart(items, 'a-1-10'))).toBe(1)
    expect(quantityLimit(editions[1]!, 5)).toBe(0)
  })
})

describe('clampQuantity', () => {
  it('stays between 1 and the limit', () => {
    expect(clampQuantity(0, 3)).toBe(1)
    expect(clampQuantity(4, 3)).toBe(3)
    expect(clampQuantity(2, 0)).toBe(1)
  })
})
