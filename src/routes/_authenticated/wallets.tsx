import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { AccountLayout } from '@/components/layout/account-layout'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { WalletsView } from '@/features/account/components/wallets-view'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'
import { ReturnSearchSchema } from '@/features/auth/search'

function WalletsPage() {
  const signOut = useSignOut()
  const { redirect } = Route.useSearch()

  return (
    <AccountLayout section="wallets" title={copy.account.wallets} onSignOut={() => void signOut()}>
      <WalletsView redirect={redirect} />
    </AccountLayout>
  )
}

export const Route = createFileRoute('/_authenticated/wallets')({
  validateSearch: ReturnSearchSchema,
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.wallets) }],
  }),
  component: WalletsPage,
  errorComponent: RouteErrorBoundary,
})
