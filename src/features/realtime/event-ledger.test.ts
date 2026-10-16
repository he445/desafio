import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearEventLedger,
  getKnownResourceVersion,
  markSideEffectOnce,
  recordResourceVersion,
  shouldAcceptEvent,
} from './event-ledger'

const priceChange = { eventId: 'evt-1', kind: 'nft', id: 'emerald-ape-042', version: 4 } as const

beforeEach(() => {
  clearEventLedger()
})

describe('event ledger', () => {
  it('applies a newer event once and drops its duplicate', () => {
    expect(shouldAcceptEvent(priceChange)).toBe(true)
    expect(shouldAcceptEvent(priceChange)).toBe(false)
    expect(getKnownResourceVersion('nft', 'emerald-ape-042')).toBe(4)
  })

  it('drops an event that is not newer than a version an HTTP response already brought', () => {
    recordResourceVersion('nft', 'emerald-ape-042', 4)
    expect(shouldAcceptEvent(priceChange)).toBe(false)
    expect(shouldAcceptEvent({ ...priceChange, eventId: 'evt-2', version: 3 })).toBe(false)
    expect(shouldAcceptEvent({ ...priceChange, eventId: 'evt-3', version: 5 })).toBe(true)
  })

  it('never lowers the version recorded from HTTP', () => {
    recordResourceVersion('order', 'order-1', 3)
    recordResourceVersion('order', 'order-1', 2)
    expect(getKnownResourceVersion('order', 'order-1')).toBe(3)
  })

  it('keeps rejecting an old event after its id leaves the 500-id window', () => {
    expect(shouldAcceptEvent(priceChange)).toBe(true)
    for (let index = 0; index < 500; index += 1) {
      shouldAcceptEvent({ eventId: `other-${index}`, kind: 'nft', id: `nft-${index}`, version: 1 })
    }
    expect(shouldAcceptEvent(priceChange)).toBe(false)
  })

  it('runs a side effect once per version and never for an older one', () => {
    expect(markSideEffectOnce('order', 'order-1', 2)).toBe(true)
    expect(markSideEffectOnce('order', 'order-1', 2)).toBe(false)
    expect(markSideEffectOnce('order', 'order-1', 1)).toBe(false)
    expect(markSideEffectOnce('order', 'order-1', 3)).toBe(true)
  })

  it('forgets everything when the session changes', () => {
    shouldAcceptEvent(priceChange)
    markSideEffectOnce('order', 'order-1', 2)
    clearEventLedger()

    expect(getKnownResourceVersion('nft', 'emerald-ape-042')).toBe(0)
    expect(shouldAcceptEvent(priceChange)).toBe(true)
    expect(markSideEffectOnce('order', 'order-1', 2)).toBe(true)
  })
})
