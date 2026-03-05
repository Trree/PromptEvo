import { Layout } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
        <Layout className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-400">No templates yet</p>
      <p className="text-xs text-gray-300 mt-1">Create your first one</p>
    </div>
  )
}
