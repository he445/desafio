import { useQuery } from '@tanstack/react-query'
import { DEFAULT_CATALOG_SEARCH, type Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { NftCarouselSection } from '@/features/catalog/components/nft-carousel-section'
import { nftListQueryOptions } from '@/features/catalog/queries'

export function RelatedNfts({ nft }: { nft: Nft }) {
  const { data } = useQuery(
    nftListQueryOptions({ ...DEFAULT_CATALOG_SEARCH, collection: nft.collection.id, pageSize: 15 }),
  )
  const items = data?.items.filter((item) => item.id !== nft.id) ?? []
  return <NftCarouselSection title={copy.detail.moreFromCollection} items={items} />
}
