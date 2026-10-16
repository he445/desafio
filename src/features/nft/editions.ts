import type { CartItem, Edition } from '@/contracts'

export interface EditionChoice {
  selected: Edition | undefined
  // The URL asked for an edition that does not exist or is sold out.
  requestedUnavailable: boolean
}

export function resolveEdition(
  editions: Edition[],
  requestedId: string | undefined,
): EditionChoice {
  const requested = requestedId ? editions.find((edition) => edition.id === requestedId) : undefined
  if (requested && requested.available > 0) {
    return { selected: requested, requestedUnavailable: false }
  }
  return {
    selected: editions.find((edition) => edition.available > 0),
    requestedUnavailable: requestedId !== undefined,
  }
}

export function quantityInCart(items: CartItem[] | undefined, editionId: string): number {
  return (items ?? [])
    .filter((item) => item.editionId === editionId)
    .reduce((total, item) => total + item.quantity, 0)
}

// How many more units of this edition one order can still take.
export function quantityLimit(edition: Edition, inCart: number): number {
  return Math.max(0, Math.min(edition.available, edition.maxPerOrder) - inCart)
}

export function clampQuantity(quantity: number, limit: number): number {
  return Math.min(Math.max(quantity, 1), Math.max(limit, 1))
}
