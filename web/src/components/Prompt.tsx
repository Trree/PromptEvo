import { useState } from 'react'
import { ChevronLeft, Save, History, X, Trash2 } from 'lucide-react'
import { usePromptVersions } from '../api'
import { CATEGORY_OPTIONS } from '../constants'
import type { Prompt, PromptVersion } from '../types'

// --- Version History ---

export function VersionHistory({ promptId, onClose, onRestore }: {
  promptId: string
  onClose: () => void
  onRestore: (content: string) => void
}) {
  const { data: versions = [], isLoading } = usePromptVersions(promptId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-80 bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">Version History</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && <p className="text-sm text-gray-400 text-center py-8">Loading...</p>}
          {!isLoading && versions.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No history yet</p>}
          {versions.map((v: PromptVersion) => (
            <div key={v.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">v{v.version}</span>
                <span className="text-[10px] text-gray-400">{new Date(v.savedAt).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono line-clamp-3">{v.content}</p>
              <button onClick={() => onRestore(v.content)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-800">Restore</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Prompt Editor ---

export function PromptEditor({ item, onBack, onSave, onDelete }: {
  item: Partial<Prompt>
  onBack: () => void
  onSave: (data: Partial<Prompt>) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState(item)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">{draft.title || 'Untitled'}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.id && (
            <>
              <button onClick={() => { if (confirm('Delete permanently?')) onDelete(item.id!) }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"><Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" /></button>
              <button onClick={() => setShowHistory(true)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><History className="w-4 h-4 text-gray-500" /></button>
            </>
          )}
          <button onClick={() => onSave(draft)} className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition-colors"><Save className="w-3.5 h-3.5" /> Save</button>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-10 space-y-5">
        <input value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="text-3xl font-black text-gray-900 border-none outline-none w-full placeholder:text-gray-200" placeholder="Title..." />
        <select value={draft.category || 'General'} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 bg-white cursor-pointer">
          {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <textarea value={draft.content || ''} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="Content... Use {{variable}}" className="w-full min-h-[480px] bg-gray-50 border border-gray-200 rounded-2xl p-6 outline-none focus:bg-white focus:border-gray-300 transition-all font-mono text-sm leading-relaxed resize-none" />
      </main>
      {showHistory && item.id && <VersionHistory promptId={item.id} onClose={() => setShowHistory(false)} onRestore={(content) => { setDraft({ ...draft, content }); setShowHistory(false) }} />}
    </div>
  )
}
