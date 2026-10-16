import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all hover:brightness-110 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-btn bg-primary font-bold text-ink',
        form: 'rounded-field bg-primary font-bold text-ink',
        outline:
          'rounded-btn border border-primary bg-transparent text-sm font-medium text-highlight',
        modal: 'rounded-auth bg-primary text-base font-bold text-ink',
        ctaMobile: 'rounded-pill bg-cta text-base font-bold text-ink',
        social:
          'justify-center gap-3 rounded-auth border border-line bg-transparent text-[13px] font-medium text-body',
        link: 'h-auto bg-transparent p-0 text-highlight',
        circleMobile: 'rounded-full border border-line bg-surface-raised p-0 text-foreground',
        ghost: 'bg-transparent text-foreground hover:text-highlight',
      },
      size: {
        default: 'h-10 px-4',
        hero: 'h-10 w-[140px]',
        detail: 'h-10 w-[130px]',
        save: 'h-10 w-[131px]',
        signIn: 'h-[35px] w-[100px] gap-1.5 text-base font-medium',
        modal: 'h-[45px] w-[340px]',
        social: 'h-10 w-[340px]',
        ctaMobile: 'h-[60px] w-full',
        circleMobile: 'h-[35px] w-[35px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
