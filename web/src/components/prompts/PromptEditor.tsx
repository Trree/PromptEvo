import { useState } from 'react'
import { ChevronLeft, Save, History } from 'lucide-react'
import { VersionHistory } from './VersionHistory'
import { CATEGORY_OPTIONS } from '../../constants'
import type { Prompt } from '../../types/prompt'

interface Props {
  item: Partial<Prompt>
  onBack: () => void
  onSave: (data: Partial<Prompt>) => void
}

export function PromptEditor({ item, onBack, onSave }: Props) {
  const [draft, setDraft] = useState(item)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">
            {draft.title || 'Untitled'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.id && (
            <button
              onClick={() => setShowHistory(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <button
            onClick={() => onSave(draft)}
            className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-10 space-y-5">
        <input
          value={draft.title || ''}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="text-3xl font-black text-gray-900 border-none outline-none w-full placeholder:text-gray-200"
          placeholder="Give it a title..."
        />
        <select
          value={draft.category || 'General'}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 bg-white cursor-pointer"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <textarea
          value={draft.content || ''}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          placeholder="Write your prompt here... Use {{variable}} syntax for variables."
          className="w-full min-h-[480px] bg-gray-50 border border-gray-200 rounded-2xl p-6 outline-none focus:bg-white focus:border-gray-300 transition-all font-mono text-sm leading-relaxed resize-none"
        />
      </main>
      {showHistory && item.id && (
        <VersionHistory
          promptId={item.id}
          onClose={() => setShowHistory(false)}
          onRestore={(content) => {
            setDraft({ ...draft, content })
            setShowHistory(false)
          }}
        />
      )}
    </div>
  )
}
