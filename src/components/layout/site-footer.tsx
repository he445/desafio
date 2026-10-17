import { Fragment, memo, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { copy } from '@/content/copy'
import { FacebookIcon, InstagramIcon, XSocialIcon, YouTubeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { OutOfScopeAction } from './out-of-scope'
import { desktopContainer } from './regions'

const emailSchema = z.email()

const SOCIAL_NETWORKS = [
  { name: 'Facebook', icon: <FacebookIcon size={18} /> },
  { name: 'Instagram', icon: <InstagramIcon size={18} /> },
  { name: 'X', icon: <XSocialIcon size={16} /> },
  { name: 'LinkedIn', icon: <span className="text-xs leading-none font-bold">in</span> },
  { name: 'YouTube', icon: <YouTubeIcon size={18} /> },
]

const columnTitle = 'text-lg font-bold text-foreground'

interface FooterColumnData {
  title: string
  items: readonly { label: string; to: '/profile' | '/wallets' | '/favorites' | null }[]
}

function FooterColumn({ column }: { column: FooterColumnData }) {
  return (
    <div>
      <h2 className={columnTitle}>{column.title}</h2>
      <ul className="mt-3 space-y-0.5 text-sm/[30px] text-body">
        {column.items.map((item) => (
          <li key={item.label}>
            {item.to ? (
              <Link to={item.to} className="hover:text-highlight">
                {item.label}
              </Link>
            ) : (
              <OutOfScopeAction className="text-left text-sm/[30px] text-body">
                {item.label}
              </OutOfScopeAction>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!emailSchema.safeParse(email.trim()).success) {
      setError(copy.validation.invalidEmail)
      return
    }
    setError(null)
    setEmail('')
    toast.success(copy.footer.newsletter.successToast)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4">
      <div className="flex h-10 overflow-hidden rounded-btn bg-surface-dark shadow-field">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          {copy.footer.newsletter.label}
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (error) setError(null)
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'footer-newsletter-error' : undefined}
          placeholder={copy.footer.newsletter.placeholder}
          className="h-full flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          className="h-full w-[85px] bg-primary text-lg font-bold text-ink transition-all hover:brightness-110"
        >
          {copy.footer.newsletter.submit}
        </button>
      </div>
      {error && (
        <p id="footer-newsletter-error" role="alert" className="mt-1.5 text-xs text-coral">
          {error}
        </p>
      )}
    </form>
  )
}

// The root layout renders again on every session, cart and route change; the footer depends on
// none of them.
export const SiteFooter = memo(function SiteFooter({
  withMobileTabSpacing = false,
}: {
  withMobileTabSpacing?: boolean
}) {
  return (
    <footer
      className={cn(desktopContainer, 'mt-24 pb-6', withMobileTabSpacing && 'pb-[126px] lg:pb-6')}
    >
      <div className="bg-surface px-6 py-8 lg:flex lg:min-h-[250px] lg:items-stretch lg:p-8">
        {copy.footer.medallions.map((medallion) => (
          <Fragment key={medallion.letter}>
            <div className="mb-8 flex flex-col items-start lg:mb-0 lg:w-[204px] lg:min-w-0">
              <div
                aria-hidden="true"
                className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-ink"
              >
                {medallion.letter}
              </div>
              <h2 className="mt-4 text-[17px] font-bold text-foreground">{medallion.title}</h2>
              <p className="mt-2 text-sm/[22px] text-body">{medallion.description}</p>
            </div>
            <div aria-hidden="true" className="hidden lg:mx-8 lg:block lg:w-px lg:bg-primary" />
          </Fragment>
        ))}

        <div className="lg:min-w-[280px] lg:flex-1">
          <h2 className="text-lg font-bold text-foreground">{copy.footer.newsletter.title}</h2>
          <NewsletterForm />
          <p className="mt-3 text-[13px]/[22px] text-body">{copy.footer.newsletter.note}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-surface-dark px-6 py-6 text-sm lg:flex lg:min-h-[88px] lg:items-center lg:gap-16 lg:p-8 xl:gap-[92px]">
        <span className="font-bold tracking-[0.1em] text-foreground">{copy.brand.logo}</span>
        <span className="max-w-[260px] text-body">{copy.brand.tagline}</span>
        <span className="text-body">{copy.brand.email}</span>
        <span className="text-body">{copy.brand.phone}</span>
      </div>

      <div className="grid grid-cols-2 gap-8 bg-surface px-6 py-8 lg:min-h-[236px] lg:grid-cols-4 lg:p-8 xl:flex xl:gap-[124px]">
        <FooterColumn column={copy.footer.columns.profile} />
        <FooterColumn column={copy.footer.columns.help} />

        <div>
          <h2 className={columnTitle}>{copy.footer.columns.collections.title}</h2>
          <ul className="mt-3 space-y-0.5 text-sm/[30px] text-body">
            {copy.footer.columns.collections.items.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/"
                  search={{ category: item.slug, page: 1 }}
                  hash="mercado"
                  className="hover:text-highlight"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className={columnTitle}>{copy.footer.columns.socialTitle}</h2>
            <div className="mt-3 flex items-center gap-2">
              {SOCIAL_NETWORKS.map((network) => (
                <OutOfScopeAction
                  key={network.name}
                  className="flex h-[30px] w-[30px] items-center justify-center border border-primary text-highlight"
                >
                  <span className="sr-only">{network.name}</span>
                  {network.icon}
                </OutOfScopeAction>
              ))}
            </div>
          </div>

          <div>
            <h2 className={columnTitle}>{copy.footer.columns.walletsTitle}</h2>
            <div className="mt-3 inline-flex min-h-[26px] items-center rounded-btn border border-line-soft bg-surface-dark px-3 py-1 text-[9px] font-bold tracking-[0.1px] text-highlight lg:py-0">
              {copy.footer.columns.walletsChip}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 px-6 text-center text-sm/[30px] text-body">{copy.footer.copyright()}</p>
    </footer>
  )
})
