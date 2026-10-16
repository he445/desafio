import { createFileRoute, redirect } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { LoginSearchSchema } from '@/features/auth/search'

function LoginPage() {
  const { redirect, reason } = Route.useSearch()
  return <AuthScreen mode="login" redirect={redirect} expired={reason === 'expired'} />
}

export const Route = createFileRoute('/login')({
  validateSearch: LoginSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.session) {
      throw redirect({ href: search.redirect ?? '/' })
    }
  },
  head: () => ({
    meta: [{ title: copy.meta.pageTitle(copy.auth.signIn) }],
  }),
  component: LoginPage,
  errorComponent: RouteErrorBoundary,
})
