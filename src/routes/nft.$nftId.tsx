import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { nftQueryOptions } from '@/features/nft/queries'
import { isApiError } from '@/lib/api-error'
import { useIsDesktop } from '@/lib/use-media-query'

const NftDetailSearchSchema = z.object({
  edition: z.string().optional().catch(undefined),
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data: nft } = useSuspenseQuery(nftQueryOptions(nftId))
  const isDesktop = useIsDesktop()

  return (
    <section className="space-y-6">
      {isDesktop && <Breadcrumb />}
      <h1 className="text-[28px] font-bold text-heading">{nft.title}</h1>
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
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(nftQueryOptions(params.nftId))
    } catch (error) {
      if (isApiError(error) && error.status === 404) throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: copy.meta.pageTitle(loaderData?.title ?? copy.states.nftNotFoundTitle) }],
  }),
  component: NftDetailPage,
  notFoundComponent: NftNotFoundPage,
  errorComponent: RouteErrorBoundary,
})
