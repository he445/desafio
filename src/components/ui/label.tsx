import * as React from 'react'
import { Label as LabelPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    requiredMark?: boolean
  }
>(({ className, children, requiredMark, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'flex h-[29px] items-center justify-between text-[15px]/[15px] text-foreground',
      className,
    )}
    {...props}
  >
    <span>{children}</span>
    {requiredMark && (
      <span aria-hidden="true" className="text-[22px] text-coral">
        *
      </span>
    )}
  </LabelPrimitive.Root>
))
Label.displayName = LabelPrimitive.Root.displayName
