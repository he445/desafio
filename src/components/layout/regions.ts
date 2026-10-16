// The header, the main column and the footer share these gutters: 24 px from lg up to
// 1248 px, then a centered 1200 px column (the Figma desktop frame).
export const desktopContainer =
  'lg:mx-auto lg:w-full lg:max-w-[1248px] lg:px-6 xl:max-w-[1200px] xl:px-0'

export function hasMobileTabBar(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/favorites') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wallets') ||
    pathname.startsWith('/orders/')
  )
}
