import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'

function CartPage() {
  return (
    <section className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-body text-[15px] font-bold">
        <Link to="/" className="hover:text-highlight">
          {copy.nav.home}
        </Link>{' '}
        / <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="text-heading text-xl font-bold">{copy.cart.titleMobile}</h1>
      <div className="rounded-card bg-surface p-8 text-center">
        <p className="text-foreground mb-4 text-lg font-bold">{copy.cart.emptyTitle}</p>
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
