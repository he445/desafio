import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { RouteErrorBoundary } from '@/components/layout/route-error'

const NftDetailSearchSchema = z.object({
  edition: z.string().optional().catch(undefined),
})

function NftDetailPage() {
  const { nftId } = Route.useParams()

  return (
    <section className="space-y-6">
      <nav aria-label={copy.a11y.breadcrumb} className="text-[15px] font-bold text-body">
        <Link to="/" className="hover:text-highlight">
          {copy.nav.home}
        </Link>{' '}
        /{' '}
        <Link to="/" hash="mercado" className="hover:text-highlight">
          {copy.nav.market}
        </Link>
      </nav>
      <h1 className="text-[28px] font-bold text-heading">{nftId}</h1>
    </section>
  )
}

function NftNotFoundPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-[28px] font-bold text-heading">{copy.states.nftNotFoundTitle}</h1>
      <Button asChild>
        <Link to="/" hash="mercado">
          {copy.states.backToMarket}
        </Link>
      </Button>
    </section>
  )
}

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: (search) => NftDetailSearchSchema.parse(search),
  head: ({ params }) => ({
    meta: [{ title: copy.meta.pageTitle(params.nftId) }],
  }),
  component: NftDetailPage,
  notFoundComponent: NftNotFoundPage,
  errorComponent: RouteErrorBoundary,
})
