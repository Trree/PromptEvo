import { Layers, Code2 } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Props {
  value: 'prompts' | 'skills'
  onChange: (v: 'prompts' | 'skills') => void
}

export function ContentTypeToggle({ value, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg gap-0.5">
      <button
        onClick={() => onChange('prompts')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1',
          value === 'prompts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Layers className="w-3 h-3" /> Prompts
      </button>
      <button
        onClick={() => onChange('skills')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1',
          value === 'skills' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Code2 className="w-3 h-3" /> Skills
      </button>
    </div>
  )
}
