import { useState } from 'react'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  const mock = window.__mock
  if (!mock) return null

  const activeScenario = mock.getScenario()
  const runAndClose = (action: () => void) => () => {
    action()
    setOpen(false)
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 bg-surface-raised px-3 text-xs font-bold shadow-card-m"
          >
            {copy.scenarioPanel.trigger(activeScenario)}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[520px] p-6">
          <DialogTitle>{copy.scenarioPanel.title}</DialogTitle>
          <DialogDescription className="mt-1">{copy.scenarioPanel.description}</DialogDescription>

          <div className="mt-4 max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
            {mock.getScenarios().map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                aria-pressed={activeScenario === scenario.id}
                onClick={() => void mock.setScenario(scenario.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-field border px-3 py-2 text-left text-xs transition-colors',
                  activeScenario === scenario.id
                    ? 'border-primary bg-surface-dark font-bold text-highlight'
                    : 'border-line bg-surface-raised text-foreground hover:border-field',
                )}
              >
                <span>
                  <span className="block">{scenario.label}</span>
                  <span className="block text-[11px] text-body">{scenario.description}</span>
                </span>
                <code className="text-[11px] text-muted-foreground">{scenario.id}</code>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 text-xs font-bold text-foreground">
              {copy.scenarioPanel.actionsTitle}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={runAndClose(() =>
                  mock.changeEdition({
                    nftId: 'emerald-ape-042',
                    editionId: 'emerald-ape-042-1-50',
                    price: '1.35',
                  }),
                )}
              >
                {copy.scenarioPanel.changePrice}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={runAndClose(() => mock.dropSockets({ refuseForMs: 2500 }))}
              >
                {copy.scenarioPanel.dropSockets}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={runAndClose(() => mock.expireSession())}
              >
                {copy.scenarioPanel.expireSession}
              </Button>
              <Button
                type="button"
                className="h-8 px-3 text-xs"
                onClick={() => void mock.reset('default')}
              >
                {copy.scenarioPanel.reset}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
