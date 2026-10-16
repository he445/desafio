import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useIsDesktop } from '@/lib/use-media-query'

function OrderDetailPage() {
  const { orderId } = Route.useParams()
  const isDesktop = useIsDesktop()

  return (
    <section className="space-y-6">
      {isDesktop ? (
        <>
          <Breadcrumb current={copy.order.breadcrumb} />
          <h1 className="text-xl font-bold text-heading">{copy.order.breadcrumb}</h1>
        </>
      ) : (
        <MobileTopBar title={copy.order.breadcrumb} />
      )}
      <p className="text-sm text-body">{orderId}</p>
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.order.breadcrumb) }],
  }),
  component: OrderDetailPage,
  errorComponent: RouteErrorBoundary,
})
