import { useState, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/layout/Sidebar'
import { CategoryTabs } from './components/common/CategoryTabs'
import { ContentTypeToggle } from './components/common/ContentTypeToggle'
import { EmptyState } from './components/common/EmptyState'
import { PromptCard } from './components/prompts/PromptCard'
import { PromptEditor } from './components/prompts/PromptEditor'
import { SkillCard } from './components/skills/SkillCard'
import { SkillEditor } from './components/skills/SkillEditor'
import { usePrompts, useSavePrompt, useDeletePrompt } from './hooks/usePrompts'
import { useSkills, useSaveSkill, useDeleteSkill } from './hooks/useSkills'
import type { Prompt } from './types/prompt'
import type { Skill } from './types/skill'

const queryClient = new QueryClient()

function MainApp() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [contentType, setContentType] = useState<'prompts' | 'skills'>('prompts')
  const [selectedPrompt, setSelectedPrompt] = useState<Partial<Prompt> | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<Partial<Skill> | null>(null)

  const { data: prompts = [] } = usePrompts()
  const { data: skills = [] } = useSkills()
  const savePrompt = useSavePrompt()
  const deletePrompt = useDeletePrompt()
  const saveSkill = useSaveSkill()
  const deleteSkill = useDeleteSkill()

  const filteredItems = useMemo(() => {
    const items = contentType === 'prompts' ? prompts : skills
    if (activeCategory === 'All') return items
    return items.filter((item) => (item as Prompt).category === activeCategory)
  }, [contentType, prompts, skills, activeCategory])

  const handleCreate = () => {
    if (contentType === 'prompts') {
      setSelectedPrompt({ name: `prompt-${Date.now()}`, title: '', content: '', category: 'General' })
    } else {
      setSelectedSkill({ name: '', description: '', manifest: '' })
    }
  }

  if (selectedPrompt) {
    return (
      <PromptEditor
        item={selectedPrompt}
        onBack={() => setSelectedPrompt(null)}
        onSave={(data) => {
          savePrompt.mutate(data, { onSuccess: () => setSelectedPrompt(null) })
        }}
      />
    )
  }

  if (selectedSkill) {
    return (
      <SkillEditor
        item={selectedSkill}
        onBack={() => setSelectedSkill(null)}
        onSave={(data) => {
          saveSkill.mutate(data, { onSuccess: () => setSelectedSkill(null) })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F4F1] flex text-gray-900 font-sans">
      <Sidebar onCreateClick={handleCreate} />
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="px-8 py-7">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[28px] font-black text-gray-900 tracking-tight" />
            <ContentTypeToggle value={contentType} onChange={setContentType} />
          </div>
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {contentType === 'prompts'
              ? (filteredItems as Prompt[]).map((item) => (
                  <PromptCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedPrompt(item)}
                    onDelete={(id) => deletePrompt.mutate(id)}
                  />
                ))
              : (filteredItems as Skill[]).map((item) => (
                  <SkillCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedSkill(item)}
                    onDelete={(id) => deleteSkill.mutate(id)}
                  />
                ))}
            {filteredItems.length === 0 && <EmptyState />}
          </div>
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
