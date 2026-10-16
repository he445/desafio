import { describe, expect, it } from 'vitest'
import { buildPageList, type PageItem } from './pagination'

function render(current: number, total: number): string {
  return buildPageList(current, total)
    .map((item: PageItem) => (item.kind === 'gap' ? '…' : String(item.page)))
    .join(' ')
}

describe('buildPageList', () => {
  it('lists every page when there are five or fewer', () => {
    expect(render(1, 1)).toBe('1')
    expect(render(2, 3)).toBe('1 2 3')
    expect(render(5, 5)).toBe('1 2 3 4 5')
  })

  it('keeps the first pages and the last one near the start', () => {
    expect(render(1, 6)).toBe('1 2 3 4 … 6')
    expect(render(3, 6)).toBe('1 2 3 4 … 6')
    expect(render(3, 20)).toBe('1 2 3 4 … 20')
  })

  it('keeps the first page and the last ones near the end', () => {
    expect(render(4, 6)).toBe('1 … 3 4 5 6')
    expect(render(6, 6)).toBe('1 … 3 4 5 6')
    expect(render(18, 20)).toBe('1 … 17 18 19 20')
  })

  it('centers the window in the middle', () => {
    expect(render(4, 7)).toBe('1 … 3 4 5 … 7')
    expect(render(10, 20)).toBe('1 … 9 10 11 … 20')
  })

  it('never shows more than five page numbers', () => {
    for (let total = 1; total <= 30; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        const numbers = buildPageList(current, total).filter((item) => item.kind === 'page')
        expect(numbers.length).toBeLessThanOrEqual(5)
        expect(numbers.some((item) => item.page === current)).toBe(true)
      }
    }
  })
})
