import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import type { Cart, Wallet } from '@/contracts'
import { copy } from '@/content/copy'
import { EllipsisVerticalIcon } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { displayEth, shortenAddress } from '@/lib/format'
import type { CheckoutState } from '../hooks/use-checkout'
import { QuoteReview } from './checkout-summary'
import { ConfirmBlock } from './confirm-block'
import { WalletOptions } from './wallet-options'

interface CheckoutMobileProps {
  checkout: CheckoutState
  cart: Cart
  wallets: Wallet[]
}

function networkLabel(wallet: Wallet): string {
  return copy.home.networks.find((network) => network.id === wallet.network)?.walletLabel ?? ''
}

export function CheckoutMobile({ checkout, cart, wallets }: CheckoutMobileProps) {
  const walletsTitleId = useId()
  const optionsTitleId = useId()
  const { quote } = checkout

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4 flex items-center justify-between">
        <h2 id={walletsTitleId} className="text-base font-bold text-heading">
          {copy.checkout.connectedWalletMobile}
        </h2>
        <Link
          to="/wallets"
          search={{ redirect: '/checkout' }}
          className="text-sm font-bold text-highlight"
        >
          {copy.checkout.switchWalletMobile}
        </Link>
      </div>

      {wallets.length === 0 ? (
        <div className="mt-4 rounded-mobile-card bg-surface p-6 text-center shadow-card-m">
          <p className="text-base font-bold text-heading">{copy.checkout.noWallet}</p>
          <Link
            to="/wallets"
            search={{ redirect: '/checkout' }}
            className="mt-2 inline-block text-sm font-bold text-highlight"
          >
            {copy.checkout.addWallet}
          </Link>
        </div>
      ) : (
        <RadioGroup
          aria-labelledby={walletsTitleId}
          value={checkout.wallet?.id}
          onValueChange={checkout.selectWallet}
          className="mt-4 gap-5"
        >
          {wallets.map((wallet) => {
            const radioId = `wallet-${wallet.id}`
            return (
              <div
                key={wallet.id}
                className="relative flex min-h-[93px] items-start rounded-mobile-card bg-surface py-[15px] pr-3 pl-[19px] shadow-card-m"
              >
                <RadioGroupItem id={radioId} value={wallet.id} className="mt-1 shrink-0" />
                <label htmlFor={radioId} className="ml-[19px] min-w-0 flex-1 cursor-pointer">
                  <span className="block text-base font-bold text-heading">{wallet.label}</span>
                  <span className="mt-2 block text-sm/[22px] text-body">
                    {wallet.ens ?? shortenAddress(wallet.address)}
                  </span>
                  <span className="block text-sm/[22px] text-body">{networkLabel(wallet)}</span>
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={copy.checkout.walletMenu(wallet.label)}
                    className="flex size-8 shrink-0 items-center justify-center text-highlight"
                  >
                    <EllipsisVerticalIcon size={20} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/wallets" search={{ redirect: '/checkout' }}>
                        {copy.checkout.editWalletMobile}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </RadioGroup>
      )}

      <h2 id={optionsTitleId} className="mt-4 text-base font-bold text-heading">
        {copy.checkout.walletAndNetwork}
      </h2>
      <div className="mt-4">
        <WalletOptions checkout={checkout} variant="mobile" titleId={optionsTitleId} />
      </div>

      {quote && checkout.outdated && (
        <div className="mt-4">
          <QuoteReview
            cart={cart}
            quote={quote}
            nextQuote={checkout.nextQuote}
            onAccept={checkout.acceptNextQuote}
          />
        </div>
      )}

      {quote && (
        <p className="mt-4 flex items-baseline justify-end gap-7">
          <span className="text-base font-bold text-heading">{copy.checkout.totalMobile}</span>
          <span className="text-xl font-bold text-highlight">{displayEth(quote.total)}</span>
        </p>
      )}

      <ConfirmBlock
        checkout={checkout}
        variant="mobile"
        className="mt-auto pt-8 pb-[max(32px,env(safe-area-inset-bottom))]"
      />
    </div>
  )
}
