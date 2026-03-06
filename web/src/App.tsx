import { useState, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar, CategoryTabs, ContentTypeToggle, EmptyState, ItemCard } from './components/Layout'
import { PromptEditor } from './components/Prompt'
import { SkillEditor } from './components/Skill'
import { useEntity } from './api'
import type { Prompt, Skill } from './types'

const queryClient = new QueryClient()

function MainApp() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [contentType, setContentType] = useState<'prompts' | 'skills'>('prompts')
  const [selectedPrompt, setSelectedPrompt] = useState<Partial<Prompt> | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<Partial<Skill> | null>(null)

  const promptApi = useEntity<Prompt>('prompts')
  const skillApi = useEntity<Skill>('skills')

  const { data: prompts = [] } = promptApi.list()
  const { data: skills = [] } = skillApi.list()
  const savePrompt = promptApi.save()
  const deletePrompt = promptApi.remove()
  const hidePrompt = promptApi.hide()
  const saveSkill = skillApi.save()
  const deleteSkill = skillApi.remove()
  const hideSkill = skillApi.hide()

  const filteredItems = useMemo(() => {
    const items = contentType === 'prompts' ? prompts : skills
    // We only show non-hidden items by default (backend already filters, but for safety)
    const visibleItems = items.filter(item => !item.isHidden)
    if (activeCategory === 'All') return visibleItems
    return visibleItems.filter((item) => (item as Prompt).category === activeCategory)
  }, [contentType, prompts, skills, activeCategory])

  const handleCreate = () => {
    if (contentType === 'prompts') {
      setSelectedPrompt({ name: `p-${Date.now()}`, title: '', content: '', category: 'General' })
    } else {
      setSelectedSkill({ name: '', description: '', manifest: '' })
    }
  }

  if (selectedPrompt) return <PromptEditor item={selectedPrompt} onBack={() => setSelectedPrompt(null)} onSave={(data) => savePrompt.mutate(data, { onSuccess: () => setSelectedPrompt(null) })} onDelete={(id) => deletePrompt.mutate(id, { onSuccess: () => setSelectedPrompt(null) })} />
  if (selectedSkill) return <SkillEditor item={selectedSkill} onBack={() => setSelectedSkill(null)} onSave={(data) => saveSkill.mutate(data, { onSuccess: () => setSelectedSkill(null) })} onDelete={(id) => deleteSkill.mutate(id, { onSuccess: () => setSelectedSkill(null) })} />

  return (
    <div className="min-h-screen bg-[#F6F4F1] flex text-gray-900 font-sans">
      <Sidebar onCreateClick={handleCreate} />
      <main className="flex-1 px-8 py-7 overflow-y-auto">
        <div className="flex items-center justify-end mb-5">
          <ContentTypeToggle value={contentType} onChange={setContentType} />
        </div>
        <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {contentType === 'prompts'
            ? (filteredItems as Prompt[]).map(p => (
                <ItemCard key={p.id} id={p.id} badge={p.category || 'Prompt'} preview={p.content} title={p.title || p.name} description={p.description} onClick={() => setSelectedPrompt(p)} onDelete={id => deletePrompt.mutate(id)} onHide={id => hidePrompt.mutate(id)} />
              ))
            : (filteredItems as Skill[]).map(s => (
                <ItemCard key={s.id} id={s.id} badge="Skill" preview={s.manifest || s.description} title={s.name} description={s.description} onClick={() => setSelectedSkill(s)} onDelete={id => deleteSkill.mutate(id)} onHide={id => hideSkill.mutate(id)} />
              ))
          }
          {filteredItems.length === 0 && <EmptyState />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  )
}
