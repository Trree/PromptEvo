import { useState } from 'react'
import { Trash2, ChevronLeft, Save } from 'lucide-react'
import type { Skill } from '../types'

// --- Skill Card ---

export function SkillCard({ item, onClick, onDelete }: {
  item: Skill
  onClick: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-2.5 group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E5E0] bg-[#EDEAE6] group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-200">
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-sm">Skill</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-md shadow-sm hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <div className="absolute inset-0 pt-10 px-4 pb-4 overflow-hidden text-[11px] leading-relaxed text-gray-500 font-mono whitespace-pre-wrap break-words">
          {item.manifest || item.description}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#EDEAE6] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg scale-95 group-hover:scale-100 transition-transform duration-200">Open</span>
        </div>
      </div>
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
        {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
      </div>
    </div>
  )
}

// --- Skill Editor ---

export function SkillEditor({ item, onBack, onSave }: {
  item: Partial<Skill>
  onBack: () => void
  onSave: (data: Partial<Skill>) => void
}) {
  const [draft, setDraft] = useState(item)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">{draft.name || 'New Skill'}</span>
        </div>
        <button onClick={() => onSave(draft)} className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition-colors"><Save className="w-3.5 h-3.5" /> Save</button>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-10 space-y-5">
        <input value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="text-3xl font-black text-gray-900 border-none outline-none w-full placeholder:text-gray-200" placeholder="Skill name..." />
        <input value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 w-full" placeholder="Description..." />
        <textarea value={draft.manifest || ''} onChange={(e) => setDraft({ ...draft, manifest: e.target.value })} placeholder="JSON manifest..." className="w-full min-h-[480px] bg-gray-50 border border-gray-200 rounded-2xl p-6 outline-none focus:bg-white focus:border-gray-300 transition-all font-mono text-sm leading-relaxed resize-none" />
      </main>
    </div>
  )
}
