import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useIsDesktop } from '@/lib/use-media-query'

function CartPage() {
  const isDesktop = useIsDesktop()

  return (
    <section className="space-y-6">
      {isDesktop ? (
        <>
          <Breadcrumb current={copy.nav.cart} />
          <h1 className="text-xl font-bold text-heading">{copy.cart.titleMobile}</h1>
        </>
      ) : (
        <MobileTopBar title={copy.cart.titleMobile} />
      )}
    </section>
  )
}

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.cart.titleMobile) }],
  }),
  component: CartPage,
  errorComponent: RouteErrorBoundary,
})
