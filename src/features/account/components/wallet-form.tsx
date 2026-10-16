import { useEffect, useState } from 'react'
import { Controller, get, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  CreateWalletInputSchema,
  HolderSchema,
  isValidWalletAddressForNetwork,
  NetworkIdSchema,
  VALIDATION_MESSAGES,
  type Holder,
  type Profile,
  type Wallet,
  type WalletRole,
} from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { EnsInput, FieldSelect, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { FormError } from '@/features/auth/components/form-error'
import { isApiError } from '@/lib/api-error'
import { pickFieldErrors } from '@/lib/form-errors'
import { cn } from '@/lib/utils'
import { useSaveWalletMutation } from '../queries'
import { accountGridClass, accountInputClass, accountSaveClass } from './account-ui'

// Network and type start empty, as in the Figma placeholders; the contract schema parses the
// values again on submit, which is what turns them into its enums.
const WalletFormSchema = z
  .object({
    label: z.string().trim().min(1, VALIDATION_MESSAGES.required),
    network: z.string().min(1, VALIDATION_MESSAGES.required),
    address: z.string().trim().min(1, VALIDATION_MESSAGES.required),
    ens: z.string().trim(),
    provider: z.string().min(1, VALIDATION_MESSAGES.required),
    holder: HolderSchema,
  })
  .superRefine((values, ctx) => {
    const network = NetworkIdSchema.safeParse(values.network)
    if (
      network.success &&
      values.address &&
      !isValidWalletAddressForNetwork(values.address, network.data)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['address'],
        message: VALIDATION_MESSAGES.invalidAddress,
      })
    }
  })
type WalletFormValues = z.infer<typeof WalletFormSchema>

const WALLET_FIELDS = [
  'holder.displayName',
  'label',
  'network',
  'holder.profileName',
  'address',
  'ens',
  'provider',
  'holder.referralCode',
  'holder.email',
  'holder.ensName',
] as const

function walletValues(wallet: Wallet | undefined, profile: Profile): WalletFormValues {
  if (wallet) {
    return {
      label: wallet.label,
      network: wallet.network,
      address: wallet.address,
      ens: wallet.ens ?? '',
      provider: wallet.provider,
      holder: wallet.holder,
    }
  }
  return {
    label: '',
    network: '',
    address: '',
    ens: '',
    provider: '',
    holder: {
      displayName: profile.displayName,
      profileName: profile.username,
      email: profile.email,
      ensName: profile.ensName ?? '',
      referralCode: profile.referralCode,
    },
  }
}

interface WalletFormProps {
  id: string
  userId: string
  walletRole: WalletRole
  wallet: Wallet | undefined
  profile: Profile
  // Set by "Igual à carteira principal": the holder fields take the primary wallet's data.
  holderFrom?: Holder
  focusOnMount?: boolean
  onSaved: (wallet: Wallet) => void
}

export function WalletForm({
  id,
  userId,
  walletRole,
  wallet,
  profile,
  holderFrom,
  focusOnMount,
  onSaved,
}: WalletFormProps) {
  const saveWallet = useSaveWalletMutation(userId)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(WalletFormSchema),
    defaultValues: walletValues(wallet, profile),
  })
  const { errors, isSubmitting } = form.formState

  useEffect(() => {
    if (focusOnMount) form.setFocus('holder.displayName')
  }, [focusOnMount, form])

  useEffect(() => {
    if (!holderFrom) return
    for (const [key, value] of Object.entries(holderFrom)) {
      form.setValue(`holder.${key as keyof Holder}`, value, { shouldDirty: true })
    }
  }, [holderFrom, form])

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    const input = CreateWalletInputSchema.parse({
      ...values,
      ens: values.ens || null,
      role: walletRole,
    })
    try {
      const saved = await saveWallet.mutateAsync({ id: wallet?.id ?? null, input })
      form.reset(walletValues(saved, profile))
      toast.success(copy.account.walletSaved)
      onSaved(saved)
    } catch (error) {
      const failures = pickFieldErrors(error, WALLET_FIELDS)
      for (const [field, message] of failures) form.setError(field, { type: 'server', message })
      if (failures[0]) form.setFocus(failures[0][0])
      // A slot conflict (role) has no field on screen: it goes to the summary at the top.
      else setFormError(isApiError(error) ? error.message : copy.errors.unexpected)
    }
  })

  const error = (name: (typeof WALLET_FIELDS)[number]): string | undefined =>
    get(errors, name)?.message

  return (
    <form
      id={id}
      noValidate
      aria-label={copy.account.walletFormLabel(
        walletRole === 'primary' ? copy.account.primaryWallet : copy.account.secondaryWallet,
      )}
      onSubmit={(event) => {
        if (isSubmitting) event.preventDefault()
        else void onSubmit(event)
      }}
    >
      {formError && (
        <div className="mb-6">
          <FormError title={copy.account.saveErrorTitle} message={formError} />
        </div>
      )}
      <div className={accountGridClass}>
        <FormField label={copy.checkout.displayName} required error={error('holder.displayName')}>
          <Input
            autoComplete="name"
            required
            className={accountInputClass}
            {...form.register('holder.displayName')}
          />
        </FormField>
        <FormField label={copy.account.walletNickname} required error={error('label')}>
          <Input required className={accountInputClass} {...form.register('label')} />
        </FormField>

        <Controller
          control={form.control}
          name="network"
          render={({ field }) => (
            <FormField label={copy.checkout.network} required error={error('network')}>
              <FieldSelect
                ref={field.ref}
                value={field.value}
                placeholder={copy.checkout.selectNetwork}
                className={accountInputClass}
                options={copy.home.networks.map((network) => ({
                  value: network.id,
                  label: network.label,
                }))}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormField>
          )}
        />
        <FormField label={copy.checkout.profileName} required error={error('holder.profileName')}>
          <Input required className={accountInputClass} {...form.register('holder.profileName')} />
        </FormField>

        <FormField label={copy.checkout.walletAddress} required error={error('address')}>
          <Input
            required
            spellCheck={false}
            autoComplete="off"
            placeholder={copy.checkout.walletAddressPlaceholder}
            className={accountInputClass}
            {...form.register('address')}
          />
        </FormField>
        <FormField label={copy.checkout.secondaryOrEnsPlaceholder} hideLabel error={error('ens')}>
          <Input
            placeholder={copy.checkout.secondaryOrEnsPlaceholder}
            className={accountInputClass}
            {...form.register('ens')}
          />
        </FormField>

        <Controller
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormField label={copy.checkout.walletType} required error={error('provider')}>
              <FieldSelect
                ref={field.ref}
                value={field.value}
                placeholder={copy.checkout.selectWalletType}
                className={accountInputClass}
                options={copy.checkout.providers.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormField>
          )}
        />
        <FormField label={copy.checkout.referralCode} required error={error('holder.referralCode')}>
          <Input required className={accountInputClass} {...form.register('holder.referralCode')} />
        </FormField>

        <FormField label={copy.checkout.email} required error={error('holder.email')}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className={accountInputClass}
            {...form.register('holder.email')}
          />
        </FormField>
        <FormField label={copy.checkout.ensName} required error={error('holder.ensName')}>
          <EnsInput required className={accountInputClass} {...form.register('holder.ensName')} />
        </FormField>
      </div>

      <Button
        type="submit"
        variant="form"
        aria-disabled={isSubmitting || undefined}
        className={cn('mt-8', accountSaveClass)}
      >
        {isSubmitting ? copy.checkout.processing : copy.account.saveWallet}
      </Button>
    </form>
  )
}
