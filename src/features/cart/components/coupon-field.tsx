import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { copy } from '@/content/copy'
import { isApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { useApplyCoupon, useRemoveCoupon } from '../queries'

const STYLES = {
  desktop: {
    field: 'h-10 rounded-field border border-primary',
    input: 'px-3 text-xs',
    apply: 'w-[102px] rounded-r-field',
  },
  mobile: {
    field: 'h-[50px] rounded-pill border border-field pl-4',
    input: 'pr-3 text-sm',
    apply: 'h-[50px] w-[97px] rounded-pill -my-px -mr-px',
  },
} as const

interface CouponFieldProps {
  appliedCode: string | null
  // Set when the quote says the applied coupon no longer holds (it expired after applying).
  appliedIssue?: string
  variant: 'desktop' | 'mobile'
}

export function CouponField({ appliedCode, appliedIssue, variant }: CouponFieldProps) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const removeRef = useRef<HTMLButtonElement>(null)
  // Focus follows the control that replaces the one just used, and only after a user action.
  const focusNext = useRef<'input' | 'remove' | null>(null)
  const inputId = useId()
  const errorId = useId()
  const issueId = useId()
  const styles = STYLES[variant]

  useEffect(() => {
    if (focusNext.current === 'remove') removeRef.current?.focus()
    if (focusNext.current === 'input') inputRef.current?.focus()
    focusNext.current = null
  }, [appliedCode])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setError(copy.validation.required)
      inputRef.current?.focus()
      return
    }
    setError(null)
    apply.mutate(trimmed, {
      onSuccess: (cart) => {
        setCode('')
        focusNext.current = 'remove'
        if (cart.couponCode) toast.success(copy.cart.couponApplied(cart.couponCode))
      },
      onError: (failure) => {
        setError(
          isApiError(failure)
            ? (failure.fieldErrors?.code?.[0] ?? failure.message)
            : copy.cart.updateFailed,
        )
        inputRef.current?.focus()
      },
    })
  }

  const removeCoupon = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        focusNext.current = 'input'
      },
      onError: (failure) =>
        toast.error(isApiError(failure) ? failure.message : copy.cart.updateFailed),
    })
  }

  return (
    <div className={variant === 'desktop' ? 'mt-6' : undefined}>
      <label
        htmlFor={inputId}
        className={cn('text-sm font-bold text-heading', variant === 'mobile' && 'sr-only')}
      >
        {copy.cart.promoLabel}
      </label>
      {appliedCode ? (
        <div className={cn('flex flex-wrap items-center gap-x-2', variant === 'desktop' && 'mt-2')}>
          <p
            className="inline-flex h-10 items-center gap-2 rounded-pill border border-primary px-4 text-sm"
            aria-describedby={appliedIssue ? issueId : undefined}
          >
            <span className="sr-only">{copy.cart.couponApplied(appliedCode)}</span>
            <span aria-hidden="true" className="font-bold text-highlight">
              {appliedCode}
            </span>
            <span aria-hidden="true">·</span>
            <button
              ref={removeRef}
              type="button"
              onClick={removeCoupon}
              disabled={remove.isPending}
              aria-label={copy.cart.removeCouponLabel(appliedCode)}
              className="font-medium text-foreground underline underline-offset-2 hover:text-highlight disabled:opacity-40"
            >
              {copy.cart.removeCoupon}
            </button>
          </p>
          {appliedIssue && (
            <p id={issueId} className="mt-2 w-full text-sm text-coral">
              {appliedIssue}
            </p>
          )}
        </div>
      ) : (
        <form noValidate onSubmit={submit} className={cn(variant === 'desktop' && 'mt-2')}>
          <div
            className={cn(
              'flex items-center focus-within:ring-2 focus-within:ring-primary/40',
              styles.field,
            )}
          >
            <input
              ref={inputRef}
              id={inputId}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={copy.cart.promoPlaceholder}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                'h-full min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none',
                styles.input,
              )}
            />
            <button
              type="submit"
              disabled={apply.isPending}
              className={cn(
                'h-full shrink-0 bg-primary text-[15px] font-bold text-ink disabled:opacity-60',
                styles.apply,
              )}
            >
              {copy.cart.apply}
            </button>
          </div>
          {error && (
            <p id={errorId} className="mt-2 text-sm text-coral">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
