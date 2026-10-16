import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'

function CartPage() {
  return (
    <section className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-[15px] font-bold text-body">
        <Link to="/" className="hover:text-highlight">
          {copy.nav.home}
        </Link>{' '}
        / <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="text-xl font-bold text-heading">{copy.cart.titleMobile}</h1>
      <div className="rounded-card bg-surface p-8 text-center">
        <p className="mb-4 text-lg font-bold text-foreground">{copy.cart.emptyTitle}</p>
        <Button asChild variant="outline">
          <Link to="/">{copy.cart.emptyCta}</Link>
        </Button>
      </div>
    </section>
  )
}

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [{ title: 'Carrinho de NFTs | Kurio' }],
  }),
  component: CartPage,
})
