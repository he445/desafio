import { useState } from 'react'
import type { Order } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { announce } from '@/lib/announcer'
import {
  displayEth,
  displayQuantity,
  displayTokenId,
  formatReceiptDate,
  shortenAddress,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { networkName, providerName } from '../labels'
import { ExplorerDialog } from './explorer-dialog'

interface OrderReceiptProps {
  order: Order
  variant: 'desktop' | 'mobile'
  // The title is the dialog's or sheet's accessible name; inline it is a plain heading.
  title: React.ReactNode
}

// Everything here comes from the receipt copied when the order was created, never from the
// catalog, so a later price change cannot rewrite what was paid.
export function OrderReceipt({ order, variant, title }: OrderReceiptProps) {
  const desktop = variant === 'desktop'
  const { receipt } = order
  const hash = order.transaction?.hash ?? ''

  const copyHash = () => {
    navigator.clipboard
      .writeText(hash)
      .then(() => announce(copy.order.hashCopied))
      .catch(() => announce(copy.order.copyFailed))
  }

  const meta = [
    {
      label: copy.order.txId,
      value: (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{shortenAddress(hash)}</span>
          <button
            type="button"
            onClick={copyHash}
            aria-label={copy.order.copyHash}
            className="inline-flex size-6 items-center justify-center text-highlight"
          >
            <CopyGlyph />
          </button>
        </span>
      ),
    },
    { label: copy.order.date, value: formatReceiptDate(order.updatedAt) },
    { label: copy.order.total, value: displayEth(receipt.total) },
    { label: copy.order.wallet, value: providerName(order) },
  ]

  return (
    <div>
      <div
        className={cn(
          'flex flex-col items-center text-center',
          desktop ? 'h-[156px] pt-[22px]' : 'pt-2 pb-4',
        )}
      >
        <p
          aria-hidden="true"
          className="flex h-20 items-center text-[32px] font-bold tracking-[0.1em] text-primary"
        >
          {copy.order.thankYou}
        </p>
        <div className="mt-4 text-base font-bold text-body">{title}</div>
      </div>

      <div className="border-y border-primary">
        <dl
          className={cn(
            desktop
              ? 'grid h-[65px] grid-cols-[1.4fr_1fr_1fr_1fr] items-center px-9'
              : 'grid grid-cols-2 gap-x-4 gap-y-3 py-4',
          )}
        >
          {meta.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                desktop && index > 0 && 'border-l border-primary pl-4',
                desktop && 'flex h-[31px] flex-col justify-center',
              )}
            >
              <dt className="text-sm">{item.label}</dt>
              <dd className="text-[15px] text-body">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <h3 className={cn('mt-5 text-[15px] font-bold text-heading', desktop && 'pl-11')}>
        {copy.order.detailsTitle}
      </h3>
      <table className={cn('mt-3 w-full text-left', desktop ? 'px-11' : '')}>
        <thead>
          <tr className="border-b border-line text-sm">
            <th scope="col" className={cn('pb-2 font-normal', desktop && 'pl-11')}>
              {copy.cart.colNfts}
            </th>
            <th scope="col" className="pb-2 font-normal">
              {copy.order.editions}
            </th>
            <th scope="col" className={cn('pb-2 text-right font-normal', desktop && 'pr-11')}>
              {copy.cart.subtotal}
            </th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.map((line) => (
            <tr key={line.editionId}>
              <td className={cn('pt-3', desktop && 'pl-11')}>
                <div className="flex items-center gap-3">
                  <ResponsiveImage
                    src={line.image}
                    alt=""
                    width={70}
                    height={70}
                    sizes="70px"
                    className="size-[70px] shrink-0 rounded-card object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-heading">{line.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {displayTokenId(line.tokenId)}{' '}
                      <span className="text-foreground">{displayQuantity(line.quantity)}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td className="pt-3 text-sm">{line.editionName}</td>
              <td
                className={cn(
                  'pt-3 text-right text-lg font-bold whitespace-nowrap text-highlight',
                  desktop && 'pr-11',
                )}
              >
                {displayEth(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl
        className={cn(
          'mt-4 space-y-2 border-b border-line pb-4 text-[15px]',
          desktop ? 'mr-11 ml-auto w-[321px]' : '',
        )}
      >
        <div className="flex justify-between gap-4">
          <dt>{copy.cart.networkFee}</dt>
          <dd className="whitespace-nowrap">{displayEth(receipt.networkFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 font-bold">
          <dt>{copy.order.total}</dt>
          <dd className="whitespace-nowrap text-highlight">{displayEth(receipt.total)}</dd>
        </div>
      </dl>

      <p className={cn('mt-4 text-center text-sm/[22px] text-body', desktop && 'px-11')}>
        {copy.order.confirmedNote(networkName(order))}
      </p>
      <div className={cn('mt-5 flex justify-center', desktop ? 'pb-8' : 'pb-2')}>
        <ExplorerButton order={order} desktop={desktop} />
      </div>
    </div>
  )
}

function ExplorerButton({ order, desktop }: { order: Order; desktop: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="modal"
        className={desktop ? 'h-12 w-[186px]' : 'h-12 w-full'}
        onClick={() => setOpen(true)}
      >
        {copy.order.viewOnEtherscan}
      </Button>
      <ExplorerDialog order={order} open={open} onOpenChange={setOpen} />
    </>
  )
}

function CopyGlyph() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}
