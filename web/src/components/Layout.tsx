import { Plus, Layout as LayoutIcon, Layers, Code2, Trash2 } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CATEGORIES } from '../constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Sidebar({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <aside className="w-52 border-r border-[#E8E5E0] flex flex-col h-screen sticky top-0 bg-[#F6F4F1] shrink-0">
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" /><rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" /><rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" /><rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" /></svg>
        </div>
        <span className="font-bold text-[15px] tracking-tight text-gray-900">OpenPrompt</span>
      </div>
      <div className="flex-1" />
      <div className="p-4"><button onClick={onCreateClick} className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-800 active:scale-95 transition-all"><Plus className="w-4 h-4" /> Create</button></div>
    </aside>
  )
}

export function CategoryTabs({ active, onChange }: { active: string, onChange: (cat: string) => void }) {
  return (
    <div className="flex border-b border-gray-200 mb-7 gap-1">
      {CATEGORIES.map((cat) => (
        <button key={cat} onClick={() => onChange(cat)} className={cn('relative px-3.5 py-2.5 text-sm transition-all whitespace-nowrap', active === cat ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700 font-medium')}>
          {cat}
          {active === cat && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-t-full" />}
        </button>
      ))}
    </div>
  )
}

export function ContentTypeToggle({ value, onChange }: { value: 'prompts' | 'skills', onChange: (v: 'prompts' | 'skills') => void }) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg gap-0.5">
      <button onClick={() => onChange('prompts')} className={cn('px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1', value === 'prompts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}><Layers className="w-3 h-3" /> Prompts</button>
      <button onClick={() => onChange('skills')} className={cn('px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1', value === 'skills' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}><Code2 className="w-3 h-3" /> Skills</button>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3"><LayoutIcon className="w-5 h-5 text-gray-300" /></div>
      <p className="text-sm font-medium text-gray-400">No templates yet</p>
      <p className="text-xs text-gray-300 mt-1">Create your first one</p>
    </div>
  )
}

export function ItemCard({ badge, preview, title, description, id, onClick, onDelete }: {
  badge: string
  preview: string
  title: string
  description?: string
  id: string
  onClick: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-2.5 group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E5E0] bg-[#EDEAE6] group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-200">
        <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-sm">
          {badge}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(id) }}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-md shadow-sm hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <div className="absolute inset-0 pt-10 px-4 pb-4 overflow-hidden text-[11px] leading-relaxed text-gray-500 font-mono whitespace-pre-wrap break-words">
          {preview}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#EDEAE6] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg scale-95 group-hover:scale-100 transition-transform duration-200">Open</span>
        </div>
      </div>
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{title}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{description}</p>}
      </div>
    </div>
  )
}
