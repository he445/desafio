import { describe, expect, it } from 'vitest'
import type { CatalogFacets } from '@/contracts'
import { categoryOptions, networkOptions } from './filter-options'

const facets: CatalogFacets = {
  categories: { musica: 7, jogos: 5 },
  networks: { solana: 15 },
  collections: {},
  priceRange: { min: '0.02', max: '12.3' },
}

describe('filter options', () => {
  it('lists the nine categories of the design with the count of each', () => {
    const options = categoryOptions(facets)
    expect(options).toHaveLength(9)
    expect(options.find((option) => option.value === 'musica')).toEqual({
      value: 'musica',
      label: 'Música',
      count: 7,
    })
  })

  it('shows zero for what the other filters leave out', () => {
    expect(categoryOptions(facets).find((option) => option.value === 'fotografia')?.count).toBe(0)
    expect(networkOptions(facets).map(({ value, count }) => [value, count])).toEqual([
      ['ethereum', 0],
      ['polygon', 0],
      ['solana', 15],
    ])
  })
})
