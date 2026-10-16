import { useEffect, useRef } from 'react'

// The summary at the top of the form takes the focus, so a screen reader hears the failure
// and a keyboard user starts again from it.
export function FormError({ title, message }: { title: string; message: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [title, message])

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-field border border-coral p-3 text-left text-sm text-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  )
}
