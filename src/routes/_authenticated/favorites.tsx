import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { AccountSidebar, MobilePageTopBar } from '@/components/layout/account-sidebar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'

function FavoritesPage() {
  const signOut = useSignOut()

  return (
    <section className="space-y-6 lg:space-y-0">
      <MobilePageTopBar title={copy.account.favorites} />
      <div className="lg:flex lg:items-start lg:gap-7">
        <AccountSidebar active="favorites" onSignOut={() => void signOut()} />
        <div className="flex-1">
          <h1 className="text-base font-bold text-heading">{copy.account.favorites}</h1>
        </div>
      </div>
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/favorites')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.favorites) }],
  }),
  component: FavoritesPage,
  errorComponent: RouteErrorBoundary,
})
