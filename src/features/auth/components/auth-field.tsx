import { cloneElement, useId, type ReactElement } from 'react'
import { cn } from '@/lib/utils'

interface AuthFieldProps {
  label: string
  error?: string
  // The input; it receives the id, aria-invalid and aria-describedby.
  children: ReactElement<Record<string, unknown>>
}

// The Figma shows only placeholders, so the label is visually hidden but still names the field.
export function AuthField({ label, error, children }: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className={cn('mt-1.5 text-xs text-coral')}>
          {error}
        </p>
      )}
    </div>
  )
}
