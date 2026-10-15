import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all hover:brightness-110 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-ink font-bold rounded-btn',
        form: 'bg-primary text-ink font-bold rounded-field',
        outline:
          'border border-primary text-highlight text-sm font-medium rounded-btn bg-transparent',
        modal: 'bg-primary text-ink text-base font-bold rounded-auth',
        ctaMobile: 'bg-cta text-ink text-base font-bold rounded-pill',
        social:
          'border border-line rounded-auth text-[13px] font-medium text-body bg-transparent justify-center gap-3',
        link: 'text-highlight bg-transparent p-0 h-auto',
        circleMobile: 'rounded-full bg-surface-raised border border-line text-foreground p-0',
        ghost: 'bg-transparent text-foreground hover:text-highlight',
      },
      size: {
        default: 'h-10 px-4',
        hero: 'h-10 w-[140px]',
        detail: 'h-10 w-[130px]',
        save: 'h-10 w-[131px]',
        signIn: 'h-[35px] w-[100px] text-base font-medium gap-1.5',
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
