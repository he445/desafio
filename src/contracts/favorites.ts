import { z } from 'zod'
import { NftSchema } from './nfts'

export const FavoritesResponseSchema = z.object({
  nftIds: z.array(z.string()),
  items: z.array(NftSchema),
})
export type FavoritesResponse = z.infer<typeof FavoritesResponseSchema>
