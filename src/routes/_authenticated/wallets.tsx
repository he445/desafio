import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { AccountLayout } from '@/components/layout/account-layout'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'

function WalletsPage() {
  const signOut = useSignOut()

  return (
    <AccountLayout section="wallets" title={copy.account.wallets} onSignOut={() => void signOut()}>
      <h2 className="text-[17px] font-bold text-heading">{copy.account.primaryWallet}</h2>
    </AccountLayout>
  )
}

export const Route = createFileRoute('/_authenticated/wallets')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.wallets) }],
  }),
  component: WalletsPage,
  errorComponent: RouteErrorBoundary,
})
