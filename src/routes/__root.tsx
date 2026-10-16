import { useEffect } from 'react'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Announcer } from '@/components/layout/announcer'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { ScenarioPanel } from '@/components/layout/scenario-panel'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { onSessionExpired, sessionQueryOptions } from '@/features/auth/queries'
import { clearEventLedger } from '@/features/realtime/event-ledger'
import { qk } from '@/lib/query-keys'
import { clearStoredSession, saveResumeContext } from '@/lib/storage'
import { useIsDesktop } from '@/lib/use-media-query'

export interface RouterContext {
  queryClient: QueryClient
}

function RootLayout() {
  const isDesktop = useIsDesktop()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
      saveResumeContext({ href: currentHref, reason: 'expired' })
      clearStoredSession()
      clearEventLedger()
      queryClient.removeQueries({ queryKey: ['user'] })
      queryClient.removeQueries({ queryKey: ['cart'] })
      queryClient.removeQueries({ queryKey: ['quote'] })
      queryClient.setQueryData(qk.session(), null)

      void navigate({
        to: '/login',
        search: {
          redirect: currentHref.startsWith('/login') ? '/' : currentHref,
          reason: 'expired',
        },
      })
    })

    return unsubscribe
  }, [navigate, queryClient])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'nftmkt:session') {
        if (!event.newValue) {
          clearEventLedger()
          queryClient.removeQueries({ queryKey: ['user'] })
          queryClient.removeQueries({ queryKey: ['cart'] })
          queryClient.removeQueries({ queryKey: ['quote'] })
          queryClient.setQueryData(qk.session(), null)
        } else {
          void queryClient.invalidateQueries({ queryKey: qk.session() })
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  const showFooter = isDesktop || location.pathname === '/'
  const showMobileTab = !isDesktop && location.pathname === '/'

  return (
    <TooltipProvider>
      <HeadContent />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-btn focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
      >
        {copy.nav.skipToContent}
      </a>
      <div className=" flex min-h-dvh flex-col bg-ink text-foreground">
        {isDesktop && <SiteHeader />}
        <main
          id="main-content"
          className="mx-auto w-full max-w-[720px] flex-1 px-6 lg:mt-8 lg:max-w-[1248px] xl:max-w-[1200px] xl:px-0"
        >
          <Outlet />
        </main>
        {showFooter && <SiteFooter withMobileTabSpacing={showMobileTab} />}
        {!isDesktop && <MobileTabBar />}
      </div>
      <Announcer />
      <Toaster />
      <ScenarioPanel />
    </TooltipProvider>
  )
}

function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-[28px] font-bold text-heading">{copy.states.notFoundTitle}</h1>
      <Button asChild>
        <Link to="/">{copy.states.backToHome}</Link>
      </Button>
    </section>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    try {
      const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
      return { session }
    } catch {
      return { session: null }
    }
  },
  head: () => ({
    meta: [{ title: copy.meta.title }, { name: 'description', content: copy.meta.description }],
  }),
  component: RootLayout,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: NotFoundPage,
})
