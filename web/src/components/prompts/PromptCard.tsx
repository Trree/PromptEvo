import { Trash2 } from 'lucide-react'
import type { Prompt } from '../../types/prompt'

interface Props {
  item: Prompt
  onClick: () => void
  onDelete: (id: string) => void
}

export function PromptCard({ item, onClick, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-2.5 group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E5E0] bg-[#EDEAE6] group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-200">
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-sm">
            {item.category || 'Prompt'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-md shadow-sm hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <div className="absolute inset-0 pt-10 px-4 pb-4 overflow-hidden">
          <p className="text-[11px] leading-relaxed text-gray-500 font-mono whitespace-pre-wrap break-words">
            {item.content}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#EDEAE6] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg scale-95 group-hover:scale-100 transition-transform duration-200">
            Open
          </span>
        </div>
      </div>
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
        )}
      </div>
    </div>
  )
}
