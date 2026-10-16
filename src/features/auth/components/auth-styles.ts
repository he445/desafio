import { cn } from '@/lib/utils'

export type AuthVariant = 'modal' | 'page'

export function authInputClass(variant: AuthVariant): string {
  return variant === 'modal' ? 'h-10 rounded-auth px-4' : 'h-[50px] rounded-mobile-field px-4'
}

export function authSubmitClass(variant: AuthVariant): string {
  return cn(
    'aria-disabled:opacity-70',
    variant === 'page' && 'h-[60px] w-full rounded-mobile-field text-base',
  )
}
