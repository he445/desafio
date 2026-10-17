import { cn } from '@/lib/utils'

export const optionRowClass = (active: boolean) =>
  cn(
    'flex h-10 w-full items-center justify-between pl-[10px] text-left text-[15px] text-body transition-colors hover:text-highlight',
    active && 'text-highlight',
  )
