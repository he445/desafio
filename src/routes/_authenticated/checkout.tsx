import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { MobilePageTopBar } from '@/components/layout/account-sidebar'
import { RouteErrorBoundary } from '@/components/layout/route-error'

function CheckoutPage() {
  return (
    <section className="space-y-6">
      <MobilePageTopBar title={copy.checkout.titleMobile} />
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
        / <span aria-current="page">{copy.checkout.breadcrumb}</span>
      </nav>
      <h1 className="hidden text-[17px] font-bold text-heading lg:block">
        {copy.checkout.collectorProfile}
      </h1>
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
