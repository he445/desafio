import { useEffect, useState } from 'react'
import { normalizeQuery } from '../search'

const SEARCH_DEBOUNCE_MS = 300

interface SearchBoxOptions {
  // What the URL holds right now.
  value: string | undefined
  onCommit: (value: string | undefined) => void
  delay?: number
}

// The text of the search box is written to the URL after a pause in the typing, or at once on
// Enter. The URL stays the source of truth: when it changes for any other reason (back and
// forward, "clear filters"), the box shows it, but the echo of our own write never rewrites
// what the person kept typing in the meantime.
export function useSearchBox({ value, onCommit, delay = SEARCH_DEBOUNCE_MS }: SearchBoxOptions) {
  const fromUrl = value ?? ''
  const [text, setText] = useState(fromUrl)
  const [seen, setSeen] = useState(fromUrl)
  const [pending, setPending] = useState<string | null>(null)

  if (fromUrl !== seen) {
    setSeen(fromUrl)
    if (pending === null || pending !== fromUrl) setText(fromUrl)
    setPending(null)
  }

  const target = pending ?? fromUrl
  const typed = normalizeQuery(text) ?? ''

  useEffect(() => {
    if (typed === target) return
    const timer = setTimeout(() => {
      setPending(typed)
      onCommit(typed === '' ? undefined : typed)
    }, delay)
    return () => clearTimeout(timer)
  }, [typed, target, delay, onCommit])

  const submit = () => {
    if (typed === target) return
    setPending(typed)
    onCommit(typed === '' ? undefined : typed)
  }

  return { text, setText, submit }
}
