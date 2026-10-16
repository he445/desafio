import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

declare global {
  interface Window {
    __hideScenarioPanel?: boolean
  }
}

export function ScenarioPanel() {
  const [open, setOpen] = useState(false)

  if (
    import.meta.env.VITE_API_MOCKING !== 'enabled' ||
    (typeof window !== 'undefined' && window.__hideScenarioPanel)
  ) {
    return null
  }

  const mock = typeof window !== 'undefined' ? window.__mock : undefined
  if (!mock) return null

  const activeScenario = mock.getScenario()
  const scenarios = mock.getScenarios()

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 bg-surface-raised px-3 text-xs font-bold shadow-card-m"
          >
            Cenários ({activeScenario})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[520px] p-6">
          <DialogTitle>Painel de Cenários (MSW)</DialogTitle>
          <DialogDescription className="mt-1">
            Selecione um cenário determinístico, restaure o banco ou dispare eventos em tempo real.
          </DialogDescription>

          <div className="mt-4 max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  void mock.setScenario(sc.id)
                }}
                className={`flex w-full items-center justify-between rounded-field border px-3 py-2 text-left text-xs transition-colors ${
                  activeScenario === sc.id
                    ? 'border-primary bg-surface-dark text-highlight font-bold'
                    : 'border-line bg-surface-raised text-foreground hover:border-field'
                }`}
              >
                <div>
                  <div>{sc.label}</div>
                  <div className="text-[11px] text-body">{sc.description}</div>
                </div>
                <code className="text-[11px] text-muted-foreground">{sc.id}</code>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-bold text-foreground">Ações em tempo real e sessão</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  mock.changeEdition({
                    nftId: 'emerald-ape-042',
                    editionId: 'emerald-ape-042-1-50',
                    price: '1.35',
                  })
                  setOpen(false)
                }}
              >
                Alterar preço Emerald Ape (1.35 ETH)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  mock.dropSockets({ refuseForMs: 2500 })
                  setOpen(false)
                }}
              >
                Derrubar WebSocket (2,5 s)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  mock.expireSession()
                  setOpen(false)
                }}
              >
                Expirar sessão atual
              </Button>
              <Button
                type="button"
                variant="default"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  void mock.reset('default')
                }}
              >
                Resetar banco (seed)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
