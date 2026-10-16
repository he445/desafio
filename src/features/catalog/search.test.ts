import { describe, expect, it } from 'vitest'
import { CatalogSearchSchema, DEFAULT_CATALOG_SEARCH, type CatalogSearch } from '@/contracts'
import {
  applyCatalogChange,
  clearCatalogFilters,
  hasActiveFilters,
  normalizeQuery,
  toPage,
} from './search'

const onPageThree: CatalogSearch = { ...DEFAULT_CATALOG_SEARCH, category: 'musica', page: 3 }

describe('catalog search state', () => {
  it('goes back to the first page whenever the view changes', () => {
    expect(applyCatalogChange(onPageThree, { network: 'solana' })).toMatchObject({
      category: 'musica',
      network: 'solana',
      page: 1,
    })
    expect(applyCatalogChange(onPageThree, { sort: 'price_asc' }).page).toBe(1)
    expect(applyCatalogChange(onPageThree, { tab: 'trending' }).page).toBe(1)
  })

  it('removes a filter when the change sets it to undefined', () => {
    const next = applyCatalogChange(onPageThree, { category: undefined })
    expect(next.category).toBeUndefined()
    expect(CatalogSearchSchema.parse(next)).toEqual(DEFAULT_CATALOG_SEARCH)
  })

  it('only moves the page number when paginating', () => {
    expect(toPage(onPageThree, 4)).toEqual({ ...onPageThree, page: 4 })
  })

  it('tells the default view from a filtered one', () => {
    expect(hasActiveFilters(DEFAULT_CATALOG_SEARCH)).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_CATALOG_SEARCH, sort: 'title_asc', page: 2 })).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_CATALOG_SEARCH, q: 'ape' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_CATALOG_SEARCH, minPrice: '0.5' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_CATALOG_SEARCH, tab: 'new' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_CATALOG_SEARCH, status: 'sold_out' })).toBe(true)
  })

  it('clears the filters but keeps the ordering and the page size', () => {
    const filtered: CatalogSearch = {
      ...onPageThree,
      q: 'ape',
      tab: 'new',
      sort: 'price_desc',
      pageSize: 12,
    }
    expect(clearCatalogFilters(filtered)).toEqual({
      ...DEFAULT_CATALOG_SEARCH,
      sort: 'price_desc',
      pageSize: 12,
    })
  })

  it('writes an empty search box as no search at all', () => {
    expect(normalizeQuery('  ape  ')).toBe('ape')
    expect(normalizeQuery('   ')).toBeUndefined()
    expect(normalizeQuery('')).toBeUndefined()
  })
})
