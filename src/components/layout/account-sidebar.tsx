import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import {
  ActivityIcon,
  BuyIcon,
  DangerIcon,
  DownloadIcon,
  HeartIcon,
  LocationIcon,
  LogoutIcon,
  UserIcon,
} from '@/components/icons'
import { useIsDesktop } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { OutOfScopeAction } from './out-of-scope'

export type AccountSection = 'profile' | 'wallets' | 'favorites'

const SECTIONS = [
  { id: 'profile', to: '/profile', label: copy.account.profileData },
  { id: 'wallets', to: '/wallets', label: copy.account.wallets },
  { id: 'favorites', to: '/favorites', label: copy.account.favorites },
] as const

type SidebarItem =
  { section: (typeof SECTIONS)[number]; icon: ReactNode } | { outOfScope: string; icon: ReactNode }

const SIDEBAR_ITEMS: SidebarItem[] = [
  { section: SECTIONS[0], icon: <UserIcon size={18} /> },
  { section: SECTIONS[1], icon: <LocationIcon size={18} /> },
  { outOfScope: copy.account.activity, icon: <ActivityIcon size={18} /> },
  { section: SECTIONS[2], icon: <HeartIcon size={18} /> },
  { outOfScope: copy.account.offers, icon: <BuyIcon size={18} /> },
  { outOfScope: copy.account.downloads, icon: <DownloadIcon size={18} /> },
  { outOfScope: copy.account.support, icon: <DangerIcon size={18} /> },
]

const sidebarRow = 'flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight'

interface AccountSidebarProps {
  active: AccountSection
  onSignOut: () => void
}

export function AccountSidebar({ active, onSignOut }: AccountSidebarProps) {
  const isDesktop = useIsDesktop()

  if (!isDesktop) {
    return (
      <nav
        aria-label={copy.a11y.accountNav}
        className="flex items-center gap-2 overflow-x-auto pb-2"
      >
        {SECTIONS.map((section) => (
          <Link
            key={section.id}
            to={section.to}
            aria-current={active === section.id ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 shrink-0 items-center rounded-pill border px-4 text-sm',
              active === section.id
                ? 'border-primary font-bold text-highlight'
                : 'border-line text-body',
            )}
          >
            {section.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex h-9 shrink-0 items-center rounded-pill border border-line px-4 text-sm font-bold text-highlight"
        >
          {copy.account.signOut}
        </button>
      </nav>
    )
  }

  return (
    <aside aria-label={copy.a11y.accountNav} className="w-[310px] shrink-0 bg-surface py-2">
      <h2 className="px-[10px] py-2 text-lg font-bold text-foreground">
        {copy.account.sidebarTitle}
      </h2>

      <div className="mt-1 flex flex-col">
        {SIDEBAR_ITEMS.map((item) =>
          'section' in item ? (
            <Link
              key={item.section.id}
              to={item.section.to}
              aria-current={active === item.section.id ? 'page' : undefined}
              className={cn(
                sidebarRow,
                'transition-colors hover:bg-surface-raised',
                active === item.section.id && 'border-l-[6px] border-primary pl-[10px] font-bold',
              )}
            >
              {item.icon}
              <span>{item.section.label}</span>
            </Link>
          ) : (
            <OutOfScopeAction key={item.outOfScope} className={sidebarRow}>
              {item.icon}
              <span>{item.outOfScope}</span>
            </OutOfScopeAction>
          ),
        )}
      </div>

      <hr className="my-2 border-line" />

      <button
        type="button"
        onClick={onSignOut}
        className="flex h-10 w-full items-center gap-4 pl-4 text-[15px] font-bold text-highlight transition-colors hover:bg-surface-raised"
      >
        <LogoutIcon size={20} />
        <span>{copy.account.signOut}</span>
      </button>
    </aside>
  )
}
