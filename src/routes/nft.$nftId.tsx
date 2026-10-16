import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { NftDetailMobile } from '@/features/nft/components/nft-detail-mobile'
import { NftDetailSkeleton } from '@/features/nft/components/nft-detail-skeleton'
import { NftGallery } from '@/features/nft/components/nft-gallery'
import { NftInfoTabs } from '@/features/nft/components/nft-info-tabs'
import { NftPurchasePanel } from '@/features/nft/components/nft-purchase-panel'
import { RelatedNfts } from '@/features/nft/components/related-nfts'
import { useNftPurchase } from '@/features/nft/hooks/use-nft-purchase'
import { nftQueryOptions } from '@/features/nft/queries'
import { isApiError } from '@/lib/api-error'
import { useIsDesktop } from '@/lib/use-media-query'

const NftDetailSearchSchema = z.object({
  edition: z.union([z.string(), z.number()]).transform(String).optional().catch(undefined),
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { edition } = Route.useSearch()
  const { data: nft } = useSuspenseQuery(nftQueryOptions(nftId))
  const purchase = useNftPurchase(nft, edition)
  const isDesktop = useIsDesktop()

  if (!isDesktop) return <NftDetailMobile nft={nft} purchase={purchase} />

  return (
    <section>
      <Breadcrumb />
      <div className="mt-8 grid grid-cols-[minmax(0,573fr)_minmax(0,595fr)] gap-8">
        <NftGallery images={nft.images} title={nft.title} />
        <NftPurchasePanel nft={nft} purchase={purchase} />
      </div>
      <NftInfoTabs nft={nft} />
      <RelatedNfts nft={nft} />
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
  pendingComponent: NftDetailSkeleton,
  notFoundComponent: NftNotFoundPage,
  errorComponent: RouteErrorBoundary,
})
