import { createFileRoute, redirect } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { RegisterSearchSchema } from '@/features/auth/search'

function RegisterPage() {
  return (
    <section className="mx-auto max-w-[500px] space-y-6 py-8">
      <h1 className="text-xl font-bold text-heading">{copy.auth.createAccount}</h1>
      <p className="text-sm text-body">{copy.auth.registerSubtitle}</p>
    </section>
  )
}

export const Route = createFileRoute('/register')({
  validateSearch: RegisterSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.session) {
      throw redirect({ href: search.redirect ?? '/' })
    }
  },
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.auth.createAccount) }],
  }),
  component: RegisterPage,
  errorComponent: RouteErrorBoundary,
})
