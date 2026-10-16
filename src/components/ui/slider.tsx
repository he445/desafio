import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, defaultValue, ...props }, ref) => {
  const thumbCount = (value ?? defaultValue ?? [0]).length

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn('relative flex w-full touch-none items-center py-2 select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[2px] w-full grow overflow-hidden rounded-full bg-primary/40">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, idx) => (
        <SliderPrimitive.Thumb
          key={idx}
          aria-label={idx === 0 ? 'Preço mínimo' : 'Preço máximo'}
          className="block h-[15px] w-[15px] rounded-full bg-primary transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName
