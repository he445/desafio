import { cloneElement, useId, type ReactElement } from 'react'
import { Label } from '@/components/ui/label'

interface CheckoutFieldProps {
  label: string
  required?: boolean
  // Fields the Figma draws without a label keep it for screen readers only.
  hideLabel?: boolean
  error?: string
  children: ReactElement<Record<string, unknown>>
}

export function CheckoutField({ label, required, hideLabel, error, children }: CheckoutFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div>
      {hideLabel ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : (
        <Label htmlFor={id} requiredMark={required}>
          {label}
        </Label>
      )}
      <div className={hideLabel ? 'mt-[29px]' : undefined}>
        {cloneElement(children, {
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? errorId : undefined,
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
