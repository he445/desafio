import { useEffect } from 'react'
import { useAnnounceResults } from '../hooks/use-announce-results'
import { useCatalogNavigate, useCatalogSearch } from '../hooks/use-catalog-search'
import { useNftListQuery } from '../queries'
import { toPage } from '../search'
import { CatalogEmpty, CatalogError } from './catalog-states'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSkeleton } from './catalog-skeleton'
import { NftGrid } from './nft-grid'

// The grid, with the four states every list has: loading, refreshing, empty and failed.
export function CatalogResults() {
  const search = useCatalogSearch()
  const navigate = useCatalogNavigate()
  const { data, error, isPending, isError, isPlaceholderData, refetch } = useNftListQuery(search)

  const fresh = data && !isPlaceholderData ? data : undefined
  useAnnounceResults(JSON.stringify(search), fresh?.total)

  // A page beyond the last one (typed in the URL, or left behind by a filter that shrank
  // the list) is replaced by the last page.
  const lastPage = fresh?.totalPages
  useEffect(() => {
    if (lastPage !== undefined && search.page > lastPage) {
      navigate((prev) => toPage(prev, lastPage), { replace: true, keepScroll: true })
    }
  }, [lastPage, search.page, navigate])

  if (isError && !data) return <CatalogError error={error} onRetry={() => void refetch()} />
  if (isPending || (lastPage !== undefined && search.page > lastPage)) {
    return <CatalogSkeleton count={search.pageSize} />
  }
  if (!data) return null
  if (data.total === 0) return <CatalogEmpty />

  return (
    <div aria-busy={isPlaceholderData}>
      <NftGrid items={data.items} dimmed={isPlaceholderData} />
      <CatalogPagination
        page={data.page}
        totalPages={data.totalPages}
        className="mt-6 lg:mt-[88px]"
      />
    </div>
  )
}
