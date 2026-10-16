import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BuyerSchema, type Buyer, type Cart, type Profile, type Wallet } from '@/contracts'
import { copy } from '@/content/copy'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CouponField } from '@/features/cart/components/coupon-field'
import { couponIssue } from '@/features/cart/quote'
import type { CheckoutState } from '../hooks/use-checkout'
import { buyerDefaults, walletsOn } from '../review'
import { CheckoutField } from './checkout-field'
import { CheckoutItems, CheckoutTotals, QuoteReview } from './checkout-summary'
import { ConfirmBlock } from './confirm-block'
import { WalletOptions } from './wallet-options'

interface CheckoutDesktopProps {
  checkout: CheckoutState
  cart: Cart
  profile: Profile
  wallets: Wallet[]
}

export function CheckoutDesktop({ checkout, cart, profile, wallets }: CheckoutDesktopProps) {
  const formId = useId()
  const optionsTitleId = useId()
  const anotherWalletId = useId()
  const [useAnotherWallet, setUseAnotherWallet] = useState(false)
  const [showCoupon, setShowCoupon] = useState(Boolean(cart.couponCode))
  const { wallet, quote } = checkout
  const form = useForm<Buyer>({
    resolver: zodResolver(BuyerSchema),
    defaultValues: buyerDefaults(profile, wallet),
  })
  const { errors } = form.formState

  // Holder fields follow the chosen wallet, without overwriting what the buyer typed.
  useEffect(() => {
    form.reset(buyerDefaults(profile, wallet), { keepDirtyValues: true })
  }, [form, profile, wallet])

  const onSubmit = form.handleSubmit((values) =>
    checkout.confirm({ ...values, note: values.note?.trim() ? values.note.trim() : null }),
  )
  const sameNetworkWallets = wallet ? walletsOn(wallets, wallet.network) : []

  return (
    <div className="mt-6 flex items-start gap-8">
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (checkout.canConfirm) void onSubmit(event)
        }}
        className="max-w-[762px] min-w-0 flex-1"
      >
        <h2 className="text-[17px] font-bold text-heading">{copy.checkout.collectorProfile}</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
          <CheckoutField
            label={copy.checkout.displayName}
            required
            error={errors.displayName?.message}
          >
            <Input autoComplete="name" {...form.register('displayName')} />
          </CheckoutField>
          <CheckoutField label={copy.checkout.username} required error={errors.username?.message}>
            <Input autoComplete="username" {...form.register('username')} />
          </CheckoutField>

          <CheckoutField label={copy.checkout.network} required>
            <FieldSelect
              value={wallet?.network ?? ''}
              placeholder={copy.checkout.selectNetwork}
              options={copy.home.networks.map((network) => {
                const empty = walletsOn(wallets, network.id).length === 0
                return {
                  value: network.id,
                  label: empty
                    ? `${network.label} ${copy.checkout.noWalletOnNetwork}`
                    : network.label,
                  disabled: empty,
                }
              })}
              onValueChange={(value) => {
                const network = copy.home.networks.find((candidate) => candidate.id === value)
                if (network) checkout.selectNetwork(network.id)
              }}
            />
          </CheckoutField>
          <CheckoutField
            label={copy.checkout.profileName}
            required
            error={errors.profileName?.message}
          >
            <Input {...form.register('profileName')} />
          </CheckoutField>

          <CheckoutField label={copy.checkout.walletAddress} required>
            <Input
              readOnly
              value={wallet?.address ?? ''}
              placeholder={copy.checkout.walletAddressPlaceholder}
            />
          </CheckoutField>
          <CheckoutField label={copy.checkout.secondaryOrEnsPlaceholder} hideLabel>
            <Input
              readOnly
              value={wallet?.ens ?? ''}
              placeholder={copy.checkout.secondaryOrEnsPlaceholder}
            />
          </CheckoutField>

          <CheckoutField label={copy.checkout.walletType} required>
            <FieldSelect
              value={checkout.provider ?? ''}
              placeholder={copy.checkout.selectWalletType}
              disabled={!wallet}
              options={copy.checkout.providers.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
              onValueChange={(value) => {
                const option = copy.checkout.providers.find((candidate) => candidate.id === value)
                if (option) checkout.connectProvider(option.id)
              }}
            />
          </CheckoutField>
          <CheckoutField
            label={copy.checkout.referralCode}
            required
            error={errors.referralCode?.message}
          >
            <Input {...form.register('referralCode')} />
          </CheckoutField>

          <CheckoutField label={copy.checkout.email} required error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...form.register('email')} />
          </CheckoutField>
          <CheckoutField label={copy.checkout.ensName} required error={errors.ensName?.message}>
            <EnsInput {...form.register('ensName')} />
          </CheckoutField>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Checkbox
            id={anotherWalletId}
            checked={useAnotherWallet}
            disabled={!wallet}
            onCheckedChange={(checked) => setUseAnotherWallet(checked === true)}
          />
          <label htmlFor={anotherWalletId} className="text-[15px] text-foreground">
            {copy.checkout.useAnotherWallet}
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
          {useAnotherWallet && wallet && (
            <CheckoutField label={copy.checkout.otherWallet} required>
              <FieldSelect
                value={wallet.id}
                options={sameNetworkWallets.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                onValueChange={checkout.selectWallet}
              />
            </CheckoutField>
          )}
          <div className="col-start-1">
            <CheckoutField label={copy.checkout.collectorNote}>
              <textarea
                rows={4}
                className="w-full rounded-field border border-field bg-transparent px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                {...form.register('note')}
              />
            </CheckoutField>
          </div>
        </div>
      </form>

      <aside aria-label={copy.checkout.yourNfts} className="w-[405px] shrink-0">
        <h2 className="text-[17px] font-bold text-heading">{copy.checkout.yourNfts}</h2>
        {quote && (
          <>
            <div className="mt-4 flex justify-between border-b border-line pb-2.5 text-[15px] font-bold text-heading">
              <span aria-hidden="true">{copy.cart.colNfts}</span>
              <span aria-hidden="true">{copy.cart.subtotal}</span>
            </div>
            <div className="mt-3">
              <CheckoutItems cart={cart} quote={quote} />
            </div>
          </>
        )}

        <div className="mt-5">
          {showCoupon ? (
            <CouponField
              appliedCode={cart.couponCode}
              appliedIssue={couponIssue(quote)?.message}
              variant="desktop"
            />
          ) : (
            <p className="text-center text-sm">
              {copy.checkout.promoPrompt}{' '}
              <button
                type="button"
                className="text-highlight hover:underline"
                onClick={() => setShowCoupon(true)}
              >
                {copy.checkout.promoAction}
              </button>
            </p>
          )}
        </div>

        {quote && <CheckoutTotals quote={quote} className="mt-5" />}
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

        <h2 id={optionsTitleId} className="mt-6 text-center text-[17px] font-bold text-heading">
          {copy.checkout.walletAndNetwork}
        </h2>
        <div className="mt-3">
          <WalletOptions checkout={checkout} variant="desktop" titleId={optionsTitleId} />
        </div>

        <ConfirmBlock checkout={checkout} variant="desktop" formId={formId} className="mt-6" />
      </aside>
    </div>
  )
}

interface FieldSelectProps extends Omit<
  React.ComponentProps<typeof SelectTrigger>,
  'value' | 'children'
> {
  value: string
  placeholder?: string
  options: { value: string; label: string; disabled?: boolean }[]
  onValueChange: (value: string) => void
}

// The field passes id and aria attributes to the trigger, which is what the label points at.
function FieldSelect({
  value,
  placeholder,
  options,
  onValueChange,
  disabled,
  ...triggerProps
}: FieldSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function EnsInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input {...props} className="pr-14" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
      >
        {copy.checkout.ensSuffix}
      </span>
    </div>
  )
}
