import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { CheckoutView } from '@/features/checkout/components/checkout-view'
import { useIsDesktop } from '@/lib/use-media-query'

function CheckoutPage() {
  const isDesktop = useIsDesktop()

  if (!isDesktop) {
    return (
      <section className="flex min-h-dvh flex-col">
        <MobileTopBar title={copy.checkout.titleMobile} />
        <CheckoutView variant="mobile" />
      </section>
    )
  }

  return (
    <section>
      <Breadcrumb current={copy.checkout.breadcrumb} />
      <h1 className="sr-only">{copy.checkout.breadcrumb}</h1>
      <CheckoutView variant="desktop" />
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/checkout')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.checkout.breadcrumb) }],
  }),
  component: CheckoutPage,
  errorComponent: RouteErrorBoundary,
})
