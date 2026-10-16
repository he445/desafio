import * as React from 'react'
import { copy } from '@/content/copy'
import { HideIcon, ShowIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Input, type InputProps } from './input'

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11', className)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? copy.auth.hidePassword : copy.auth.showPassword}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <HideIcon size={20} /> : <ShowIcon size={20} />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
