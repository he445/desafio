import { copy } from '@/content/copy'
import { FacebookIcon, GoogleIcon } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'
import { OutOfScopeAction } from '@/components/layout/out-of-scope'
import { cn } from '@/lib/utils'

export function SocialSignIn({ variant }: { variant: 'modal' | 'page' }) {
  const button = cn(
    buttonVariants({ variant: 'social' }),
    variant === 'modal' ? 'h-10 w-[340px] max-w-full' : 'h-10 w-full',
  )
  return (
    <div>
      <div className="flex items-center gap-3 text-[13px] text-body">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span>{copy.auth.orContinueWith}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      <div
        className={cn('mt-3 flex flex-col items-center', variant === 'modal' ? 'gap-3' : 'gap-4')}
      >
        <OutOfScopeAction className={button}>
          <GoogleIcon size={20} />
          {copy.auth.continueGoogle}
        </OutOfScopeAction>
        <OutOfScopeAction className={button}>
          <FacebookIcon size={20} />
          {copy.auth.continueFacebook}
        </OutOfScopeAction>
      </div>
    </div>
  )
}
