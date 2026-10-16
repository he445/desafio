import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { RouteErrorBoundary } from '@/components/layout/route-error'

function AuthenticatedLayout() {
  return <Outlet />
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { session: context.session }
  },
  component: AuthenticatedLayout,
  errorComponent: RouteErrorBoundary,
})
