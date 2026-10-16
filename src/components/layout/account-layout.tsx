import type { ReactNode } from 'react'
import { useIsDesktop } from '@/lib/use-media-query'
import { AccountSidebar, type AccountSection } from './account-sidebar'
import { MobileTopBar } from './mobile-top-bar'

interface AccountLayoutProps {
  section: AccountSection
  title: string
  onSignOut: () => void
  children: ReactNode
}

// The desktop frames have no visible page title, so the h1 is visually hidden there and the
// mobile top bar carries it below lg.
export function AccountLayout({ section, title, onSignOut, children }: AccountLayoutProps) {
  const isDesktop = useIsDesktop()

  return (
    <section className="space-y-6 lg:flex lg:items-start lg:gap-7 lg:space-y-0">
      {isDesktop ? <h1 className="sr-only">{title}</h1> : <MobileTopBar title={title} />}
      <AccountSidebar active={section} onSignOut={onSignOut} />
      <div className="flex-1">{children}</div>
    </section>
  )
}
