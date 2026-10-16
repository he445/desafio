import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { isApiError } from '@/lib/api-error'
import { clearCatalogFilters, hasActiveFilters } from '../search'
import { useCatalogSearch } from '../hooks/use-catalog-search'

export function CatalogEmpty() {
  const search = useCatalogSearch()

  return (
    <div className="rounded-card bg-surface p-10 text-center">
      <h2 className="text-lg font-bold text-heading">{copy.states.emptyCatalogTitle}</h2>
      <p className="mt-2 text-sm text-body">{copy.states.emptyCatalogSubtitle}</p>
      {hasActiveFilters(search) && (
        <Button asChild className="mt-6">
          <NavLink from="/" to="/" search={(prev) => clearCatalogFilters(prev)} hash="mercado">
            {copy.home.filters.clearFilters}
          </NavLink>
        </Button>
      )}
    </div>
  )
}

export function CatalogError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-card bg-surface p-10 text-center">
      <h2 className="text-lg font-bold text-heading">{copy.catalog.errorTitle}</h2>
      <p className="mt-2 text-sm text-body">
        {isApiError(error) ? error.message : copy.states.routeErrorFallback}
      </p>
      <Button type="button" className="mt-6" onClick={onRetry}>
        {copy.states.retry}
      </Button>
    </div>
  )
}
