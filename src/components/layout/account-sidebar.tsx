import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
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
import { performLogout, useSessionQuery } from '@/features/auth/queries'
import { cn } from '@/lib/utils'
import { OutOfScopeAction } from './out-of-scope'

export type AccountSection = 'profile' | 'wallets' | 'favorites'

export function AccountSidebar({ active }: { active: AccountSection }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: sessionData } = useSessionQuery()

  const handleLogout = async () => {
    await performLogout(queryClient, sessionData?.user.id)
    void navigate({ to: '/' })
  }

  return (
    <>
      {/* Mobile pill bar */}
      <nav
        aria-label="Menu da conta"
        className="flex items-center gap-2 overflow-x-auto pb-2 lg:hidden"
      >
        <Link
          to="/profile"
          aria-current={active === 'profile' ? 'page' : undefined}
          className={cn(
            'inline-flex h-9 shrink-0 items-center rounded-pill border px-4 text-sm',
            active === 'profile'
              ? 'border-primary font-bold text-highlight'
              : 'border-line text-body',
          )}
        >
          {copy.account.profileData}
        </Link>
        <Link
          to="/wallets"
          aria-current={active === 'wallets' ? 'page' : undefined}
          className={cn(
            'inline-flex h-9 shrink-0 items-center rounded-pill border px-4 text-sm',
            active === 'wallets'
              ? 'border-primary font-bold text-highlight'
              : 'border-line text-body',
          )}
        >
          {copy.account.wallets}
        </Link>
        <Link
          to="/favorites"
          aria-current={active === 'favorites' ? 'page' : undefined}
          className={cn(
            'inline-flex h-9 shrink-0 items-center rounded-pill border px-4 text-sm',
            active === 'favorites'
              ? 'border-primary font-bold text-highlight'
              : 'border-line text-body',
          )}
        >
          {copy.account.favorites}
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex h-9 shrink-0 items-center rounded-pill border border-line px-4 text-sm font-bold text-highlight"
        >
          {copy.account.signOut}
        </button>
      </nav>

      {/* Desktop 310px sidebar */}
      <aside
        aria-label="Menu da conta"
        className="hidden w-[310px] shrink-0 bg-surface py-2 lg:block"
      >
        <h2 className="px-[10px] py-2 text-lg font-bold text-foreground">
          {copy.account.sidebarTitle}
        </h2>

        <div className="mt-1 flex flex-col">
          <Link
            to="/profile"
            aria-current={active === 'profile' ? 'page' : undefined}
            className={cn(
              'flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight transition-colors hover:bg-surface-raised',
              active === 'profile' && 'border-l-[6px] border-primary pl-[10px] font-bold',
            )}
          >
            <UserIcon size={18} />
            <span>{copy.account.profileData}</span>
          </Link>

          <Link
            to="/wallets"
            aria-current={active === 'wallets' ? 'page' : undefined}
            className={cn(
              'flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight transition-colors hover:bg-surface-raised',
              active === 'wallets' && 'border-l-[6px] border-primary pl-[10px] font-bold',
            )}
          >
            <LocationIcon size={18} />
            <span>{copy.account.wallets}</span>
          </Link>

          <OutOfScopeAction className="flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight">
            <ActivityIcon size={18} />
            <span>{copy.account.activity}</span>
          </OutOfScopeAction>

          <Link
            to="/favorites"
            aria-current={active === 'favorites' ? 'page' : undefined}
            className={cn(
              'flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight transition-colors hover:bg-surface-raised',
              active === 'favorites' && 'border-l-[6px] border-primary pl-[10px] font-bold',
            )}
          >
            <HeartIcon size={18} />
            <span>{copy.account.favorites}</span>
          </Link>

          <OutOfScopeAction className="flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight">
            <BuyIcon size={18} />
            <span>{copy.account.offers}</span>
          </OutOfScopeAction>

          <OutOfScopeAction className="flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight">
            <DownloadIcon size={18} />
            <span>{copy.account.downloads}</span>
          </OutOfScopeAction>

          <OutOfScopeAction className="flex h-[45px] items-center gap-4 pl-4 text-[15px] text-highlight">
            <DangerIcon size={18} />
            <span>{copy.account.support}</span>
          </OutOfScopeAction>
        </div>

        <hr className="my-2 border-line" />

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex h-10 w-full items-center gap-4 pl-4 text-[15px] font-bold text-highlight transition-colors hover:bg-surface-raised"
        >
          <LogoutIcon size={20} />
          <span>{copy.account.signOut}</span>
        </button>
      </aside>
    </>
  )
}

export function MobilePageTopBar({ title }: { title: string }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      void navigate({ to: location.pathname === '/cart' ? '/' : '/' })
    }
  }

  return (
    <div className="grid grid-cols-[35px_1fr_35px] items-center pt-[max(24px,env(safe-area-inset-top))] lg:hidden">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Voltar"
        className="flex h-[35px] w-[35px] items-center justify-center rounded-full border border-line bg-surface-raised text-foreground"
      >
        ‹
      </button>
      <h1 className="text-center text-xl font-bold text-heading">{title}</h1>
      <span aria-hidden="true" />
    </div>
  )
}
