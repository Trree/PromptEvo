import { Plus } from 'lucide-react'

interface Props {
  onCreateClick: () => void
}

export function Sidebar({ onCreateClick }: Props) {
  return (
    <aside className="w-52 border-r border-[#E8E5E0] flex flex-col h-screen sticky top-0 bg-[#F6F4F1] shrink-0">
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" />
          </svg>
        </div>
        <span className="font-bold text-[15px] tracking-tight text-gray-900">OpenPrompt</span>
      </div>
      <div className="flex-1" />
      <div className="p-4">
        <button
          onClick={onCreateClick}
          className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-800 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>
    </aside>
  )
}
