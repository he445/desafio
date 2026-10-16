import { useEffect, useState } from 'react'
import { subscribeAnnouncer } from '@/lib/announcer'

export function Announcer() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    return subscribeAnnouncer((next) => {
      setMessage(next)
    })
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="live-announcer"
      className="sr-only"
    >
      {message}
    </div>
  )
}
