import { CatalogSortSchema, type CatalogSort } from '@/contracts'
import { copy } from '@/content/copy'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SortSelectProps {
  value: CatalogSort
  onChange: (sort: CatalogSort) => void
  // The toolbar shows it as plain text with a chevron; the filter sheet shows a field.
  bare?: boolean
}

export function SortSelect({ value, onChange, bare = false }: SortSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const sort = CatalogSortSchema.safeParse(next)
        if (sort.success) onChange(sort.data)
      }}
    >
      <SelectTrigger
        aria-label={copy.home.sortLabel}
        iconSize={bare ? 16 : 20}
        className={cn(
          bare && 'h-auto w-auto gap-2 border-0 p-0 text-[15px] focus-visible:ring-offset-2',
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {copy.home.sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
