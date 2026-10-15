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
        className="focus:rounded-btn focus:bg-primary focus:text-ink sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:font-bold"
      >
        {copy.nav.skipToContent}
      </a>
      <div className="bg-ink text-foreground min-h-dvh">
        <header className="border-line border-b">
          <div className="mx-auto flex h-[45px] w-full max-w-[1200px] items-center justify-between px-6 lg:px-0">
            <Link to="/" className="text-foreground text-sm font-bold tracking-[0.1em]">
              {copy.brand.logo}
            </Link>
            <nav aria-label="Principal" className="flex items-center gap-6">
              <Link
                to="/"
                className="text-foreground [&.active]:text-highlight text-base/4 [&.active]:font-bold"
              >
                {copy.nav.home}
              </Link>
              <Link
                to="/cart"
                className="text-foreground [&.active]:text-highlight text-base/4 [&.active]:font-bold"
              >
                Carrinho
              </Link>
            </nav>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-0">
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
      <h1 className="text-heading text-[28px] font-bold">{copy.states.notFoundTitle}</h1>
      <Button asChild>
        <Link to="/">{copy.states.backToHome}</Link>
      </Button>
    </section>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: 'Kurio — Marketplace de NFTs' },
      {
        name: 'description',
        content: 'Descubra NFTs selecionados de criadores emergentes e consagrados na Kurio.',
      },
    ],
  }),
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
