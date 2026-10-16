import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { RouteErrorBoundary } from '@/components/layout/route-error'
import { sessionQueryOptions } from '@/features/auth/queries'

function AuthenticatedLayout() {
  return <Outlet />
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return { session }
  },
  component: AuthenticatedLayout,
  errorComponent: RouteErrorBoundary,
})
