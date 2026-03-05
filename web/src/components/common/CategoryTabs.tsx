import { cn } from '../../lib/cn'
import { CATEGORIES } from '../../constants'

interface Props {
  active: string
  onChange: (cat: string) => void
}

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex border-b border-gray-200 mb-7 gap-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'relative px-3.5 py-2.5 text-sm transition-all whitespace-nowrap',
            active === cat
              ? 'text-gray-900 font-semibold'
              : 'text-gray-500 hover:text-gray-700 font-medium'
          )}
        >
          {cat}
          {active === cat && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  )
}
