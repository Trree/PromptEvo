import { useState } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import type { Skill } from '../types'

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
