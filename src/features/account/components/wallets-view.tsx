import { useId, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { Profile, Wallet } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useSessionQuery } from '@/features/auth/queries'
import { useProfileQuery, useWalletsQuery } from '../queries'
import { AccountLoadError, AccountSkeleton } from './account-ui'
import { WalletForm } from './wallet-form'

export function WalletsView({ redirect }: { redirect?: string }) {
  const { data: session } = useSessionQuery()
  const userId = session?.user.id
  if (!userId) return <AccountSkeleton label={copy.account.loadingWallets} rows={5} />
  return <WalletsLoader key={userId} userId={userId} redirect={redirect} />
}

function WalletsLoader({ userId, redirect }: { userId: string; redirect?: string }) {
  const profileQuery = useProfileQuery(userId)
  const walletsQuery = useWalletsQuery(userId)
  const profile = profileQuery.data
  const wallets = walletsQuery.data

  if (profile && wallets) {
    return <WalletsReady userId={userId} profile={profile} wallets={wallets} redirect={redirect} />
  }
  const failed = [profileQuery, walletsQuery].find((query) => query.isError && !query.data)
  if (failed) {
    return (
      <AccountLoadError
        title={copy.account.walletsErrorTitle}
        error={failed.error}
        onRetry={() => {
          if (profileQuery.isError) void profileQuery.refetch()
          if (walletsQuery.isError) void walletsQuery.refetch()
        }}
      />
    )
  }
  return <AccountSkeleton label={copy.account.loadingWallets} rows={5} />
}

interface WalletsReadyProps {
  userId: string
  profile: Profile
  wallets: Wallet[]
  redirect?: string
}

function WalletsReady({ userId, profile, wallets, redirect }: WalletsReadyProps) {
  const router = useRouter()
  const primaryFormId = useId()
  const sameAsPrimaryId = useId()
  const primaryTitleId = useId()
  const secondaryTitleId = useId()
  const primary = wallets.find((wallet) => wallet.role === 'primary')
  const secondary = wallets.find((wallet) => wallet.role === 'secondary')
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const showSecondaryForm = Boolean(secondary) || addingSecondary

  // Opened from the checkout, the page goes back there once a wallet is saved.
  const onSaved = () => {
    if (redirect) void router.navigate({ href: redirect })
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby={primaryTitleId}>
        <div className="flex items-center justify-between gap-4">
          <h2 id={primaryTitleId} className="text-[17px] font-bold text-heading">
            {copy.account.primaryWallet}
          </h2>
          {!primary && (
            <Button
              type="button"
              variant="link"
              className="text-base font-medium"
              onClick={() =>
                document.getElementById(primaryFormId)?.querySelector('input')?.focus()
              }
            >
              {copy.account.add}
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm text-body">{copy.account.walletsSubtitle}</p>
        <div className="mt-8">
          <WalletForm
            key={primary?.id ?? 'new-primary'}
            id={primaryFormId}
            userId={userId}
            walletRole="primary"
            wallet={primary}
            profile={profile}
            onSaved={onSaved}
          />
        </div>
      </section>

      <section aria-labelledby={secondaryTitleId}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id={secondaryTitleId} className="text-[17px] font-bold text-heading">
            {copy.account.secondaryWallet}
          </h2>
          <div className="flex items-center gap-6">
            {showSecondaryForm && primary && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={sameAsPrimaryId}
                  checked={sameAsPrimary}
                  onCheckedChange={(checked) => setSameAsPrimary(checked === true)}
                />
                <label htmlFor={sameAsPrimaryId} className="text-[15px] text-foreground">
                  {copy.account.sameAsPrimary}
                </label>
              </div>
            )}
            {!showSecondaryForm && (
              <Button
                type="button"
                variant="link"
                className="text-base font-medium"
                onClick={() => setAddingSecondary(true)}
              >
                {copy.account.add}
              </Button>
            )}
          </div>
        </div>
        {showSecondaryForm ? (
          <div className="mt-8">
            <WalletForm
              key={secondary?.id ?? 'new-secondary'}
              id={`${primaryFormId}-secondary`}
              userId={userId}
              walletRole="secondary"
              wallet={secondary}
              profile={profile}
              holderFrom={sameAsPrimary ? primary?.holder : undefined}
              focusOnMount={addingSecondary && !secondary}
              onSaved={onSaved}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-body">{copy.account.noSecondaryWallet}</p>
        )}
      </section>
    </div>
  )
}
