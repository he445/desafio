import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { AccountSidebar, MobilePageTopBar } from '@/components/layout/account-sidebar'
import { RouteErrorBoundary } from '@/components/layout/route-error'

function ProfilePage() {
  return (
    <section className="space-y-6 lg:space-y-0">
      <MobilePageTopBar title={copy.account.sidebarTitle} />
      <div className="lg:flex lg:items-start lg:gap-7">
        <AccountSidebar active="profile" />
        <div className="flex-1">
          <h1 className="text-base font-bold text-heading">{copy.checkout.collectorProfile}</h1>
        </div>
      </div>
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/profile')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.profileData) }],
  }),
  component: ProfilePage,
  errorComponent: RouteErrorBoundary,
})
