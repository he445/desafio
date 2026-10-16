import { cn } from '@/lib/utils'

export function OptionContent({
  label,
  count,
  active,
}: {
  label: string
  count: number
  active: boolean
}) {
  return (
    <>
      <span>{label}</span>
      <span className={cn('font-bold', active ? 'text-highlight' : 'text-foreground')}>
        ({count})
      </span>
    </>
  )
}

export function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg/4 font-bold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
