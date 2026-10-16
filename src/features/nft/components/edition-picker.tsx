import { useId } from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import type { Edition } from '@/contracts'
import { copy } from '@/content/copy'
import { displayEth } from '@/lib/format'
import { cn } from '@/lib/utils'

interface EditionPickerProps {
  editions: Edition[]
  selected: Edition | undefined
  requestedUnavailable: boolean
  onSelect: (editionId: string) => void
  className?: string
}

export function EditionPicker({
  editions,
  selected,
  requestedUnavailable,
  onSelect,
  className,
}: EditionPickerProps) {
  const labelId = useId()

  return (
    <div className={className}>
      <h2 id={labelId} className="text-[15px] font-bold text-foreground">
        {copy.detail.editionLabel}
      </h2>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        value={selected?.id ?? ''}
        onValueChange={onSelect}
        orientation="horizontal"
        className="mt-2 flex flex-wrap gap-3 lg:mt-3 lg:gap-1.5"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          return (
            <RadioGroupPrimitive.Item
              key={edition.id}
              value={edition.id}
              disabled={soldOut}
              className={cn(
                'h-7 rounded-full border border-line px-1.5 text-sm text-body transition-colors',
                'data-[state=checked]:border-primary data-[state=checked]:font-medium data-[state=checked]:text-highlight',
                'disabled:cursor-not-allowed disabled:text-muted-foreground',
              )}
            >
              <span className={cn(soldOut && 'line-through')}>{edition.name}</span>
              {soldOut ? (
                <span> · {copy.detail.soldOut}</span>
              ) : (
                <span className="sr-only"> · {displayEth(edition.price)}</span>
              )}
            </RadioGroupPrimitive.Item>
          )
        })}
      </RadioGroupPrimitive.Root>
      <p className="mt-2 text-xs text-body">
        {selected ? copy.detail.stock(selected.supply, selected.available) : copy.detail.allSoldOut}
      </p>
      {requestedUnavailable && (
        <p role="status" className="mt-2 text-sm font-medium text-coral">
          {copy.detail.editionUnavailable}
        </p>
      )}
    </div>
  )
}
