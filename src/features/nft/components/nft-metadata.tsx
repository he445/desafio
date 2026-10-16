import { Link } from '@tanstack/react-router'
import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { DEFAULT_CATALOG_SEARCH } from '@/contracts'
import { displayTokenId } from '@/lib/format'
import { cn } from '@/lib/utils'

export function NftMetadata({ nft, className }: { nft: Nft; className?: string }) {
  return (
    <dl className={cn('space-y-3 text-[15px]/5 text-muted-foreground', className)}>
      <div>
        <dt className="inline">{copy.detail.tokenIdPrefix} </dt>
        <dd className="inline">{displayTokenId(nft.tokenId)}</dd>
      </div>
      <div>
        <dt className="inline">{copy.detail.collectionPrefix} </dt>
        <dd className="inline">
          <Link
            to="/"
            search={{ ...DEFAULT_CATALOG_SEARCH, collection: nft.collection.id }}
            hash="mercado"
            className="text-highlight hover:underline"
          >
            {nft.collection.name}
          </Link>
        </dd>
      </div>
      <div>
        <dt className="inline">{copy.detail.attributesPrefix} </dt>
        <dd className="inline">{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )
}
