import { describe, expect, it } from 'vitest'
import {
  addEth,
  calculateFixedDiscount,
  calculatePercentDiscount,
  calculateQuoteTotals,
  compareEth,
  formatEth,
  multiplyEth,
  parseEth,
  subtractEth,
} from './eth'

describe('eth arithmetic', () => {
  it('round-trips decimal strings to wei and back without precision loss', () => {
    const samples = [
      '0',
      '0.001',
      '0.002',
      '0.016',
      '0.02',
      '0.39',
      '0.79',
      '0.99',
      '1.19',
      '1.2',
      '1.25',
      '1.39',
      '1.69',
      '1.79',
      '1.99',
      '2.29',
      '12.3',
      '26.846',
      '0.123456789012345678',
    ]

    for (const s of samples) {
      expect(formatEth(parseEth(s))).toBe(s)
    }
  })

  it('avoids IEEE-754 floating point drift on 0.1 + 0.2', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3')
  })

  it('rejects malformed ETH strings', () => {
    expect(() => parseEth('')).toThrow()
    expect(() => parseEth('-1')).toThrow()
    expect(() => parseEth('01.2')).toThrow()
    expect(() => parseEth('1,25')).toThrow()
    expect(() => parseEth('0.1234567890123456789')).toThrow()
  })

  it('calculates line totals, percent discounts, fixed discounts, and quote totals', () => {
    expect(multiplyEth('1.19', 2)).toBe('2.38')
    expect(calculatePercentDiscount('2.38', 1000)).toBe('0.238')
    expect(calculateFixedDiscount('0.49', '0.05', '0.5')).toBe('0')
    expect(calculateFixedDiscount('0.5', '0.05', '0.5')).toBe('0.05')
    expect(subtractEth('1.0', '2.5')).toBe('0')
    expect(compareEth('1.19', '1.2')).toBe(-1)

    const quote = calculateQuoteTotals({
      lineTotals: ['2.38', '0.79'],
      discount: '0.317',
      networkFee: '0.016',
    })
    expect(quote).toEqual({
      subtotal: '3.17',
      discount: '0.317',
      networkFee: '0.016',
      total: '2.869',
    })
  })
})
