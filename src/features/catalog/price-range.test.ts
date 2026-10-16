import { describe, expect, it } from 'vitest'
import { priceFromSlider, sliderBounds, sliderValue, stepToEth } from './price-range'

const seedRange = { min: '0.02', max: '12.3' }

describe('price range slider', () => {
  it('counts the catalog limits in steps of 0.01 ETH', () => {
    expect(sliderBounds(seedRange)).toEqual([2, 1230])
  })

  it('rounds the limits outward so no listed price falls outside the slider', () => {
    expect(sliderBounds({ min: '0.025', max: '1.234' })).toEqual([2, 124])
  })

  it('writes steps back as exact ETH amounts', () => {
    expect(stepToEth(2)).toBe('0.02')
    expect(stepToEth(50)).toBe('0.5')
    expect(stepToEth(1230)).toBe('12.3')
    expect(stepToEth(10)).toBe('0.1')
  })

  it('rests on the limits when the URL has no price', () => {
    expect(sliderValue(seedRange, {})).toEqual([2, 1230])
  })

  it('reads the selected prices and keeps them inside the limits', () => {
    expect(sliderValue(seedRange, { minPrice: '0.5', maxPrice: '3' })).toEqual([50, 300])
    expect(sliderValue(seedRange, { minPrice: '0.001', maxPrice: '99' })).toEqual([2, 1230])
    expect(sliderValue(seedRange, { minPrice: '5' })).toEqual([500, 1230])
  })

  it('swaps the thumbs when the URL has the range upside down', () => {
    expect(sliderValue(seedRange, { minPrice: '5', maxPrice: '1' })).toEqual([100, 500])
  })

  it('leaves out of the URL a price that matches the limit', () => {
    expect(priceFromSlider([2, 1230], seedRange)).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
    })
    expect(priceFromSlider([50, 1230], seedRange)).toEqual({
      minPrice: '0.5',
      maxPrice: undefined,
    })
    expect(priceFromSlider([2, 300], seedRange)).toEqual({
      minPrice: undefined,
      maxPrice: '3',
    })
    expect(priceFromSlider([100, 250], seedRange)).toEqual({
      minPrice: '1',
      maxPrice: '2.5',
    })
  })
})
