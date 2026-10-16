import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'

function CartPage() {
  return (
    <section className="space-y-6">
      <nav aria-label={copy.a11y.breadcrumb} className="text-[15px] font-bold text-body">
        <Link to="/" className="hover:text-highlight">
          {copy.nav.home}
        </Link>{' '}
        / <span aria-current="page">{copy.nav.cart}</span>
      </nav>
      <h1 className="text-xl font-bold text-heading">{copy.cart.titleMobile}</h1>
    </section>
  )
}

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.cart.titleMobile) }],
  }),
  component: CartPage,
})
