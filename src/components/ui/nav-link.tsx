import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { createLink } from '@tanstack/react-router'

interface SectionAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  // `true` marks the current page; 'true' marks a selected option that is not a page (a filter).
  current?: boolean | 'true'
}

// The router sets aria-current="page" on every link whose path matches, which also tags the
// logo and the /#mercado and /#diario anchors on the home page. This anchor takes `current`
// from the caller instead.
const SectionAnchor = forwardRef<HTMLAnchorElement, SectionAnchorProps>(
  ({ current = false, children, ...props }, ref) => (
    <a ref={ref} {...props} aria-current={current === true ? 'page' : current || undefined}>
      {children}
    </a>
  ),
)
SectionAnchor.displayName = 'SectionAnchor'

export const NavLink = createLink(SectionAnchor)
