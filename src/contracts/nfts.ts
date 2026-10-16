import { z } from 'zod'
import { EthAmountSchema, NetworkIdSchema } from './common'

export const EditionSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: EthAmountSchema,
  supply: z.number().int().nullable(),
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
})
export type Edition = z.infer<typeof EditionSchema>

export const NftReviewSchema = z.object({
  author: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  date: z.iso.date(),
})
export type NftReview = z.infer<typeof NftReviewSchema>

export const NftImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
export type NftImage = z.infer<typeof NftImageSchema>

export const NftSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  shortDescriptionMobile: z.string().optional(),
  longDescription: z.tuple([z.string(), z.string()]).optional(),
  collection: z.object({
    id: z.string(),
    name: z.string(),
  }),
  creator: z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
  }),
  category: z.string(),
  network: NetworkIdSchema,
  tokenId: z.string(),
  attributes: z.array(z.string()),
  featured: z.boolean(),
  trending: z.boolean(),
  rare: z.boolean(),
  createdAt: z.iso.datetime(),
  rating: z.object({
    average: z.number(),
    count: z.number().int().nonnegative(),
  }),
  reviews: z.array(NftReviewSchema),
  contract: z.object({
    address: z.string(),
    standard: z.literal('ERC-721'),
  }),
  royaltyBps: z.number().int().nonnegative(),
  compareAtPrice: EthAmountSchema.nullable(),
  images: z.array(NftImageSchema),
  editions: z.array(EditionSchema),
  priceFrom: EthAmountSchema,
  version: z.number().int().positive(),
})
export type Nft = z.infer<typeof NftSchema>

export const CatalogTabSchema = z.enum(['all', 'new', 'trending'])
export type CatalogTab = z.infer<typeof CatalogTabSchema>

export const CatalogSortSchema = z.enum(['recent', 'price_asc', 'price_desc', 'title_asc'])
export type CatalogSort = z.infer<typeof CatalogSortSchema>

export const CatalogStatusSchema = z.enum(['all', 'available', 'sold_out'])
export type CatalogStatus = z.infer<typeof CatalogStatusSchema>

// The router decodes `?q=2024` and `?minPrice=0.5` as numbers before validation.
const SearchTextSchema = z.union([z.string(), z.number(), z.boolean()]).transform(String)
const SearchEthSchema = SearchTextSchema.pipe(EthAmountSchema)

export const CatalogSearchSchema = z.object({
  q: SearchTextSchema.optional().catch(undefined),
  collection: SearchTextSchema.optional().catch(undefined),
  category: SearchTextSchema.optional().catch(undefined),
  network: NetworkIdSchema.optional().catch(undefined),
  tab: CatalogTabSchema.default('all').catch('all'),
  minPrice: SearchEthSchema.optional().catch(undefined),
  maxPrice: SearchEthSchema.optional().catch(undefined),
  status: CatalogStatusSchema.default('all').catch('all'),
  sort: CatalogSortSchema.default('recent').catch('recent'),
  page: z.coerce.number().int().min(1).default(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(9).catch(9),
})
export type CatalogSearch = z.infer<typeof CatalogSearchSchema>

export const DEFAULT_CATALOG_SEARCH: CatalogSearch = {
  tab: 'all',
  status: 'all',
  sort: 'recent',
  page: 1,
  pageSize: 9,
}

export const CatalogFacetsSchema = z.object({
  categories: z.record(z.string(), z.number().int().nonnegative()),
  networks: z.record(z.string(), z.number().int().nonnegative()),
  collections: z.record(z.string(), z.number().int().nonnegative()),
  priceRange: z.object({
    min: EthAmountSchema,
    max: EthAmountSchema,
  }),
})
export type CatalogFacets = z.infer<typeof CatalogFacetsSchema>

export const NftListResponseSchema = z.object({
  items: z.array(NftSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().min(1),
  facets: CatalogFacetsSchema,
  query: CatalogSearchSchema,
})
export type NftListResponse = z.infer<typeof NftListResponseSchema>

export const FeaturedNftsResponseSchema = z.object({
  items: z.array(NftSchema),
})
export type FeaturedNftsResponse = z.infer<typeof FeaturedNftsResponseSchema>
