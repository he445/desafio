import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { Order } from '@/contracts'
import { copy } from '@/content/copy'
import { DangerIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { useSessionQuery } from '@/features/auth/queries'
import { clearCheckoutAttempt } from '../attempt'
import { useOrderQuery } from '../queries'
import { OrderReceipt } from './order-receipt'

type Variant = 'desktop' | 'mobile'

function cardClass(variant: Variant): string {
  return variant === 'desktop'
    ? 'mx-auto mt-6 w-full max-w-[578px] bg-surface p-8'
    : 'mt-6 rounded-mobile-card bg-surface p-6'
}

export function OrderView({ orderId, variant }: { orderId: string; variant: Variant }) {
  const { data: session } = useSessionQuery()
  const userId = session?.user.id
  if (!userId) return <OrderSkeleton variant={variant} />
  return <OrderLoader userId={userId} orderId={orderId} variant={variant} />
}

function OrderLoader({
  userId,
  orderId,
  variant,
}: {
  userId: string
  orderId: string
  variant: Variant
}) {
  const query = useOrderQuery(userId, orderId)
  const order = query.data
  const finished = order !== undefined && order.status !== 'pending'

  // The socket may have been down when the order finished; REST then frees the key too.
  useEffect(() => {
    if (finished) clearCheckoutAttempt(userId)
  }, [finished, userId])

  if (order?.status === 'pending') return <PendingCard variant={variant} />
  if (order?.status === 'rejected') return <RejectedCard order={order} variant={variant} />
  if (order?.status === 'confirmed') return <ConfirmedOrder order={order} variant={variant} />
  if (query.isPending) return <OrderSkeleton variant={variant} />

  const error = query.error
  const status = isApiError(error) ? error.status : undefined
  if (status === 403 || status === 404) {
    return (
      <div className={cn(cardClass(variant), 'text-center')}>
        <h2 className="text-lg font-bold text-heading">
          {status === 403 ? copy.order.forbidden : copy.order.notFound}
        </h2>
        <Button asChild className="mt-6">
          <Link to="/" hash="mercado">
            {copy.order.backToMarket}
          </Link>
        </Button>
      </div>
    )
  }
  return (
    <div role="alert" className={cn(cardClass(variant), 'text-center')}>
      <h2 className="text-lg font-bold text-heading">{copy.order.errorTitle}</h2>
      <p className="mt-2 text-sm text-body">
        {isApiError(error) ? error.message : copy.states.routeErrorFallback}
      </p>
      <Button type="button" className="mt-6" onClick={() => void query.refetch()}>
        {copy.states.retry}
      </Button>
    </div>
  )
}

function PendingCard({ variant }: { variant: Variant }) {
  return (
    <div aria-live="polite" className={cn(cardClass(variant), 'text-center')}>
      <span
        aria-hidden="true"
        className="mx-auto block size-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent motion-reduce:animate-none"
      />
      <h2 className="mt-4 text-base font-bold text-heading">{copy.order.pendingTitle}</h2>
      <p className="mt-2 text-sm text-body">{copy.order.pendingBody}</p>
    </div>
  )
}

function RejectedCard({ order, variant }: { order: Order; variant: Variant }) {
  const reason = order.rejectionReason
    ? copy.order.rejectionReasons[order.rejectionReason]
    : copy.order.rejectionFallback
  return (
    <div role="alert" className={cn(cardClass(variant), 'text-center')}>
      <DangerIcon size={32} className="mx-auto text-coral" />
      <h2 className="mt-4 text-base font-bold text-heading">{copy.order.rejectedTitle}</h2>
      <p className="mt-2 text-sm text-body">{reason}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link to="/cart">{copy.order.backToCart}</Link>
        </Button>
        <Button asChild>
          <Link to="/checkout">{copy.order.tryAgain}</Link>
        </Button>
      </div>
    </div>
  )
}

function receiptShownKey(orderId: string): string {
  return `receipt-shown:${orderId}`
}

function receiptAlreadyShown(orderId: string): boolean {
  try {
    return window.sessionStorage.getItem(receiptShownKey(orderId)) !== null
  } catch {
    return false
  }
}

// The receipt opens by itself once per order; after that it stays one button away.
function useReceiptAutoOpen(orderId: string) {
  const [open, setOpen] = useState(() => !receiptAlreadyShown(orderId))
  useEffect(() => {
    try {
      window.sessionStorage.setItem(receiptShownKey(orderId), '1')
    } catch {
      // Without storage the receipt opens again on the next visit.
    }
  }, [orderId])
  return [open, setOpen] as const
}

function ConfirmedOrder({ order, variant }: { order: Order; variant: Variant }) {
  const [open, setOpen] = useReceiptAutoOpen(order.id)
  const desktop = variant === 'desktop'

  return (
    <>
      <div
        className={cn(
          desktop
            ? 'mx-auto mt-6 w-full max-w-[578px] bg-surface'
            : 'mt-6 rounded-mobile-card bg-surface p-6',
        )}
      >
        <OrderReceipt
          order={order}
          variant={variant}
          title={<h2>{copy.order.confirmedHeadline}</h2>}
        />
        <div className={cn('flex justify-center', desktop ? 'pb-8' : 'pt-2')}>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            {copy.order.viewReceipt}
          </Button>
        </div>
      </div>

      {desktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[578px]" aria-describedby={undefined}>
            <OrderReceipt
              order={order}
              variant="desktop"
              title={
                <DialogTitle className="text-base font-bold text-body">
                  {copy.order.confirmedHeadline}
                </DialogTitle>
              }
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent aria-describedby={undefined}>
            <OrderReceipt
              order={order}
              variant="mobile"
              title={
                <SheetTitle className="text-base font-bold text-body">
                  {copy.order.confirmedHeadline}
                </SheetTitle>
              }
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

function OrderSkeleton({ variant }: { variant: Variant }) {
  return (
    <div aria-busy="true" className={cn(cardClass(variant))}>
      <p className="sr-only">{copy.order.loading}</p>
      <div aria-hidden="true" className="flex flex-col items-center">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="mt-4 h-5 w-56 rounded-field" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full rounded-field" />
      </div>
    </div>
  )
}
