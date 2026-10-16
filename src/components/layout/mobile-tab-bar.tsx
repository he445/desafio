import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { BuyIcon, HeartIcon, HomeIcon, ScanIcon, UserIcon } from '@/components/icons'
import { copy } from '@/content/copy'
import { cn } from '@/lib/utils'
import { CartBadge } from './cart-badge'

export function MobileTabBar({ cartCount }: { cartCount: number }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isHome = location.pathname === '/'
  const isFavorites = location.pathname.startsWith('/favorites')
  const isAccount =
    location.pathname.startsWith('/profile') || location.pathname.startsWith('/wallets')

  const handleScanClick = () => {
    const searchInput = document.getElementById('mobile-catalog-search')
    if (searchInput instanceof HTMLInputElement) {
      searchInput.focus()
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    void navigate({ to: '/', hash: 'mercado' })
  }

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[126px] items-end lg:hidden"
    >
      <div className="relative flex h-[94px] w-full items-center justify-around rounded-t-[32px] bg-surface px-6 shadow-sheet">
        <Link
          to="/"
          aria-current={isHome ? 'page' : undefined}
          className={cn(
            'flex h-11 w-11 items-center justify-center',
            isHome ? 'text-highlight' : 'text-body',
          )}
        >
          <span className="sr-only">Início</span>
          <HomeIcon size={20} filled={isHome} />
        </Link>

        <Link
          to="/favorites"
          aria-current={isFavorites ? 'page' : undefined}
          className={cn(
            'flex h-11 w-11 items-center justify-center',
            isFavorites ? 'text-highlight' : 'text-body',
          )}
        >
          <span className="sr-only">Lista de interesse</span>
          <HeartIcon size={20} filled={isFavorites} />
        </Link>

        <div className="-mt-12 flex items-center justify-center">
          <button
            type="button"
            onClick={handleScanClick}
            aria-label="Explorar coleções"
            className="flex h-[65px] w-[65px] items-center justify-center rounded-full bg-cta text-ink ring-[6px] ring-ink"
          >
            <ScanIcon size={24} />
          </button>
        </div>

        <Link
          to="/cart"
          aria-label={copy.nav.cartLabel(cartCount)}
          className="relative flex h-11 w-11 items-center justify-center text-body"
        >
          <BuyIcon size={20} />
          <CartBadge count={cartCount} className="top-1 right-1" />
        </Link>

        <Link
          to="/profile"
          aria-current={isAccount ? 'page' : undefined}
          className={cn(
            'flex h-11 w-11 items-center justify-center',
            isAccount ? 'text-highlight' : 'text-body',
          )}
        >
          <span className="sr-only">Conta</span>
          <UserIcon size={20} />
        </Link>
      </div>
    </nav>
  )
}
