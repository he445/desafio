import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { BuyIcon, LoginIcon, SearchIcon, UserIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { NavLink } from '@/components/ui/nav-link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CartBadge } from './cart-badge'
import { OutOfScopeAction } from './out-of-scope'
import { desktopContainer } from './regions'

export type ActiveNavSection = 'home' | 'market' | 'none'

function resolveHeaderConfig(pathname: string): {
  divider: boolean
  active: ActiveNavSection
} {
  if (
    pathname.startsWith('/nft/') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders/')
  ) {
    return { divider: false, active: 'market' }
  }

  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wallets') ||
    pathname.startsWith('/favorites')
  ) {
    return { divider: true, active: 'none' }
  }

  return { divider: true, active: 'home' }
}

interface SiteHeaderProps {
  signedIn: boolean
  cartCount: number
  onSignOut: () => void
}

export function SiteHeader({ signedIn, cartCount, onSignOut }: SiteHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const urlTerm = useSearch({ strict: false, select: (search) => search.q })

  const { divider, active } = resolveHeaderConfig(location.pathname)

  // The field always opens with what the URL searches for, not with the last thing typed.
  const handleSearchOpenChange = (open: boolean) => {
    if (open) setSearchTerm(urlTerm === undefined ? '' : String(urlTerm))
    setSearchOpen(open)
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    setSearchOpen(false)
    void navigate({
      to: '/',
      search: trimmed ? { q: trimmed, page: 1 } : { page: 1 },
      hash: 'mercado',
    })
  }

  return (
    <header className={cn('mt-6 w-full', divider && 'border-b border-line')}>
      <div
        className={cn(desktopContainer, 'grid h-[45px] grid-cols-[160px_1fr_auto] items-center')}
      >
        <NavLink to="/" className="text-sm font-bold tracking-[0.1em] text-foreground">
          {copy.brand.logo}
        </NavLink>

        <nav
          aria-label={copy.a11y.primaryNav}
          className="flex h-full items-center justify-center gap-10"
        >
          <NavLink
            to="/"
            current={location.pathname === '/'}
            className={cn(
              'relative flex h-full items-center text-base/4 transition-colors',
              active === 'home'
                ? 'font-bold text-highlight'
                : 'text-foreground hover:text-highlight',
            )}
          >
            {copy.nav.home}
            {active === 'home' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-[2px] bg-primary"
              />
            )}
          </NavLink>

          <NavLink
            to="/"
            hash="mercado"
            className={cn(
              'relative flex h-full items-center text-base/4 transition-colors',
              active === 'market'
                ? 'font-bold text-highlight'
                : 'text-foreground hover:text-highlight',
            )}
          >
            {copy.nav.market}
            {active === 'market' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-[2px] bg-primary"
              />
            )}
          </NavLink>

          <OutOfScopeAction className="text-base/4 text-foreground">
            {copy.nav.creators}
          </OutOfScopeAction>

          <NavLink
            to="/"
            hash="diario"
            className="flex h-full items-center text-base/4 text-foreground transition-colors hover:text-highlight"
          >
            {copy.nav.learn}
          </NavLink>
        </nav>

        <div className="flex items-center gap-7">
          <Popover open={searchOpen} onOpenChange={handleSearchOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={copy.nav.searchPlaceholder}
                className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:text-highlight"
              >
                <SearchIcon size={20} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-3">
              <form role="search" onSubmit={handleSearchSubmit}>
                <Input
                  type="search"
                  enterKeyHint="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={copy.nav.searchPlaceholder}
                  aria-label={copy.nav.searchPlaceholder}
                  className="h-9"
                />
              </form>
            </PopoverContent>
          </Popover>

          <Link
            to="/cart"
            aria-label={copy.nav.cartLabel(cartCount)}
            className="relative inline-flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:text-highlight"
          >
            <BuyIcon size={24} />
            <CartBadge count={cartCount} className="-top-1.5 -right-2" />
          </Link>

          {signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="signIn">
                  <UserIcon size={20} />
                  <span>{copy.nav.account}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">{copy.account.profileData}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallets">{copy.account.wallets}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites">{copy.account.favorites}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    onSignOut()
                  }}
                >
                  {copy.account.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="signIn">
              <Link
                to="/login"
                search={{
                  redirect:
                    location.pathname === '/login' || location.pathname === '/register'
                      ? '/'
                      : location.href,
                }}
              >
                <LoginIcon size={20} />
                <span>{copy.nav.signIn}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
