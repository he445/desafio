import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { AlsoViewed, CartView } from '@/features/cart/components/cart-view'
import { useIsDesktop } from '@/lib/use-media-query'

function CartPage() {
  const isDesktop = useIsDesktop()

  if (!isDesktop) {
    return (
      <section className="flex min-h-dvh flex-col">
        <MobileTopBar title={copy.cart.titleMobile} />
        <CartView variant="mobile" />
      </section>
    )
  }

  return (
    <section>
      <Breadcrumb current={copy.nav.cart} />
      <h1 className="sr-only">{copy.cart.titleMobile}</h1>
      <CartView variant="desktop" />
      <AlsoViewed />
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
