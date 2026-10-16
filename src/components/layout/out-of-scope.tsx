import type { ReactNode } from 'react'
import { copy } from '@/content/copy'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface OutOfScopeActionProps {
  children: ReactNode
  className?: string
  asSpan?: boolean
}

export function OutOfScopeAction({ children, className, asSpan = false }: OutOfScopeActionProps) {
  const Tag = asSpan ? 'span' : 'button'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Tag
          type={asSpan ? undefined : 'button'}
          aria-disabled="true"
          onClick={(e) => {
            e.preventDefault()
          }}
          className={cn('cursor-not-allowed opacity-75', className)}
        >
          {children}
        </Tag>
      </TooltipTrigger>
      <TooltipContent>{copy.brand.outOfScope}</TooltipContent>
    </Tooltip>
  )
}
