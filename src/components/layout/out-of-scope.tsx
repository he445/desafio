import type { ReactNode } from 'react'
import { copy } from '@/content/copy'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface OutOfScopeActionProps {
  children: ReactNode
  className?: string
}

export function OutOfScopeAction({ children, className }: OutOfScopeActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled="true"
          className={cn('cursor-not-allowed opacity-75', className)}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copy.brand.outOfScope}</TooltipContent>
    </Tooltip>
  )
}
