import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { AccountLayout } from '@/components/layout/account-layout'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'

function FavoritesPage() {
  const signOut = useSignOut()

  return (
    <AccountLayout
      section="favorites"
      title={copy.account.favorites}
      onSignOut={() => void signOut()}
    >
      <h2 className="text-base font-bold text-heading">{copy.account.favorites}</h2>
    </AccountLayout>
  )
}

export const Route = createFileRoute('/_authenticated/favorites')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.favorites) }],
  }),
  component: FavoritesPage,
  errorComponent: RouteErrorBoundary,
})
