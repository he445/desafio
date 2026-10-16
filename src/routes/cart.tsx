import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { MobilePageTopBar } from '@/components/layout/account-sidebar'
import { RouteErrorBoundary } from '@/components/layout/route-error'

function CartPage() {
  return (
    <section className="space-y-6">
      <MobilePageTopBar title={copy.cart.titleMobile} />
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
        / <span aria-current="page">{copy.nav.cart}</span>
      </nav>
      <h1 className="hidden text-xl font-bold text-heading lg:block">{copy.cart.titleMobile}</h1>
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
