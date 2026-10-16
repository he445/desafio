import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useIsDesktop } from '@/lib/use-media-query'

export function Toaster(props: ToasterProps) {
  const isDesktop = useIsDesktop()

  return (
    <Sonner
      theme="dark"
      position={isDesktop ? 'top-right' : 'top-center'}
      // The phone screens keep back and favorite at the top; a toast over them would block the
      // retry right after a failure, so it starts 12 px below that row.
      mobileOffset={{ top: 'calc(max(24px, env(safe-area-inset-top)) + 47px)' }}
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-surface-raised border border-line text-foreground rounded-card font-sans text-sm shadow-card-m',
          description: 'text-body',
          actionButton: 'bg-primary text-ink font-bold rounded-field px-3 py-1 text-xs',
          cancelButton: 'bg-surface text-body rounded-field px-3 py-1 text-xs',
        },
      }}
      {...props}
    />
  )
}
