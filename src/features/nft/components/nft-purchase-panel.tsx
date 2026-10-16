import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { displayEth } from '@/lib/format'
import type { NftPurchase } from '../hooks/use-nft-purchase'
import { EditionPicker } from './edition-picker'
import { NftStars } from './nft-info-tabs'
import { NftMetadata } from './nft-metadata'
import { NftShare } from './nft-share'
import { PurchaseLimitNote } from './purchase-limit-note'

export function NftPurchasePanel({ nft, purchase }: { nft: Nft; purchase: NftPurchase }) {
  const price = purchase.selected?.price ?? nft.priceFrom

  return (
    <div className="min-w-0">
      <h1 className="text-[28px] font-bold text-heading">{nft.title}</h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[22px]/4 font-bold text-highlight">{displayEth(price)}</p>
        <div className="flex items-center gap-3 text-[15px] text-foreground">
          <NftStars rating={nft.rating.average} />
          <span>{copy.detail.reviewsCount(nft.rating.count)}</span>
        </div>
      </div>
      <hr className="mt-5 border-line" />
      <h2 className="mt-[13px] text-[15px] font-bold text-foreground">{copy.detail.aboutLabel}</h2>
      <p className="mt-3 text-sm/[22px] text-body">{nft.description}</p>
      <EditionPicker
        editions={nft.editions}
        selected={purchase.selected}
        requestedUnavailable={purchase.requestedUnavailable}
        onSelect={purchase.selectEdition}
        className="mt-[13px]"
      />
      <div className="mt-[14px] flex flex-wrap items-center justify-between gap-4">
        <QuantityStepper
          value={purchase.quantity}
          max={purchase.limit}
          onChange={purchase.setQuantity}
          disabled={!purchase.canBuy}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="detail"
            className="text-sm"
            disabled={!purchase.canBuy || purchase.isAdding}
            onClick={() => void purchase.addToCart({ goToCart: true })}
          >
            {copy.detail.buyDesktop}
          </Button>
          <FavoriteButton nft={nft} variant="detail" />
        </div>
      </div>
      <PurchaseLimitNote purchase={purchase} className="mt-2" />
      <NftMetadata nft={nft} className="mt-[14px]" />
      <NftShare title={nft.title} />
    </div>
  )
}
