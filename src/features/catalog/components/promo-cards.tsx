import { copy } from '@/content/copy'
import { ArrowRightIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { artSrc } from '@/lib/images'

export function PromoCards() {
  return (
    <section className="grid grid-cols-2 gap-7">
      {copy.home.promos.map((promo) => (
        <article
          key={promo.titleLine1}
          className="relative flex min-h-[250px] overflow-hidden rounded-card bg-surface"
        >
          <span
            aria-hidden="true"
            className="absolute -bottom-[60px] -left-[90px] size-[256px] rounded-full bg-orb"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-[130px] left-[20px] size-[256px] rounded-full bg-orb"
          />
          <ResponsiveImage
            src={artSrc(promo.art)}
            alt=""
            width={640}
            height={640}
            sizes="290px"
            className="relative w-[290px] max-w-[50%] shrink-0 self-stretch rounded-[18px] object-cover"
          />
          <div className="relative flex flex-1 flex-col items-end pt-[37px] pr-[30px] pb-6 text-right">
            <h3 className="text-lg/6 font-bold text-heading">
              {promo.titleLine1} {promo.titleLine2}
            </h3>
            <p className="mt-[9px] text-sm/[22px] text-body">{promo.description}</p>
            <Button asChild className="mt-1 w-[140px] shrink-0 text-sm font-medium">
              <NavLink from="/" to="/" search={promo.href} hash="mercado">
                {promo.cta}
                <ArrowRightIcon size={16} />
              </NavLink>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
