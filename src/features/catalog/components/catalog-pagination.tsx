import { copy } from '@/content/copy'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import { NavLink } from '@/components/ui/nav-link'
import { cn } from '@/lib/utils'
import { pageLinkProps } from '../hooks/use-catalog-search'
import { buildPageList } from '../pagination'

const square =
  'flex size-[35px] items-center justify-center rounded-pagination border border-line text-lg'

interface CatalogPaginationProps {
  page: number
  totalPages: number
  className?: string
}

export function CatalogPagination({ page, totalPages, className }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label={copy.catalog.paginationLabel} className={className}>
      <ul className="flex items-center justify-center gap-2 lg:justify-end">
        {page > 1 && (
          <li>
            <NavLink
              {...pageLinkProps(page - 1)}
              aria-label={copy.catalog.previousPage}
              className={square}
            >
              <ChevronLeftIcon size={18} />
            </NavLink>
          </li>
        )}
        {buildPageList(page, totalPages).map((item) =>
          item.kind === 'gap' ? (
            <li key={item.key} aria-hidden="true" className="px-1 text-lg text-body">
              …
            </li>
          ) : (
            <li key={item.page}>
              <NavLink
                {...pageLinkProps(item.page)}
                current={item.page === page}
                aria-label={copy.catalog.page(item.page)}
                className={cn(
                  square,
                  item.page === page && 'border-primary bg-primary font-bold text-ink',
                )}
              >
                {item.page}
              </NavLink>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <NavLink
              {...pageLinkProps(page + 1)}
              aria-label={copy.catalog.nextPage}
              className={square}
            >
              <ChevronRightIcon size={18} />
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
