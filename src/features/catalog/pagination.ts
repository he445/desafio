export type PageItem = { kind: 'page'; page: number } | { kind: 'gap'; key: 'start' | 'end' }

const page = (value: number): PageItem => ({ kind: 'page', page: value })

// At most five page numbers: the first, the last and the ones around the current page.
export function buildPageList(current: number, total: number): PageItem[] {
  if (total <= 5) return Array.from({ length: total }, (_, index) => page(index + 1))
  if (current <= 3)
    return [page(1), page(2), page(3), page(4), { kind: 'gap', key: 'end' }, page(total)]
  if (current >= total - 2) {
    return [
      page(1),
      { kind: 'gap', key: 'start' },
      page(total - 3),
      page(total - 2),
      page(total - 1),
      page(total),
    ]
  }
  return [
    page(1),
    { kind: 'gap', key: 'start' },
    page(current - 1),
    page(current),
    page(current + 1),
    { kind: 'gap', key: 'end' },
    page(total),
  ]
}
