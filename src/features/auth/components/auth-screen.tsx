import type { ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { HomeDesktop } from '@/features/catalog/components/home-desktop'
import { useIsDesktop } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { SocialSignIn } from './social-sign-in'

type AuthMode = 'login' | 'register'

interface AuthScreenProps {
  mode: AuthMode
  redirect?: string
  expired?: boolean
}

function ExpiredBanner() {
  return (
    <p
      role="status"
      className="mb-3 rounded-field border border-coral p-3 text-left text-sm text-coral"
    >
      {copy.auth.sessionExpiredBanner}
    </p>
  )
}

function AuthTabs({ mode, redirect }: { mode: AuthMode; redirect?: string }) {
  const tab = (active: boolean) =>
    cn('text-xl/4 font-medium', active ? 'text-highlight' : 'text-foreground hover:text-highlight')
  return (
    <nav aria-label={copy.auth.signIn} className="flex items-center justify-center gap-2">
      <Link
        to="/login"
        search={{ redirect }}
        replace
        aria-current={mode === 'login' ? 'page' : undefined}
        className={tab(mode === 'login')}
      >
        {copy.auth.signIn}
      </Link>
      <span aria-hidden="true" className="h-5 w-px bg-coral" />
      <Link
        to="/register"
        search={{ redirect }}
        replace
        aria-current={mode === 'register' ? 'page' : undefined}
        className={tab(mode === 'register')}
      >
        {copy.auth.createAccount}
      </Link>
    </nav>
  )
}

function AuthDialog({ mode, redirect, expired }: AuthScreenProps) {
  const router = useRouter()

  // Closing returns to the page that sent the person here, unless that page needs the
  // session they did not start: then the home page.
  const close = () => {
    const target = redirect ?? '/'
    const needsSession = router
      .matchRoutes(target.split(/[?#]/)[0] ?? '/', {})
      .some((match) => match.routeId.startsWith('/_authenticated'))
    void router.navigate({ href: needsSession ? '/' : target })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="top-[min(160px,50%)] max-w-[500px] translate-y-0 [@media(max-height:820px)]:top-1/2 [@media(max-height:820px)]:-translate-y-1/2">
        <div className="px-20 pt-12 pb-14">
          <DialogTitle asChild>
            <h1 className="sr-only">
              {mode === 'login' ? copy.auth.signIn : copy.auth.createAccount}
            </h1>
          </DialogTitle>
          <AuthTabs mode={mode} redirect={redirect} />
          <DialogDescription className="mx-auto mt-5 max-w-[404px] text-center">
            {mode === 'login' ? copy.auth.signInSubtitle : copy.auth.registerSubtitle}
          </DialogDescription>
          <div className="mt-6">
            {expired && <ExpiredBanner />}
            {mode === 'login' ? (
              <LoginForm variant="modal" redirect={redirect} />
            ) : (
              <RegisterForm variant="modal" redirect={redirect} />
            )}
          </div>
          <div className="mt-6">
            <SocialSignIn variant="modal" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AuthPage({ mode, redirect, expired }: AuthScreenProps) {
  const switchLink: ReactNode =
    mode === 'login' ? (
      <>
        {copy.auth.newToKurio}{' '}
        <Link
          to="/register"
          search={{ redirect }}
          replace
          className="text-highlight underline underline-offset-2"
        >
          {copy.auth.createAnAccountLink}
        </Link>
      </>
    ) : (
      <>
        {copy.auth.alreadyHaveAccount}{' '}
        <Link
          to="/login"
          search={{ redirect }}
          replace
          className="text-highlight underline underline-offset-2"
        >
          {copy.auth.signInLink}
        </Link>
      </>
    )

  return (
    <section className="px-1 pt-20 pb-10">
      <p
        aria-hidden="true"
        className="flex h-[136px] items-center justify-center text-[32px] font-bold tracking-[0.1em] text-heading"
      >
        {copy.brand.logo}
      </p>
      <h1 className="mt-10 text-center text-xl font-bold text-heading">
        {mode === 'login' ? copy.auth.signIn : copy.auth.createCollectorProfile}
      </h1>
      <div className="mt-10">
        {expired && <ExpiredBanner />}
        {mode === 'login' ? (
          <LoginForm variant="page" redirect={redirect} />
        ) : (
          <RegisterForm variant="page" redirect={redirect} />
        )}
      </div>
      <div className="mt-10">
        <SocialSignIn variant="page" />
      </div>
      <p className="mt-10 text-center text-[15px] text-body">{switchLink}</p>
    </section>
  )
}

// On desktop the forms open as a dialog over the home page, which stays rendered and inert
// behind it; on phones they are full screens.
export function AuthScreen(props: AuthScreenProps) {
  const isDesktop = useIsDesktop()
  if (!isDesktop) return <AuthPage {...props} />
  return (
    <>
      <HomeDesktop />
      <AuthDialog {...props} />
    </>
  )
}
