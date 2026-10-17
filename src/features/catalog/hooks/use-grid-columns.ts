import { useIsDesktop, useMediaQuery } from '@/lib/use-media-query'

export function useGridColumns(): { columns: 2 | 3; isDesktop: boolean } {
  const isDesktop = useIsDesktop()
  const isTablet = useMediaQuery('(min-width: 768px)')
  return { columns: isTablet ? 3 : 2, isDesktop }
}
