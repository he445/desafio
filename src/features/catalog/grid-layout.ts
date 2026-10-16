import { cn } from '@/lib/utils'

export function gridClassName(columns: 2 | 3): string {
  return cn(
    'grid gap-x-4 gap-y-6 pb-8 lg:gap-x-[34px] lg:gap-y-[72px] lg:pb-0',
    columns === 3 ? 'grid-cols-3' : 'grid-cols-2',
  )
}

// On small screens every other column starts 32 px lower. A translate keeps the list in
// reading order, which a pair of independent columns would not.
export function staggerClassName(index: number, columns: 2 | 3, isDesktop: boolean) {
  return !isDesktop && index % columns === 1 ? 'translate-y-8' : undefined
}
