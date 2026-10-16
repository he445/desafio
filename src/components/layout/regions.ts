export function hasMobileTabBar(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/favorites') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wallets') ||
    pathname.startsWith('/orders/')
  )
}
