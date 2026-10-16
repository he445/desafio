import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { StarIcon } from '@/components/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCalendarDate, shortenAddress } from '@/lib/format'
import { networkLabel } from '../network'

export function NftStars({ size = 15, rating }: { size?: number; rating: number }) {
  return (
    <span className="flex items-center gap-1 text-amber">
      <span className="sr-only">{copy.detail.ratingOf(rating)}</span>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          size={size}
          className={index < Math.round(rating) ? undefined : 'opacity-30'}
        />
      ))}
    </span>
  )
}

export function NftInfoTabs({ nft }: { nft: Nft }) {
  const [first, second] = nft.longDescription ?? [nft.description]
  const facts = [
    { label: copy.detail.networkLabel, value: copy.detail.network(networkLabel(nft.network)) },
    {
      label: copy.detail.contractLabel,
      value: copy.detail.contract(shortenAddress(nft.contract.address), nft.contract.standard),
    },
    {
      label: copy.detail.royaltiesLabel,
      value: copy.detail.royalties(String(nft.royaltyBps / 100)),
    },
  ]

  return (
    <Tabs defaultValue="details" className="mt-24">
      <TabsList>
        <TabsTrigger value="details">{copy.detail.detailsTab}</TabsTrigger>
        <TabsTrigger value="reviews">{copy.detail.reviewsTab(nft.rating.count)}</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="space-y-3 text-sm/6 text-body">
        <p>{first}</p>
        {second && <p>{second}</p>}
        {facts.map((fact) => (
          <div key={fact.label}>
            <h3 className="font-bold text-foreground">{fact.label}</h3>
            <p>{fact.value}</p>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="reviews">
        <div className="flex items-center gap-3 text-sm text-body">
          <span className="text-base font-bold text-foreground">
            {nft.rating.average.toFixed(1)}
          </span>
          <NftStars rating={nft.rating.average} />
          <span>{copy.detail.reviewsCount(nft.rating.count)}</span>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {nft.reviews.slice(0, 3).map((review) => (
            <li key={`${review.author}-${review.date}`} className="py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">{review.author}</span>
                <NftStars size={12} rating={review.rating} />
                <time dateTime={review.date} className="text-xs text-muted-foreground">
                  {formatCalendarDate(review.date)}
                </time>
              </div>
              <p className="mt-1 text-sm/6 text-body">{review.text}</p>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  )
}
