import type { CatalogTab } from '@/contracts'
import { copy } from '@/content/copy'
import { NavLink } from '@/components/ui/nav-link'
import { cn } from '@/lib/utils'
import { catalogLinkProps } from '../hooks/use-catalog-search'

export function CatalogTabs({ tab }: { tab: CatalogTab }) {
  return (
    <nav aria-label={copy.catalog.tabsLabel}>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-3 min-[414px]:gap-x-4 lg:gap-x-5">
        {copy.home.tabs.map((item) => {
          const active = item.id === tab
          return (
            <li key={item.id}>
              <NavLink
                {...catalogLinkProps({ tab: item.id })}
                current={active ? 'true' : false}
                className={cn(
                  'relative block text-sm/[18px] whitespace-nowrap transition-colors hover:text-highlight lg:text-[15px]/[18px] lg:font-medium',
                  active && 'font-bold text-highlight',
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-6 h-[2px] bg-primary"
                  />
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
