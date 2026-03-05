import { X } from 'lucide-react'
import { usePromptVersions } from '../../hooks/usePrompts'
import type { PromptVersion } from '../../types/prompt'

interface Props {
  promptId: string
  onClose: () => void
  onRestore: (content: string) => void
}

export function VersionHistory({ promptId, onClose, onRestore }: Props) {
  const { data: versions = [], isLoading } = usePromptVersions(promptId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-80 bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">Version History</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && <p className="text-sm text-gray-400 text-center py-8">Loading...</p>}
          {!isLoading && versions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No history yet</p>
          )}
          {versions.map((v: PromptVersion) => (
            <div key={v.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">v{v.version}</span>
                <span className="text-[10px] text-gray-400">
                  {new Date(v.savedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono line-clamp-3">{v.content}</p>
              <button
                onClick={() => onRestore(v.content)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Restore this version
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
