import { Minus, Plus } from 'lucide-react'
import { copy } from '@/content/copy'
import { cn } from '@/lib/utils'

const VARIANTS = {
  detail: {
    target: 'h-[49px] w-[33px]',
    face: 'size-[26px] rounded-full bg-primary text-ink',
    glyph: 'size-4',
    value: 'px-3 text-xl/7',
  },
  bar: {
    target: 'h-[30px] w-6',
    face: 'h-[30px] w-5 rounded-md bg-primary text-ink',
    glyph: 'size-3.5',
    value: 'px-2 text-lg font-medium',
  },
  cart: {
    target: 'h-[30px] w-6',
    face: 'size-4 rounded-full bg-primary text-ink',
    glyph: 'size-2.5',
    value: 'px-2 text-[17px]/6',
  },
  cartMobile: {
    target: 'size-[30px]',
    face: 'size-6 rounded-full bg-surface-raised text-foreground',
    glyph: 'size-3',
    value: 'px-1.5 text-base',
  },
} as const

interface QuantityStepperProps {
  value: number
  min?: number
  max: number
  onChange: (next: number) => void
  variant?: keyof typeof VARIANTS
  disabled?: boolean
  label?: string
  className?: string
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  variant = 'detail',
  disabled = false,
  label = copy.detail.quantity,
  className,
}: QuantityStepperProps) {
  const styles = VARIANTS[variant]
  const button = (label: string, next: number, blocked: boolean, glyph: 'minus' | 'plus') => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || blocked}
      onClick={() => onChange(next)}
      className={cn(
        'flex shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40',
        styles.target,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('flex items-center justify-center shadow-stepper', styles.face)}
      >
        {glyph === 'minus' ? (
          <Minus className={styles.glyph} strokeWidth={3} />
        ) : (
          <Plus className={styles.glyph} strokeWidth={3} />
        )}
      </span>
    </button>
  )

  return (
    <div role="group" aria-label={label} className={cn('flex items-center', className)}>
      {button(copy.detail.decrease, value - 1, value <= min, 'minus')}
      <span aria-live="polite" className={cn('min-w-[2ch] text-center tabular-nums', styles.value)}>
        {value}
      </span>
      {button(copy.detail.increase, value + 1, value >= max, 'plus')}
    </div>
  )
}
