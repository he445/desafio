import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { copy } from '@/content/copy'
import {
  FacebookIcon,
  InstagramIcon,
  XSocialIcon,
  YouTubeIcon,
} from '@/components/icons'
import { OutOfScopeAction } from './out-of-scope'

const emailSchema = z.email()

export function SiteFooter({ withMobileTabSpacing = false }: { withMobileTabSpacing?: boolean }) {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState<string | null>(null)

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = emailSchema.safeParse(newsletterEmail.trim())
    if (!parsed.success) {
      setNewsletterError(copy.validation.invalidEmail)
      return
    }
    setNewsletterError(null)
    setNewsletterEmail('')
    toast.success(copy.footer.newsletter.successToast)
  }

  return (
    <footer
      className={`mx-auto mt-24 w-full max-w-[1200px] pb-6 ${
        withMobileTabSpacing ? 'pb-[126px] lg:pb-6' : ''
      }`}
    >
      {/* Band 1: Medallions & Newsletter */}
      <div className="bg-surface px-6 py-8 lg:flex lg:h-[250px] lg:items-start lg:justify-between lg:p-8">
        <div className="grid gap-8 sm:grid-cols-3 lg:flex lg:items-start lg:gap-0">
          {copy.footer.medallions.map((medallion) => (
            <div
              key={medallion.letter}
              className="flex flex-col items-start lg:w-[236px] lg:border-r lg:border-primary lg:pr-8 lg:not-first:pl-8"
            >
              <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-ink">
                {medallion.letter}
              </div>
              <h2 className="mt-4 text-[17px] font-bold text-foreground">{medallion.title}</h2>
              <p className="mt-2 text-sm/[22px] text-body">{medallion.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 lg:mt-0 lg:w-[360px] lg:pl-8">
          <h2 className="text-lg font-bold text-foreground">{copy.footer.newsletter.title}</h2>
          <form onSubmit={handleNewsletterSubmit} noValidate className="mt-4">
            <div className="flex h-10 overflow-hidden rounded-btn bg-surface-dark shadow-field">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                {copy.footer.newsletter.placeholder}
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value)
                  if (newsletterError) setNewsletterError(null)
                }}
                aria-invalid={Boolean(newsletterError)}
                aria-describedby={newsletterError ? 'footer-newsletter-error' : undefined}
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
            {newsletterError && (
              <p id="footer-newsletter-error" role="alert" className="mt-1.5 text-xs text-coral">
                {newsletterError}
              </p>
            )}
          </form>
          <p className="mt-3 text-[13px]/[22px] text-body">{copy.footer.newsletter.note}</p>
        </div>
      </div>

      {/* Band 2: Brand & Contact */}
      <div className="grid grid-cols-1 gap-4 bg-surface-dark px-6 py-6 text-sm sm:grid-cols-2 lg:flex lg:h-[88px] lg:items-center lg:gap-[92px] lg:p-8">
        <span className="font-bold tracking-[0.1em] text-foreground">{copy.brand.logo}</span>
        <span className="max-w-[260px] text-body">{copy.brand.tagline}</span>
        <span className="text-body">{copy.brand.email}</span>
        <span className="text-body">{copy.brand.phone}</span>
      </div>

      {/* Band 3: Columns */}
      <div className="grid grid-cols-2 gap-8 bg-surface px-6 py-8 lg:flex lg:h-[236px] lg:gap-[124px] lg:p-8">
        <div>
          <h3 className="text-lg font-bold text-foreground">{copy.footer.columns.profile.title}</h3>
          <ul className="mt-3 space-y-0.5 text-sm/[30px] text-body">
            {copy.footer.columns.profile.items.map((item) => (
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

        <div>
          <h3 className="text-lg font-bold text-foreground">{copy.footer.columns.help.title}</h3>
          <ul className="mt-3 space-y-0.5 text-sm/[30px] text-body">
            {copy.footer.columns.help.items.map((item) => (
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

        <div>
          <h3 className="text-lg font-bold text-foreground">
            {copy.footer.columns.collections.title}
          </h3>
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
            <h3 className="text-lg font-bold text-foreground">{copy.footer.columns.socialTitle}</h3>
            <div className="mt-3 flex items-center gap-2">
              {[
                { name: 'Facebook', icon: <FacebookIcon size={18} /> },
                { name: 'Instagram', icon: <InstagramIcon size={18} /> },
                { name: 'X', icon: <XSocialIcon size={16} /> },
                {
                  name: 'LinkedIn',
                  icon: <span className="text-xs font-bold leading-none">in</span>,
                },
                { name: 'YouTube', icon: <YouTubeIcon size={18} /> },
              ].map((social) => (
                <OutOfScopeAction
                  key={social.name}
                  className="flex h-[30px] w-[30px] items-center justify-center border border-primary text-highlight"
                >
                  <span className="sr-only">{social.name}</span>
                  {social.icon}
                </OutOfScopeAction>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">
              {copy.footer.columns.walletsTitle}
            </h3>
            <div className="mt-3 inline-flex h-[26px] items-center rounded-btn border border-line-soft bg-surface-dark px-3 text-[9px] font-bold tracking-[0.1px] text-highlight">
              {copy.footer.columns.walletsChip}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-sm/[30px] text-body">{copy.footer.copyright(2026)}</p>
    </footer>
  )
}
