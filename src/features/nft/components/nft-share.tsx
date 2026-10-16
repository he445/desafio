import type { ReactNode } from 'react'
import { copy } from '@/content/copy'
import { LinkedInIcon, MessageIcon, XSocialIcon } from '@/components/icons'

function ShareLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  const external = !href.startsWith('mailto:')
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={external ? `${label} ${copy.detail.newTab}` : label}
      className="flex size-6 items-center justify-center text-foreground hover:text-highlight"
    >
      {children}
    </a>
  )
}

export function NftShare({ title }: { title: string }) {
  const url = window.location.href
  const canShare = typeof navigator.share === 'function'

  const handleShare = () => {
    // Closing the share sheet rejects the promise; there is nothing to report.
    navigator.share({ title, url }).catch(() => undefined)
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className="mt-3 flex items-center gap-3">
      <h2 className="text-[15px] font-bold text-foreground">{copy.detail.shareLabel}</h2>
      {canShare ? (
        <button
          type="button"
          onClick={handleShare}
          aria-label={copy.detail.shareLabel}
          className="flex size-6 items-center justify-center text-foreground hover:text-highlight"
        >
          <MessageIcon size={18} />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <ShareLink
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            label={copy.detail.shareLinkedIn}
          >
            <LinkedInIcon size={15} />
          </ShareLink>
          <ShareLink
            href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
            label={copy.detail.shareEmail}
          >
            <MessageIcon size={18} />
          </ShareLink>
          <ShareLink
            href={`https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`}
            label={copy.detail.shareX}
          >
            <XSocialIcon size={15} />
          </ShareLink>
        </div>
      )}
    </div>
  )
}
