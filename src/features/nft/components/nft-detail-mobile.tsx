import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { BuyIcon, StarIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { displayEth } from '@/lib/format'
import type { NftPurchase } from '../hooks/use-nft-purchase'
import { EditionPicker } from './edition-picker'
import { NftHeroMobile } from './nft-hero-mobile'
import { NftMetadata } from './nft-metadata'
import { PurchaseLimitNote } from './purchase-limit-note'

export function NftDetailMobile({ nft, purchase }: { nft: Nft; purchase: NftPurchase }) {
  const price = purchase.selected?.price ?? nft.priceFrom

  return (
    <>
      <NftHeroMobile
        images={nft.images}
        favoriteButton={<FavoriteButton nft={nft} variant="hero" />}
      />
      <div className="relative -mx-6 -mt-[114px] rounded-t-[31px] bg-surface px-6 pt-8 pb-[180px]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-heading">{nft.title}</h1>
          <p className="flex h-[27px] w-20 shrink-0 items-center justify-center gap-1 rounded-[32px] border border-primary">
            <StarIcon size={14} className="text-amber" />
            <span className="sr-only">{copy.detail.ratingOf(nft.rating.average)}</span>
            <span aria-hidden="true" className="text-sm font-medium text-foreground">
              {nft.rating.average.toFixed(1)}
            </span>
            <span className="text-sm text-body">
              <span className="sr-only">{copy.detail.reviewsCount(nft.rating.count)}</span>
              <span aria-hidden="true">({nft.rating.count})</span>
            </span>
          </p>
        </div>
        <p className="mt-3 text-sm/6 text-body">{nft.shortDescriptionMobile ?? nft.description}</p>
        <EditionPicker
          editions={nft.editions}
          selected={purchase.selected}
          requestedUnavailable={purchase.requestedUnavailable}
          onSelect={purchase.selectEdition}
          className="mt-3"
        />
        <PurchaseLimitNote purchase={purchase} className="mt-2" />
        <NftMetadata nft={nft} className="mt-3" />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 h-[164px] rounded-t-[40px] bg-surface px-6 pt-5 pb-[max(36px,env(safe-area-inset-bottom))] shadow-sheet">
        <div className="flex h-[30px] items-center justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-[15px] font-medium text-foreground">
              {copy.detail.qtyMobile}
            </span>
            <QuantityStepper
              variant="bar"
              value={purchase.quantity}
              max={purchase.limit}
              onChange={purchase.setQuantity}
              disabled={!purchase.canBuy}
            />
          </div>
          <p className="text-xl font-bold text-highlight">{displayEth(price)}</p>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button
            type="button"
            variant="ctaMobile"
            className="h-[60px] w-[196px]"
            disabled={!purchase.canBuy || purchase.isAdding}
            onClick={() => void purchase.addToCart({ goToCart: true })}
          >
            {copy.detail.buyMobile}
          </Button>
          <button
            type="button"
            aria-label={copy.detail.addToCart}
            disabled={!purchase.canBuy || purchase.isAdding}
            onClick={() => void purchase.addToCart({ goToCart: false })}
            className="flex size-[60px] items-center justify-center rounded-full bg-surface-raised text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BuyIcon size={20} />
          </button>
        </div>
      </div>
    </>
  )
}
