import { useEffect, useRef } from 'react'
import { copy } from '@/content/copy'
import { announce } from '@/lib/announcer'

// Tells assistive technology how many results the new view has. The first load stays silent:
// the page already says what it is, and only a change the person made needs to be reported.
export function useAnnounceResults(viewKey: string, total: number | undefined): void {
  const announced = useRef<string | null>(null)

  useEffect(() => {
    if (total === undefined || announced.current === viewKey) return
    const isFirstView = announced.current === null
    announced.current = viewKey
    if (!isFirstView) announce(copy.catalog.results(total))
  }, [viewKey, total])
}
