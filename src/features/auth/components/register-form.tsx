import { useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegisterInputSchema, VALIDATION_MESSAGES } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { isApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { useCompleteAuth } from '../hooks/use-complete-auth'
import { useRegisterMutation } from '../queries'
import { AuthField } from './auth-field'
import { authInputClass, authSubmitClass, type AuthVariant } from './auth-styles'
import { FormError } from './form-error'

const RegisterFormSchema = RegisterInputSchema.extend({
  confirmPassword: z.string().min(1, VALIDATION_MESSAGES.required),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: VALIDATION_MESSAGES.passwordMismatch,
})
type RegisterFormValues = z.infer<typeof RegisterFormSchema>

const SERVER_FIELDS = ['username', 'email', 'password'] as const

export function RegisterForm({ variant, redirect }: { variant: AuthVariant; redirect?: string }) {
  const registerUser = useRegisterMutation()
  const completeAuth = useCompleteAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ confirmPassword: _confirm, ...input }) => {
    setFormError(null)
    try {
      const auth = await registerUser.mutateAsync(input)
      await completeAuth(auth, redirect)
    } catch (error) {
      const fieldErrors = isApiError(error) ? error.fieldErrors : undefined
      const invalid = SERVER_FIELDS.filter((field) => fieldErrors?.[field]?.[0])
      for (const field of invalid) {
        form.setError(field, { type: 'server', message: fieldErrors?.[field]?.[0] })
      }
      if (invalid[0]) {
        form.setFocus(invalid[0] as Path<RegisterFormValues>)
      } else {
        setFormError(isApiError(error) ? error.message : copy.errors.unexpected)
      }
    } finally {
      form.resetField('password')
      form.resetField('confirmPassword')
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        if (isSubmitting) event.preventDefault()
        else void onSubmit(event)
      }}
      className="flex flex-col"
    >
      {formError && (
        <div className="mb-3">
          <FormError title={copy.auth.registerErrorTitle} message={formError} />
        </div>
      )}
      <div className="flex flex-col gap-3">
        <AuthField label={copy.auth.usernameLabel} error={errors.username?.message}>
          <Input
            autoComplete="username"
            required
            placeholder={copy.auth.usernamePlaceholder}
            className={authInputClass(variant)}
            {...form.register('username')}
          />
        </AuthField>
        <AuthField label={copy.auth.emailLabel} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={copy.auth.registerEmailPlaceholder}
            className={authInputClass(variant)}
            {...form.register('email')}
          />
        </AuthField>
        <AuthField label={copy.auth.passwordLabel} error={errors.password?.message}>
          <PasswordInput
            autoComplete="new-password"
            required
            placeholder={copy.auth.passwordPlaceholder}
            className={authInputClass(variant)}
            {...form.register('password')}
          />
        </AuthField>
        <AuthField label={copy.auth.confirmPasswordLabel} error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            required
            placeholder={copy.auth.confirmPasswordPlaceholder}
            className={authInputClass(variant)}
            {...form.register('confirmPassword')}
          />
        </AuthField>
      </div>
      <Button
        type="submit"
        variant={variant === 'modal' ? 'modal' : 'default'}
        size={variant === 'modal' ? 'modal' : undefined}
        aria-disabled={isSubmitting || undefined}
        className={cn(variant === 'modal' ? 'mt-6 max-w-full' : 'mt-10', authSubmitClass(variant))}
      >
        {isSubmitting
          ? copy.auth.processing
          : variant === 'modal'
            ? copy.auth.createAccount
            : copy.auth.createProfileBtn}
      </Button>
    </form>
  )
}
