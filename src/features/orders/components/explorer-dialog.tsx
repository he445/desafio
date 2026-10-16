import type { Order } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { networkName } from '../labels'

interface ExplorerDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}

// The simulated chain has no public explorer, so the link opens this view and never leaves.
export function ExplorerDialog({ order, open, onOpenChange }: ExplorerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 pb-0">
        <DialogTitle>{copy.order.explorerTitle}</DialogTitle>
        <DialogDescription className="mt-3">{copy.order.explorerDescription}</DialogDescription>
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{copy.order.explorerHash}</dt>
            <dd className="font-mono break-all text-body">{order.transaction?.hash}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{copy.order.explorerNetwork}</dt>
            <dd className="text-body">{networkName(order)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{copy.order.explorerStatus}</dt>
            <dd className="text-body">{copy.order.statusConfirmed}</dd>
          </div>
        </dl>
        <div className="mt-6 mb-6 flex justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {copy.order.close}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
