import { Plus, Layout as LayoutIcon, Layers, Code2 } from 'lucide-react'
import { cn } from '../lib/cn'
import { CATEGORIES } from '../constants'

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
