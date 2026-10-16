import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { AccountLayout } from '@/components/layout/account-layout'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'
import { CatalogSkeleton } from '@/features/catalog/components/catalog-skeleton'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { useFavoritesQuery } from '@/features/favorites/queries'
import { isApiError } from '@/lib/api-error'

function FavoritesContent() {
  const { data, error, isPending, isFetching, refetch } = useFavoritesQuery()

  if (isPending) {
    return <CatalogSkeleton count={3} label={copy.favorites.loading} withPagination={false} />
  }
  if (error) {
    return (
      <div role="alert" className="rounded-card bg-surface p-8 text-center">
        <h3 className="text-lg font-bold text-heading">{copy.favorites.errorTitle}</h3>
        <p className="mt-2 text-sm text-body">
          {isApiError(error) ? error.message : copy.states.routeErrorFallback}
        </p>
        <Button type="button" className="mt-6" onClick={() => void refetch()}>
          {copy.states.retry}
        </Button>
      </div>
    )
  }
  if (data.items.length === 0) {
    return (
      <div className="rounded-card bg-surface p-8 text-center">
        <p className="text-sm text-body">{copy.favorites.empty}</p>
        <Button asChild className="mt-6">
          <Link to="/" hash="mercado">
            {copy.favorites.explore}
          </Link>
        </Button>
      </div>
    )
  }
  return (
    <div aria-busy={isFetching || undefined}>
      <NftGrid items={data.items} label={copy.account.favorites} />
    </div>
  )
}

function FavoritesPage() {
  const signOut = useSignOut()

  return (
    <AccountLayout
      section="favorites"
      title={copy.account.favorites}
      onSignOut={() => void signOut()}
    >
      <h2 className="mb-6 hidden text-base font-bold text-heading lg:block">
        {copy.account.favorites}
      </h2>
      <FavoritesContent />
    </AccountLayout>
  )
}

export const Route = createFileRoute('/_authenticated/favorites')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.favorites) }],
  }),
  component: FavoritesPage,
  errorComponent: RouteErrorBoundary,
})
