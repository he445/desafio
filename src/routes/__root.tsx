import { lazy, Suspense } from 'react'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Announcer } from '@/components/layout/announcer'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { desktopContainer, hasMobileTabBar } from '@/components/layout/regions'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { useSessionSync } from '@/features/auth/hooks/use-session-sync'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'
import { sessionQueryOptions, useSessionQuery } from '@/features/auth/queries'
import { useCartItemCount } from '@/features/cart/queries'
import { RealtimeConnection } from '@/features/realtime/components/realtime-connection'
import { useIsDesktop } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

// Mock tooling stays out of the initial bundle and out of the page when tests hide it.
const ScenarioPanel = lazy(() => import('@/components/layout/scenario-panel'))
const showScenarioPanel =
  import.meta.env.VITE_API_MOCKING === 'enabled' && !window.__hideScenarioPanel

export interface RouterContext {
  queryClient: QueryClient
}

function RootLayout() {
  const isDesktop = useIsDesktop()
  const location = useLocation()
  const { data: session } = useSessionQuery()
  const cartCount = useCartItemCount()
  const signOut = useSignOut()
  useSessionSync()

  const showFooter = isDesktop || location.pathname === '/'
  const showTabBar = !isDesktop && hasMobileTabBar(location.pathname)

  return (
    <TooltipProvider>
      <HeadContent />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-btn focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
      >
        {copy.nav.skipToContent}
      </a>
      <div className="flex min-h-dvh flex-col bg-ink text-foreground">
        {isDesktop && (
          <SiteHeader
            signedIn={Boolean(session)}
            cartCount={cartCount}
            onSignOut={() => void signOut()}
          />
        )}
        <main
          id="main-content"
          className={cn(
            'mx-auto w-full max-w-[720px] flex-1 px-6 lg:mt-8',
            desktopContainer,
            showTabBar && !showFooter && 'pb-[150px]',
          )}
        >
          <Outlet />
        </main>
        {showFooter && <SiteFooter withMobileTabSpacing={showTabBar} />}
        {showTabBar && <MobileTabBar cartCount={cartCount} />}
      </div>
      <Announcer />
      <RealtimeConnection />
      <Toaster />
      {showScenarioPanel && (
        <Suspense fallback={null}>
          <ScenarioPanel />
        </Suspense>
      )}
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
