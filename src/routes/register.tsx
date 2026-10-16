import { createFileRoute, redirect } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { RegisterSearchSchema } from '@/features/auth/search'

function RegisterPage() {
  const { redirect } = Route.useSearch()
  return <AuthScreen mode="register" redirect={redirect} />
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
