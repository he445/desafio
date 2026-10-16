import { formatEth, parseEth, type EthAmount } from '@/lib/eth'

// The slider moves in steps of 0.01 ETH. Amounts stay strings and bigint, never floats.
const STEP_WEI = 10n ** 16n

export interface PriceRange {
  min: EthAmount
  max: EthAmount
}

export interface SelectedPrice {
  minPrice?: EthAmount
  maxPrice?: EthAmount
}

export type SliderValue = [from: number, to: number]

function ethToStep(amount: EthAmount, rounding: 'floor' | 'ceil'): number {
  const wei = parseEth(amount)
  const steps = wei / STEP_WEI
  return Number(rounding === 'ceil' && wei % STEP_WEI !== 0n ? steps + 1n : steps)
}

export function stepToEth(step: number): EthAmount {
  return formatEth(BigInt(step) * STEP_WEI)
}

export function sliderBounds(range: PriceRange): SliderValue {
  const min = ethToStep(range.min, 'floor')
  return [min, Math.max(min, ethToStep(range.max, 'ceil'))]
}

export function sliderValue(range: PriceRange, selected: SelectedPrice): SliderValue {
  const [lowest, highest] = sliderBounds(range)
  const clamp = (step: number) => Math.min(highest, Math.max(lowest, step))
  const from = selected.minPrice ? clamp(ethToStep(selected.minPrice, 'floor')) : lowest
  const to = selected.maxPrice ? clamp(ethToStep(selected.maxPrice, 'ceil')) : highest
  return from <= to ? [from, to] : [to, from]
}

// A slider resting on its limits means "any price", so the URL does not carry it.
export function priceFromSlider(value: SliderValue, range: PriceRange): SelectedPrice {
  const [lowest, highest] = sliderBounds(range)
  const [from, to] = value
  return {
    minPrice: from > lowest ? stepToEth(from) : undefined,
    maxPrice: to < highest ? stepToEth(to) : undefined,
  }
}
