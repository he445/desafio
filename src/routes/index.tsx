import { createFileRoute, Link } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'

function HomePage() {
  return (
    <section className="space-y-4">
      <p className="text-sm font-medium tracking-[0.1em]">{copy.home.heroDesktop.eyebrow}</p>
      <h1 className="text-heading text-[28px] font-bold lg:text-[43px]/[70px]">
        {copy.home.heroDesktop.titleLine1} {copy.home.heroDesktop.titleLine2}
      </h1>
      <p className="text-body max-w-[557px] text-sm/6">{copy.home.heroDesktop.description}</p>
      <div className="pt-4">
        <Button asChild size="hero">
          <Link to="/cart">{copy.home.heroDesktop.cta}</Link>
        </Button>
      </div>
    </section>
  )
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Início | Kurio' }],
  }),
  component: HomePage,
})
