import { createRootRouteWithContext, HeadContent, Link, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export interface RouterContext {
  queryClient: QueryClient
}

function RootLayout() {
  return (
    <TooltipProvider>
      <HeadContent />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-btn focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
      >
        {copy.nav.skipToContent}
      </a>
      <div className="min-h-dvh bg-ink text-foreground">
        <header className="border-b border-line">
          <div className="mx-auto flex h-[45px] w-full max-w-[720px] items-center justify-between px-6 lg:max-w-[1248px]">
            <Link to="/" className="text-sm font-bold tracking-[0.1em] text-foreground">
              {copy.brand.logo}
            </Link>
            <nav aria-label={copy.a11y.primaryNav} className="flex items-center gap-6">
              <Link
                to="/"
                className="text-base/4 text-foreground [&.active]:font-bold [&.active]:text-highlight"
              >
                {copy.nav.home}
              </Link>
              <Link
                to="/cart"
                className="text-base/4 text-foreground [&.active]:font-bold [&.active]:text-highlight"
              >
                {copy.nav.cart}
              </Link>
            </nav>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[720px] px-6 py-8 lg:max-w-[1248px]"
        >
          <Outlet />
        </main>
      </div>
      <Toaster />
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
  head: () => ({
    meta: [{ title: copy.meta.title }, { name: 'description', content: copy.meta.description }],
  }),
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
