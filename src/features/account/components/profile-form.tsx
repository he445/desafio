import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  PasswordSchema,
  UpdateProfileInputSchema,
  VALIDATION_MESSAGES,
  type Profile,
} from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { EnsInput, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { FormError } from '@/features/auth/components/form-error'
import { isApiError } from '@/lib/api-error'
import { pickFieldErrors } from '@/lib/form-errors'
import { cn } from '@/lib/utils'
import { useChangePasswordMutation, useUpdateProfileMutation } from '../queries'
import { accountGridClass, accountInputClass, accountSaveClass } from './account-ui'
import { AvatarField } from './avatar-field'

// The password block is optional: it only validates once one of its fields has text.
const ProfileFormSchema = UpdateProfileInputSchema.extend({
  ensName: z.string().trim(),
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmNewPassword: z.string(),
}).superRefine((values, ctx) => {
  if (!values.currentPassword && !values.newPassword && !values.confirmNewPassword) return
  if (!values.currentPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['currentPassword'],
      message: VALIDATION_MESSAGES.required,
    })
  }
  const next = PasswordSchema.safeParse(values.newPassword)
  if (!next.success) {
    ctx.addIssue({
      code: 'custom',
      path: ['newPassword'],
      message: next.error.issues[0]?.message ?? VALIDATION_MESSAGES.passwordMin,
    })
  }
  if (values.confirmNewPassword !== values.newPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmNewPassword'],
      message: values.confirmNewPassword
        ? VALIDATION_MESSAGES.passwordMismatch
        : VALIDATION_MESSAGES.required,
    })
  }
})
type ProfileFormValues = z.infer<typeof ProfileFormSchema>

const PROFILE_FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const
const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmNewPassword'] as const

function profileValues(profile: Profile) {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName ?? '',
    walletNickname: profile.walletNickname,
  }
}

export function ProfileForm({ userId, profile }: { userId: string; profile: Profile }) {
  const updateProfile = useUpdateProfileMutation(userId)
  const changePassword = useChangePasswordMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      ...profileValues(profile),
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })
  const { errors, isSubmitting, dirtyFields } = form.formState

  // One "Salvar" for the page: the profile goes when it changed and the password when any of
  // its fields has text. Each request keeps its own result, so a wrong current password does
  // not undo a saved profile.
  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    const profileChanged = PROFILE_FIELDS.some((field) => dirtyFields[field])
    const passwordRequested = Boolean(values.currentPassword)
    if (!profileChanged && !passwordRequested) {
      toast(copy.account.nothingToSave)
      return
    }

    const failures: [keyof ProfileFormValues, string][] = []
    const messages: string[] = []
    const collect = (error: unknown, fields: readonly (keyof ProfileFormValues)[]) => {
      const picked = pickFieldErrors(error, fields)
      if (picked.length > 0) failures.push(...picked)
      else messages.push(isApiError(error) ? error.message : copy.errors.unexpected)
    }

    if (profileChanged) {
      try {
        const saved = await updateProfile.mutateAsync({
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          ensName: values.ensName || null,
          walletNickname: values.walletNickname,
        })
        const next = profileValues(saved)
        for (const field of PROFILE_FIELDS) form.resetField(field, { defaultValue: next[field] })
        toast.success(copy.account.profileSaved)
      } catch (error) {
        collect(error, PROFILE_FIELDS)
      }
    }

    if (passwordRequested) {
      try {
        await changePassword.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
        for (const field of PASSWORD_FIELDS) form.resetField(field, { defaultValue: '' })
        toast.success(copy.account.passwordChanged)
      } catch (error) {
        collect(error, PASSWORD_FIELDS)
      }
    }

    for (const [field, message] of failures) form.setError(field, { type: 'server', message })
    if (messages.length > 0) setFormError(messages.join(' '))
    else if (failures[0]) form.setFocus(failures[0][0])
  })

  const field = (name: keyof ProfileFormValues) => errors[name]?.message

  return (
    <form
      noValidate
      onSubmit={(event) => {
        if (isSubmitting) event.preventDefault()
        else void onSubmit(event)
      }}
    >
      <h2 className="text-base font-bold text-heading">{copy.checkout.collectorProfile}</h2>
      {formError && (
        <div className="mt-4">
          <FormError title={copy.account.saveErrorTitle} message={formError} />
        </div>
      )}
      <div className={cn(accountGridClass, 'mt-8')}>
        <FormField label={copy.checkout.displayName} required error={field('displayName')}>
          <Input
            autoComplete="name"
            required
            className={accountInputClass}
            {...form.register('displayName')}
          />
        </FormField>
        <FormField label={copy.checkout.username} required error={field('username')}>
          <Input
            autoComplete="username"
            required
            className={accountInputClass}
            {...form.register('username')}
          />
        </FormField>
        <FormField label={copy.checkout.email} required error={field('email')}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className={accountInputClass}
            {...form.register('email')}
          />
        </FormField>
        <FormField label={copy.checkout.ensName} error={field('ensName')}>
          <EnsInput className={accountInputClass} {...form.register('ensName')} />
        </FormField>
        <FormField label={copy.account.walletNickname} required error={field('walletNickname')}>
          <Input required className={accountInputClass} {...form.register('walletNickname')} />
        </FormField>
        <AvatarField userId={userId} avatarUrl={profile.avatarUrl} />
      </div>

      <h2 className="mt-8 text-base font-medium text-heading">
        {copy.account.changePasswordTitle}
      </h2>
      <div className="mt-6 grid gap-6 lg:w-[417px]">
        <FormField label={copy.account.currentPassword} error={field('currentPassword')}>
          <PasswordInput
            autoComplete="current-password"
            className={accountInputClass}
            {...form.register('currentPassword')}
          />
        </FormField>
        <FormField label={copy.account.newPassword} error={field('newPassword')}>
          <PasswordInput
            autoComplete="new-password"
            className={accountInputClass}
            {...form.register('newPassword')}
          />
        </FormField>
        <FormField label={copy.account.confirmNewPassword} error={field('confirmNewPassword')}>
          <PasswordInput
            autoComplete="new-password"
            className={accountInputClass}
            {...form.register('confirmNewPassword')}
          />
        </FormField>
      </div>

      <Button
        type="submit"
        variant="form"
        aria-disabled={isSubmitting || undefined}
        className={cn('mt-8', accountSaveClass)}
      >
        {isSubmitting ? copy.checkout.processing : copy.account.save}
      </Button>
    </form>
  )
}
