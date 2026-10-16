import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useIsDesktop } from '@/lib/use-media-query'

function CheckoutPage() {
  const isDesktop = useIsDesktop()

  return (
    <section className="space-y-6">
      {isDesktop ? (
        <>
          <Breadcrumb current={copy.checkout.breadcrumb} />
          <h1 className="sr-only">{copy.checkout.breadcrumb}</h1>
        </>
      ) : (
        <MobileTopBar title={copy.checkout.titleMobile} />
      )}
      <h2 className="text-[17px] font-bold text-heading">{copy.checkout.collectorProfile}</h2>
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
