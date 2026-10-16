import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { MobilePageTopBar } from '@/components/layout/account-sidebar'
import { RouteErrorBoundary } from '@/components/layout/route-error'

function OrderDetailPage() {
  const { orderId } = Route.useParams()

  return (
    <section className="space-y-6">
      <MobilePageTopBar title={copy.order.breadcrumb} />
      <nav
        aria-label={copy.a11y.breadcrumb}
        className="hidden text-[15px] font-bold text-body lg:block"
      >
        <Link to="/" className="hover:text-highlight">
          {copy.nav.home}
        </Link>{' '}
        /{' '}
        <Link to="/" hash="mercado" className="hover:text-highlight">
          {copy.nav.market}
        </Link>{' '}
        / <span aria-current="page">{copy.order.breadcrumb}</span>
      </nav>
      <h1 className="text-xl font-bold text-heading">{orderId}</h1>
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
