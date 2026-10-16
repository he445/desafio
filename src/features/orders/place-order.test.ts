import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateOrderInput, Order } from '@/contracts'
import { ApiError } from '@/lib/api-error'
import { createOrderApi, fetchPendingOrdersApi } from './api'
import { loadCheckoutAttempt } from './attempt'
import { ORDER_RESENDS, placeOrder } from './place-order'

vi.mock('./api', () => ({ createOrderApi: vi.fn(), fetchPendingOrdersApi: vi.fn() }))

const body: CreateOrderInput = {
  quoteId: 'quote-1',
  connectionId: 'wconn-1',
  buyer: {
    displayName: 'Marina Costa',
    profileName: 'marina',
    email: 'marina@nftmarket.test',
    ensName: 'nova.kurio',
    referralCode: 'KURIO-2048',
    username: 'marina',
    note: null,
  },
}

const order = { id: 'order-1', quoteId: 'quote-1', status: 'pending', version: 1 } as Order
const timeout = () =>
  new ApiError({ kind: 'timeout', code: 'TIMEOUT', message: 'timeout', retryable: true })

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(createOrderApi).mockReset()
  vi.mocked(fetchPendingOrdersApi).mockReset()
})

describe('placeOrder', () => {
  it('resends the same key after a timeout and returns the order it finds', async () => {
    vi.mocked(createOrderApi).mockRejectedValueOnce(timeout()).mockResolvedValueOnce(order)
    const onResend = vi.fn()

    await expect(placeOrder('user-marina', body, onResend)).resolves.toBe(order)

    const keys = vi.mocked(createOrderApi).mock.calls.map(([, key]) => key)
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe(keys[1])
    expect(onResend).toHaveBeenCalledTimes(1)
  })

  it('keeps the key for the same body and changes it only when the body changes', async () => {
    vi.mocked(createOrderApi).mockResolvedValue(order)
    await placeOrder('user-marina', body, vi.fn())
    const first = loadCheckoutAttempt('user-marina')?.key
    await placeOrder('user-marina', body, vi.fn())
    expect(loadCheckoutAttempt('user-marina')?.key).toBe(first)

    await placeOrder('user-marina', { ...body, quoteId: 'quote-2' }, vi.fn())
    expect(loadCheckoutAttempt('user-marina')?.key).not.toBe(first)
  })

  it('looks among the pending orders after the last resend', async () => {
    vi.mocked(createOrderApi).mockRejectedValue(timeout())
    vi.mocked(fetchPendingOrdersApi).mockResolvedValue([order])

    await expect(placeOrder('user-marina', body, vi.fn())).resolves.toBe(order)
    expect(createOrderApi).toHaveBeenCalledTimes(ORDER_RESENDS + 1)
  })

  it('does not resend an answer the server gave', async () => {
    const outdated = new ApiError({
      kind: 'http',
      status: 409,
      code: 'QUOTE_OUTDATED',
      message: 'A cotação expirou.',
      retryable: false,
    })
    vi.mocked(createOrderApi).mockRejectedValue(outdated)

    await expect(placeOrder('user-marina', body, vi.fn())).rejects.toBe(outdated)
    expect(createOrderApi).toHaveBeenCalledTimes(1)
  })
})
