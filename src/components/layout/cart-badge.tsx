import { cn } from '@/lib/utils'

export function CartBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-ink',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
