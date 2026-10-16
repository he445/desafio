import { describe, expect, it } from 'vitest'
import {
  displayDiscount,
  displayEth,
  displayQuantity,
  displayTokenId,
  formatFacetCount,
  formatReceiptDate,
  shortenAddress,
} from './format'

describe('format helpers', () => {
  it('formats ETH with 2 to 4 decimals and dot separator', () => {
    expect(displayEth('1.19')).toBe('1.19 ETH')
    expect(displayEth('1.2')).toBe('1.20 ETH')
    expect(displayEth('0.016')).toBe('0.016 ETH')
    expect(displayEth('26.846')).toBe('26.846 ETH')
    expect(displayEth('0')).toBe('0.00 ETH')
    expect(displayEth('1.23456')).toBe('1.2346 ETH')
  })

  it('formats discounts, quantities, token IDs, addresses, and dates', () => {
    expect(displayDiscount('0')).toBe('(-) 0.00 ETH')
    expect(displayDiscount('0.12')).toBe('(-) 0.12 ETH')
    expect(displayQuantity(2)).toBe('(x 2)')
    expect(displayTokenId('42')).toBe('#0042')
    expect(displayTokenId('#0042')).toBe('#0042')
    expect(shortenAddress('0xA91F3b7C2d9E0f4A6b8C1d3E5f7A9b0C2d4EE82C')).toBe('0xA91F…E82C')
    expect(formatReceiptDate('2026-07-29T12:00:00.000Z')).toBe('29 Jul, 2026')
    expect(formatFacetCount(33)).toBe('(33)')
  })
})
