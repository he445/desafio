import { describe, expect, it } from 'vitest'
import { CatalogSearchSchema } from './nfts'

describe('CatalogSearchSchema', () => {
  it('keeps text and price filters that the router decoded as numbers', () => {
    const search = CatalogSearchSchema.parse({ q: 2024, minPrice: 0.5, maxPrice: 12.3, page: 2 })
    expect(search).toMatchObject({ q: '2024', minPrice: '0.5', maxPrice: '12.3', page: 2 })
  })

  it('falls back to defaults instead of throwing on hand-edited URLs', () => {
    const search = CatalogSearchSchema.parse({
      tab: 'popular',
      sort: 'cheapest',
      page: -3,
      pageSize: 500,
      minPrice: '1,5',
      network: 'bitcoin',
      q: { nested: true },
    })
    expect(search).toEqual({ tab: 'all', status: 'all', sort: 'recent', page: 1, pageSize: 9 })
  })
})
