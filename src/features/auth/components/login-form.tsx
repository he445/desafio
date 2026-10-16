import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginInputSchema, VALIDATION_MESSAGES, type LoginInput } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { OutOfScopeAction } from '@/components/layout/out-of-scope'
import { isApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { useCompleteAuth } from '../hooks/use-complete-auth'
import { useLoginMutation } from '../queries'
import { AuthField } from './auth-field'
import { authInputClass, authSubmitClass, type AuthVariant } from './auth-styles'
import { FormError } from './form-error'

function loginErrorMessage(error: unknown): string {
  if (!isApiError(error)) return copy.errors.unexpected
  return error.code === 'INVALID_CREDENTIALS'
    ? VALIDATION_MESSAGES.invalidCredentials
    : error.message
}

export function LoginForm({ variant, redirect }: { variant: AuthVariant; redirect?: string }) {
  const login = useLoginMutation()
  const completeAuth = useCompleteAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const auth = await login.mutateAsync(values)
      await completeAuth(auth, redirect)
    } catch (error) {
      setFormError(loginErrorMessage(error))
    } finally {
      form.resetField('password')
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
          <FormError title={copy.auth.formErrorTitle} message={formError} />
        </div>
      )}
      <div className="flex flex-col gap-3">
        <AuthField label={copy.auth.emailLabel} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={copy.auth.emailPlaceholder}
            className={authInputClass(variant)}
            {...form.register('email')}
          />
        </AuthField>
        <AuthField label={copy.auth.passwordLabel} error={errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            required
            placeholder={copy.auth.passwordPlaceholder}
            className={authInputClass(variant)}
            {...form.register('password')}
          />
        </AuthField>
      </div>
      <OutOfScopeAction className="mt-3 self-end text-sm text-highlight">
        {copy.auth.forgotPassword}
      </OutOfScopeAction>
      <Button
        type="submit"
        variant={variant === 'modal' ? 'modal' : 'default'}
        size={variant === 'modal' ? 'modal' : undefined}
        aria-disabled={isSubmitting || undefined}
        className={cn(variant === 'modal' ? 'mt-6 max-w-full' : 'mt-10', authSubmitClass(variant))}
      >
        {isSubmitting ? copy.auth.processing : copy.auth.signIn}
      </Button>
    </form>
  )
}
