import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { copy } from '@/content/copy'
import { RouteErrorBoundary } from '@/components/layout/route-error'

const LoginSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .transform((val) => (val && val.startsWith('/') && !val.startsWith('//') ? val : undefined))
    .catch(undefined),
  reason: z.enum(['expired']).optional().catch(undefined),
})

function LoginPage() {
  const { reason } = Route.useSearch()

  return (
    <section className="mx-auto max-w-[500px] space-y-6 py-8">
      <h1 className="text-xl font-bold text-heading">{copy.auth.signIn}</h1>
      {reason === 'expired' && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-field border border-coral p-3 text-sm text-coral"
        >
          {copy.auth.sessionExpiredBanner}
        </div>
      )}
      <p className="text-sm text-body">{copy.auth.signInSubtitle}</p>
    </section>
  )
}

export const Route = createFileRoute('/login')({
  validateSearch: (search) => LoginSearchSchema.parse(search),
  beforeLoad: ({ context, search }) => {
    if (context.session) {
      throw redirect({ to: search.redirect || '/' })
    }
  },
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.auth.signIn) }],
  }),
  component: LoginPage,
  errorComponent: RouteErrorBoundary,
})
