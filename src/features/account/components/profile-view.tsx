import { copy } from '@/content/copy'
import { useSessionQuery } from '@/features/auth/queries'
import { useProfileQuery } from '../queries'
import { AccountLoadError, AccountSkeleton } from './account-ui'
import { ProfileForm } from './profile-form'

export function ProfileView() {
  const { data: session } = useSessionQuery()
  const userId = session?.user.id
  if (!userId) return <AccountSkeleton label={copy.account.loadingProfile} rows={3} />
  return <ProfileLoader key={userId} userId={userId} />
}

function ProfileLoader({ userId }: { userId: string }) {
  const profileQuery = useProfileQuery(userId)
  // A failed background refetch keeps the form and what was typed in it.
  if (profileQuery.data) return <ProfileForm userId={userId} profile={profileQuery.data} />
  if (profileQuery.isError) {
    return (
      <AccountLoadError
        title={copy.account.profileErrorTitle}
        error={profileQuery.error}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }
  return <AccountSkeleton label={copy.account.loadingProfile} rows={3} />
}
