import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer bg-surface motion-reduce:animate-none motion-reduce:bg-surface',
        className,
      )}
      {...props}
    />
  )
}
