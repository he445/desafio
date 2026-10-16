import { Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'

function Separator() {
  return (
    <span aria-hidden="true" className="whitespace-pre">
      {' / '}
    </span>
  )
}

export function Breadcrumb({ current }: { current?: string }) {
  return (
    <nav aria-label={copy.a11y.breadcrumb} className="text-[15px] font-bold text-body">
      <ol className="flex flex-wrap items-center">
        <li>
          <Link to="/" className="hover:text-highlight">
            {copy.nav.home}
          </Link>
        </li>
        <li>
          <Separator />
          <Link to="/" hash="mercado" className="hover:text-highlight">
            {copy.nav.market}
          </Link>
        </li>
        {current && (
          <li>
            <Separator />
            <span aria-current="page">{current}</span>
          </li>
        )}
      </ol>
    </nav>
  )
}
