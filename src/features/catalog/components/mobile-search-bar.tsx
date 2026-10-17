import { useCallback } from 'react'
import { copy } from '@/content/copy'
import { SearchIcon } from '@/components/icons'
import { applyCatalogChange } from '../search'
import { useCatalogNavigate, useCatalogSearch } from '../hooks/use-catalog-search'
import { useSearchBox } from '../hooks/use-search-box'
import { FiltersSheet } from './filters-sheet'

// The tab bar's central button focuses this field by its id.
export function MobileSearchBar() {
  const search = useCatalogSearch()
  const navigate = useCatalogNavigate()

  // Typing replaces the history entry instead of piling one up per pause.
  const commit = useCallback(
    (q: string | undefined) =>
      navigate((prev) => applyCatalogChange(prev, { q }), { replace: true, keepScroll: true }),
    [navigate],
  )
  const { text, setText, submit } = useSearchBox({ value: search.q, onCommit: commit })

  return (
    <div className="flex h-[45px] gap-2">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-mobile-field bg-surface px-3 focus-within:ring-2 focus-within:ring-primary"
      >
        <SearchIcon size={22} className="shrink-0 text-foreground" />
        <input
          id="mobile-catalog-search"
          type="search"
          enterKeyHint="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={copy.nav.searchPlaceholder}
          aria-label={copy.nav.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-body"
        />
      </form>
      <FiltersSheet />
    </div>
  )
}
