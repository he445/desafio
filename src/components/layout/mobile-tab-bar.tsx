import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { BuyIcon, HeartIcon, HomeIcon, ScanIcon, UserIcon } from '@/components/icons'
import { useCartQuery } from '@/features/cart/queries'
import { cn } from '@/lib/utils'

function shouldShowMobileTabBar(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/favorites') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wallets') ||
    pathname.startsWith('/orders/')
  )
}

export function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: cart } = useCartQuery()

  if (!shouldShowMobileTabBar(location.pathname)) {
    return null
  }

  const totalCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0
  const isHome = location.pathname === '/'
  const isFavorites = location.pathname.startsWith('/favorites')
  const isCart = location.pathname.startsWith('/cart')
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
          aria-current={isCart ? 'page' : undefined}
          aria-label={`Carrinho, ${totalCount} ${totalCount === 1 ? 'item' : 'itens'}`}
          className={cn(
            'relative flex h-11 w-11 items-center justify-center',
            isCart ? 'text-highlight' : 'text-body',
          )}
        >
          <BuyIcon size={20} />
          {totalCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-ink">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
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
