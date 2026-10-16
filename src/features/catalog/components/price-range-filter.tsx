import { useState } from 'react'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { formatEthNumberDisplay } from '@/lib/format'
import {
  priceFromSlider,
  sliderBounds,
  sliderValue,
  stepToEth,
  type PriceRange,
  type SelectedPrice,
  type SliderValue,
} from '../price-range'

interface PriceRangeFilterProps {
  // The cheapest and the dearest NFT of the catalog.
  range: PriceRange
  selected: SelectedPrice
  // Called on every move; the filter sheet keeps a draft until "Aplicar".
  onChange?: (price: SelectedPrice) => void
  // Shows the "Aplicar" button of the sidebar.
  onApply?: (price: SelectedPrice) => void
}

const display = (step: number) => formatEthNumberDisplay(stepToEth(step))

export function PriceRangeFilter({ range, selected, onChange, onApply }: PriceRangeFilterProps) {
  const fromProps = sliderValue(range, selected)
  const [value, setValue] = useState<SliderValue>(fromProps)
  const [seen, setSeen] = useState(fromProps.join())
  const [lowest, highest] = sliderBounds(range)

  // The URL or the sheet's draft can change the price from outside (back, clear, reset).
  if (fromProps.join() !== seen) {
    setSeen(fromProps.join())
    setValue(fromProps)
  }

  return (
    <div>
      <Slider
        min={lowest}
        max={highest}
        step={1}
        value={value}
        onValueChange={(next) => {
          const [from = lowest, to = highest] = next
          setValue([from, to])
          onChange?.(priceFromSlider([from, to], range))
        }}
        thumbLabels={[copy.catalog.priceMin, copy.catalog.priceMax]}
        thumbValueText={(step) => copy.catalog.priceValue(display(step))}
      />
      <p className="mt-3 text-[15px] text-foreground">
        {copy.catalog.priceRange(display(value[0]), display(value[1]))}
      </p>
      {onApply && (
        <Button
          type="button"
          className="mt-3 h-auto px-3 py-2 text-base"
          onClick={() => onApply(priceFromSlider(value, range))}
        >
          {copy.home.filters.apply}
        </Button>
      )}
    </div>
  )
}
