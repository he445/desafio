import { Link, Navigate } from '@tanstack/react-router'
import type { Cart, Profile, Wallet } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { useSessionQuery } from '@/features/auth/queries'
import { useProfileQuery, useWalletsQuery } from '@/features/account/queries'
import { useCartQuery } from '@/features/cart/queries'
import { useResumedOrderId } from '@/features/orders/queries'
import { isApiError } from '@/lib/api-error'
import { useCheckout } from '../hooks/use-checkout'
import { CheckoutDesktop } from './checkout-desktop'
import { CheckoutMobile } from './checkout-mobile'
import { CheckoutSkeleton } from './checkout-skeleton'

type Variant = 'desktop' | 'mobile'

export function CheckoutView({ variant }: { variant: Variant }) {
  const { data: session } = useSessionQuery()
  const userId = session?.user.id
  if (!userId) return <CheckoutSkeleton variant={variant} />
  return <CheckoutLoader userId={userId} variant={variant} />
}

function CheckoutLoader({ userId, variant }: { userId: string; variant: Variant }) {
  const cartQuery = useCartQuery()
  const profileQuery = useProfileQuery(userId)
  const walletsQuery = useWalletsQuery(userId)
  const resumed = useResumedOrderId(userId)
  const queries = [cartQuery, profileQuery, walletsQuery]

  if (resumed.orderId) {
    return <Navigate to="/orders/$orderId" params={{ orderId: resumed.orderId }} replace />
  }

  const cart = cartQuery.data
  const profile = profileQuery.data
  const wallets = walletsQuery.data
  if (cart && profile && wallets && !resumed.checking) {
    if (cart.items.length === 0) return <EmptyCheckout />
    return (
      <CheckoutReady
        userId={userId}
        variant={variant}
        cart={cart}
        profile={profile}
        wallets={wallets}
      />
    )
  }

  const failed = queries.find((query) => query.isError && !query.data)
  if (!failed) return <CheckoutSkeleton variant={variant} />
  return (
    <div role="alert" className="mt-3 rounded-card bg-surface p-8 text-center">
      <h2 className="text-lg font-bold text-heading">{copy.checkout.errorTitle}</h2>
      <p className="mt-2 text-sm text-body">
        {isApiError(failed.error) ? failed.error.message : copy.states.routeErrorFallback}
      </p>
      <Button
        type="button"
        className="mt-6"
        onClick={() => {
          for (const query of queries) if (query.isError) void query.refetch()
        }}
      >
        {copy.states.retry}
      </Button>
    </div>
  )
}

function EmptyCheckout() {
  return (
    <div className="mt-3 rounded-card bg-surface p-8 text-center">
      <h2 className="text-lg font-bold text-heading">{copy.cart.emptyTitle}</h2>
      <Button asChild className="mt-6">
        <Link to="/" hash="mercado">
          {copy.cart.emptyCta}
        </Link>
      </Button>
    </div>
  )
}

interface CheckoutReadyProps {
  userId: string
  variant: Variant
  cart: Cart
  profile: Profile
  wallets: Wallet[]
}

function CheckoutReady({ userId, variant, cart, profile, wallets }: CheckoutReadyProps) {
  const checkout = useCheckout({ userId, cart, wallets })

  const quoteError = checkout.error && (
    <div role="alert" className="mt-4 rounded-card border border-line p-4 text-sm">
      <p className="font-bold text-heading">{copy.cart.quoteErrorTitle}</p>
      <p className="mt-1 text-body">
        {isApiError(checkout.error) ? checkout.error.message : copy.states.routeErrorFallback}
      </p>
      <Button type="button" variant="outline" className="mt-3" onClick={checkout.refetch}>
        {copy.states.retry}
      </Button>
    </div>
  )

  return (
    <div aria-busy={!checkout.quote || undefined} className="flex flex-1 flex-col">
      {quoteError}
      {variant === 'desktop' ? (
        <CheckoutDesktop checkout={checkout} cart={cart} profile={profile} wallets={wallets} />
      ) : (
        <CheckoutMobile checkout={checkout} cart={cart} profile={profile} wallets={wallets} />
      )}
    </div>
  )
}
