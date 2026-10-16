import type { WalletProvider } from '@/contracts'
import { copy } from '@/content/copy'
import { WalletIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { CheckoutState, ConnectionStatus } from '../hooks/use-checkout'

const STATUS_TEXT: Record<Exclude<ConnectionStatus, 'idle'>, string> = {
  connecting: copy.checkout.connecting,
  connected: copy.checkout.connected,
  rejected: copy.checkout.rejectedRetry,
}

interface WalletOptionsProps {
  checkout: CheckoutState
  variant: 'desktop' | 'mobile'
  titleId: string
}

// Picking a provider connects the chosen wallet; the result shows inside the option itself.
export function WalletOptions({ checkout, variant, titleId }: WalletOptionsProps) {
  const desktop = variant === 'desktop'
  const disabled = !checkout.wallet

  const statusOf = (provider: WalletProvider): ConnectionStatus =>
    checkout.provider === provider ? checkout.connectionStatus : 'idle'

  return (
    <ul aria-labelledby={titleId} className={cn(desktop ? 'space-y-3' : 'space-y-4')}>
      {copy.checkout.providers.map((option) => {
        const status = statusOf(option.id)
        const statusText = status === 'idle' ? null : STATUS_TEXT[status]
        return (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={status === 'connected' || status === 'connecting'}
              aria-disabled={disabled || undefined}
              onClick={() => {
                if (!disabled) checkout.connectProvider(option.id)
              }}
              className={cn(
                'flex w-full items-center gap-3 border text-left transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50 motion-reduce:transition-none',
                desktop
                  ? 'h-[50px] rounded-card px-4'
                  : 'h-[60px] rounded-mobile-card bg-surface px-4 shadow-card-m',
                status === 'connected' || status === 'connecting'
                  ? 'border-primary'
                  : 'border-line hover:border-primary',
              )}
            >
              {!desktop && (
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-base font-bold text-highlight"
                >
                  {option.mobileMark ?? <WalletIcon size={24} />}
                </span>
              )}
              {desktop && option.id === 'walletconnect' ? (
                <>
                  <span className="sr-only">{option.label}</span>
                  <span
                    aria-hidden="true"
                    className="text-[9px] font-bold tracking-[0.1px] text-heading"
                  >
                    {copy.footer.columns.walletsChip}
                  </span>
                </>
              ) : (
                <span className="text-[15px] font-bold text-heading">{option.label}</span>
              )}
              {statusText && (
                <span
                  className={cn(
                    'ml-auto text-sm whitespace-nowrap',
                    status === 'rejected' ? 'text-coral' : 'text-highlight',
                  )}
                >
                  {statusText}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
