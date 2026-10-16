import { cloneElement, forwardRef, useId, type ComponentProps, type ReactElement } from 'react'
import { copy } from '@/content/copy'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface FormFieldProps {
  label: string
  required?: boolean
  // Fields the Figma draws without a label keep it for screen readers only.
  hideLabel?: boolean
  error?: string
  children: ReactElement<Record<string, unknown>>
}

export function FormField({ label, required, hideLabel, error, children }: FormFieldProps) {
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
        <p id={errorId} className="mt-1.5 text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

interface FieldSelectProps extends Omit<
  ComponentProps<typeof SelectTrigger>,
  'value' | 'children'
> {
  value: string
  placeholder?: string
  options: { value: string; label: string; disabled?: boolean }[]
  onValueChange: (value: string) => void
}

// The field passes id and aria attributes to the trigger, which is what the label points at.
export function FieldSelect({
  value,
  placeholder,
  options,
  onValueChange,
  disabled,
  ...triggerProps
}: FieldSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const EnsInput = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <Input ref={ref} {...props} className={cn('pr-14', className)} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
      >
        {copy.checkout.ensSuffix}
      </span>
    </div>
  ),
)
EnsInput.displayName = 'EnsInput'
