import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { AccountSidebar, MobilePageTopBar } from '@/components/layout/account-sidebar'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'

function WalletsPage() {
  const signOut = useSignOut()

  return (
    <section className="space-y-6 lg:space-y-0">
      <MobilePageTopBar title={copy.account.wallets} />
      <div className="lg:flex lg:items-start lg:gap-7">
        <AccountSidebar active="wallets" onSignOut={() => void signOut()} />
        <div className="flex-1">
          <h1 className="text-[17px] font-bold text-heading">{copy.account.primaryWallet}</h1>
        </div>
      </div>
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/wallets')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.wallets) }],
  }),
  component: WalletsPage,
  errorComponent: RouteErrorBoundary,
})
