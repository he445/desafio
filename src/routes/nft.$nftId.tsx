import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useIsDesktop } from '@/lib/use-media-query'

const NftDetailSearchSchema = z.object({
  edition: z.string().optional().catch(undefined),
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const isDesktop = useIsDesktop()

  return (
    <section className="space-y-6">
      {isDesktop && <Breadcrumb />}
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
  validateSearch: NftDetailSearchSchema,
  head: ({ params }) => ({
    meta: [{ title: copy.meta.pageTitle(params.nftId) }],
  }),
  component: NftDetailPage,
  notFoundComponent: NftNotFoundPage,
  errorComponent: RouteErrorBoundary,
})
