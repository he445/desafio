import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { performLogout, useSessionQuery } from '@/features/auth/queries'
import { useCartQuery } from '@/features/cart/queries'
import { cn } from '@/lib/utils'
import { OutOfScopeAction } from './out-of-scope'

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

export function SiteHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: sessionData } = useSessionQuery()
  const { data: cart } = useCartQuery()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { divider, active } = resolveHeaderConfig(location.pathname)
  const totalCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0
  const badgeText = totalCount > 9 ? '9+' : String(totalCount)

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

  const handleLogout = async () => {
    await performLogout(queryClient, sessionData?.user.id)
    if (
      location.pathname.startsWith('/checkout') ||
      location.pathname.startsWith('/orders') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/wallets') ||
      location.pathname.startsWith('/favorites')
    ) {
      void navigate({ to: '/' })
    }
  }

  return (
    <header
      className={cn(
        'mt-6 w-full',
        divider && 'border-b border-line',
      )}
    >
      <div className="mx-auto grid h-[45px] w-full max-w-[1200px] grid-cols-[160px_1fr_auto] items-center px-6 xl:px-0">
        <Link
          to="/"
          className="text-sm font-bold tracking-[0.1em] text-foreground focus-visible:outline-none"
        >
          {copy.brand.logo}
        </Link>

        <nav aria-label="Navegação principal" className="flex h-full items-center justify-center gap-10">
          <Link
            to="/"
            aria-current={location.pathname === '/' ? 'page' : undefined}
            className={cn(
              'relative flex h-full items-center text-base/4 transition-colors',
              active === 'home' ? 'font-bold text-highlight' : 'text-foreground hover:text-highlight',
            )}
          >
            {copy.nav.home}
            {active === 'home' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-[2px] bg-primary"
              />
            )}
          </Link>

          <Link
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
          </Link>

          <OutOfScopeAction className="text-base/4 text-foreground">
            {copy.nav.creators}
          </OutOfScopeAction>

          <Link
            to="/"
            hash="diario"
            className="flex h-full items-center text-base/4 text-foreground transition-colors hover:text-highlight"
          >
            {copy.nav.learn}
          </Link>
        </nav>

        <div className="flex items-center gap-7">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
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
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={copy.nav.searchPlaceholder}
                  aria-label={copy.nav.searchPlaceholder}
                  className="h-9"
                />
                <Button type="submit" size="default" className="h-9 px-3 text-xs">
                  Ir
                </Button>
              </form>
            </PopoverContent>
          </Popover>

          <Link
            to="/cart"
            aria-label={`Carrinho, ${totalCount} ${totalCount === 1 ? 'item' : 'itens'}`}
            className="relative inline-flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:text-highlight"
          >
            <BuyIcon size={24} />
            {totalCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-ink">
                {badgeText}
              </span>
            )}
          </Link>

          {sessionData ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="signIn" aria-label={copy.nav.account}>
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
                    void handleLogout()
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
