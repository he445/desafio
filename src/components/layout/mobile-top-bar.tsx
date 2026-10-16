import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { copy } from '@/content/copy'
import { ChevronLeftIcon } from '@/components/icons'

export function MobileTopBar({ title }: { title: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  const handleBack = () => {
    if (canGoBack) router.history.back()
    else void navigate({ to: '/' })
  }

  return (
    <div className="grid grid-cols-[35px_1fr_35px] items-center pt-[max(24px,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={handleBack}
        aria-label={copy.a11y.back}
        className="flex h-[35px] w-[35px] items-center justify-center rounded-full border border-line bg-surface-raised text-foreground"
      >
        <ChevronLeftIcon size={20} />
      </button>
      <h1 className="text-center text-xl font-bold text-heading">{title}</h1>
      <span aria-hidden="true" />
    </div>
  )
}
