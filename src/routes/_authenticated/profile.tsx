import { createFileRoute } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { AccountLayout } from '@/components/layout/account-layout'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { ProfileView } from '@/features/account/components/profile-view'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'

function ProfilePage() {
  const signOut = useSignOut()

  return (
    <AccountLayout
      section="profile"
      title={copy.account.sidebarTitle}
      onSignOut={() => void signOut()}
    >
      <ProfileView />
    </AccountLayout>
  )
}

export const Route = createFileRoute('/_authenticated/profile')({
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.account.profileData) }],
  }),
  component: ProfilePage,
  errorComponent: RouteErrorBoundary,
})
