import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-right"
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
