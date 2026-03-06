import { useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setRuntimeApiKey, useEntity } from './api'
import { AssetDetailPage } from './components/AssetDetailPage'
import {
  AssetLibrary,
  type AssetSortMode,
  type AssetViewMode,
  type LibrarySection,
} from './components/AssetLibrary'
import { AssetEditorPage } from './components/AssetEditorPage'
import type { Asset, AssetDraft, AssetType, Prompt, Skill } from './types'

const queryClient = new QueryClient()

type Page = 'library' | 'detail' | 'edit'

const FAVORITES_KEY = 'asset-manager:favorites'
const RECENT_KEY = 'asset-manager:recent'
const CUSTOM_TAGS_KEY = 'asset-manager:custom-tags'
const ADMIN_KEY_STORAGE = 'asset-manager:admin-key'

const DEFAULT_PROMPT_COLLECTION = 'General'
const DEFAULT_SKILL_COLLECTION = 'local'

function safeReadStringArray(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return []
  }
}

function safeReadString(key: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function safeReadTagMap(key: string): Record<string, string[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    return Object.entries(parsed).reduce<Record<string, string[]>>((acc, [assetId, value]) => {
      if (Array.isArray(value)) {
        const tags = value.filter((tag): tag is string => typeof tag === 'string')
        if (tags.length > 0) acc[assetId] = normalizeTags(tags)
      }
      return acc
    }, {})
  } catch {
    return {}
  }
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12)
    )
  )
}

function parseSerializedVariables(raw: string) {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string').map((entry) => `{{${entry}}}`)
  } catch {
    return []
  }
}

function extractSummary(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  if (compact.length <= 140) return compact
  return `${compact.slice(0, 137)}...`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureUniqueKey(baseKey: string, existing: Set<string>) {
  if (!existing.has(baseKey)) return baseKey

  let counter = 2
  let candidate = `${baseKey}-${counter}`
  while (existing.has(candidate)) {
    counter += 1
    candidate = `${baseKey}-${counter}`
  }
  return candidate
}

function createDraft(type: AssetType): AssetDraft {
  const now = Date.now()
  return {
    type,
    id: undefined,
    key: type === 'prompt' ? `prompt-${now}` : `skill-${now}`,
    title: '',
    summary: '',
    content: '',
    tags: [],
    collection: type === 'prompt' ? DEFAULT_PROMPT_COLLECTION : DEFAULT_SKILL_COLLECTION,
    version: 1,
  }
}

function toAssetDraft(asset: Asset): AssetDraft {
  return {
    id: asset.id,
    type: asset.type,
    key: asset.key,
    title: asset.title,
    summary: asset.summary,
    content: asset.content,
    tags: asset.tags,
    collection: asset.collection,
    version: asset.version,
  }
}

function buildAssetFromPrompt(prompt: Prompt, customTags: string[] = []): Asset {
  const derivedTags = normalizeTags([
    ...(prompt.category ? [prompt.category] : []),
    ...parseSerializedVariables(prompt.variables),
  ])

  return {
    id: prompt.id,
    key: prompt.name,
    type: 'prompt',
    title: prompt.title || prompt.name,
    summary: prompt.description?.trim() || extractSummary(prompt.content),
    content: prompt.content,
    tags: normalizeTags([...derivedTags, ...customTags]),
    collection: prompt.category?.trim() || DEFAULT_PROMPT_COLLECTION,
    updatedAt: prompt.updatedAt,
    version: prompt.version,
  }
}

function buildAssetFromSkill(skill: Skill, customTags: string[] = []): Asset {
  const derivedTags = normalizeTags([skill.type || DEFAULT_SKILL_COLLECTION, skill.isActive ? 'active' : 'inactive'])

  return {
    id: skill.id,
    key: skill.name,
    type: 'skill',
    title: skill.name,
    summary: skill.description?.trim() || extractSummary(skill.manifest),
    content: skill.manifest,
    tags: normalizeTags([...derivedTags, ...customTags]),
    collection: skill.type || DEFAULT_SKILL_COLLECTION,
    updatedAt: skill.updatedAt,
    version: 1,
  }
}

function MainApp() {
  const [page, setPage] = useState<Page>('library')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<AssetDraft | null>(null)

  const [sidebarSection, setSidebarSection] = useState<LibrarySection>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | AssetType>('all')
  const [sortMode, setSortMode] = useState<AssetSortMode>('updated')
  const [viewMode, setViewMode] = useState<AssetViewMode>('grid')
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => safeReadStringArray(FAVORITES_KEY))
  const [recentIds, setRecentIds] = useState<string[]>(() => safeReadStringArray(RECENT_KEY))
  const [customTags, setCustomTags] = useState<Record<string, string[]>>(() =>
    safeReadTagMap(CUSTOM_TAGS_KEY)
  )
  const [adminKey, setAdminKey] = useState<string>(() => safeReadString(ADMIN_KEY_STORAGE))
  const canWrite = adminKey.trim().length > 0

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

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds))
  }, [favoriteIds])

  useEffect(() => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds))
  }, [recentIds])

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(customTags))
  }, [customTags])

  useEffect(() => {
    setRuntimeApiKey(adminKey)
    window.localStorage.setItem(ADMIN_KEY_STORAGE, adminKey)
  }, [adminKey])

  const allAssets = useMemo<Asset[]>(() => {
    const promptAssets = prompts
      .filter((prompt) => !prompt.isHidden)
      .map((prompt) => buildAssetFromPrompt(prompt, customTags[prompt.id]))

    const skillAssets = skills
      .filter((skill) => !skill.isHidden)
      .map((skill) => buildAssetFromSkill(skill, customTags[skill.id]))

    return [...promptAssets, ...skillAssets]
  }, [prompts, skills, customTags])

  const collectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    allAssets.forEach((asset) => {
      counts.set(asset.collection, (counts.get(asset.collection) ?? 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allAssets])

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    allAssets.forEach((asset) => {
      asset.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 40)
  }, [allAssets])

  const sectionAssets = useMemo(() => {
    if (sidebarSection === 'prompts') return allAssets.filter((asset) => asset.type === 'prompt')
    if (sidebarSection === 'skills') return allAssets.filter((asset) => asset.type === 'skill')
    if (sidebarSection === 'favorites') return allAssets.filter((asset) => favoriteIds.includes(asset.id))
    if (sidebarSection === 'recent') return allAssets.filter((asset) => recentIds.includes(asset.id))
    return allAssets
  }, [allAssets, sidebarSection, favoriteIds, recentIds])

  const filteredAssets = useMemo(() => {
    let items = sectionAssets

    if (typeFilter !== 'all') {
      items = items.filter((asset) => asset.type === typeFilter)
    }

    if (activeCollection) {
      items = items.filter((asset) => asset.collection === activeCollection)
    }

    if (activeTag) {
      items = items.filter((asset) => asset.tags.includes(activeTag))
    }

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      items = items.filter((asset) => {
        const haystack = [asset.title, asset.summary, asset.key, asset.collection, asset.tags.join(' ')].join(' ')
        return haystack.toLowerCase().includes(query)
      })
    }

    const sorted = [...items]
    sorted.sort((left, right) => {
      if (sortMode === 'title') {
        return left.title.localeCompare(right.title)
      }
      if (sortMode === 'type') {
        return left.type.localeCompare(right.type) || left.title.localeCompare(right.title)
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    })

    return sorted
  }, [sectionAssets, typeFilter, activeCollection, activeTag, searchQuery, sortMode])

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null
    return allAssets.find((asset) => asset.id === selectedAssetId) ?? null
  }, [allAssets, selectedAssetId])

  useEffect(() => {
    if (page !== 'library') return
    if (filteredAssets.length === 0) {
      if (selectedAssetId !== null) setSelectedAssetId(null)
      return
    }

    const currentInView = filteredAssets.some((asset) => asset.id === selectedAssetId)
    if (!currentInView) {
      setSelectedAssetId(filteredAssets[0].id)
    }
  }, [filteredAssets, selectedAssetId, page])

  const promptCount = prompts.filter((prompt) => !prompt.isHidden).length
  const skillCount = skills.filter((skill) => !skill.isHidden).length
  const favoriteCount = allAssets.filter((asset) => favoriteIds.includes(asset.id)).length
  const recentCount = allAssets.filter((asset) => recentIds.includes(asset.id)).length

  const touchRecent = (id: string) => {
    setRecentIds((previous) => [id, ...previous.filter((entry) => entry !== id)].slice(0, 50))
  }

  const setStoredTags = (id: string, tags: string[]) => {
    setCustomTags((previous) => {
      const normalized = normalizeTags(tags)
      const next = { ...previous }
      if (normalized.length === 0) {
        delete next[id]
      } else {
        next[id] = normalized
      }
      return next
    })
  }

  const toggleFavorite = (id: string) => {
    setFavoriteIds((previous) =>
      previous.includes(id) ? previous.filter((entry) => entry !== id) : [id, ...previous].slice(0, 200)
    )
  }

  const handleSidebarSectionChange = (section: LibrarySection) => {
    setSidebarSection(section)

    if (section === 'prompts') {
      setTypeFilter('prompt')
    } else if (section === 'skills') {
      setTypeFilter('skill')
    } else {
      setTypeFilter('all')
    }
  }

  const handleHideAsset = (asset: Asset) => {
    if (!canWrite) return
    const shouldHide = window.confirm(`Hide "${asset.title}" from the library?`)
    if (!shouldHide) return

    const onSuccess = () => {
      if (selectedAssetId === asset.id) setSelectedAssetId(null)
      if (page !== 'library') setPage('library')
      setFavoriteIds((previous) => previous.filter((entry) => entry !== asset.id))
      setRecentIds((previous) => previous.filter((entry) => entry !== asset.id))
    }

    if (asset.type === 'prompt') {
      hidePrompt.mutate(asset.id, { onSuccess })
      return
    }

    hideSkill.mutate(asset.id, { onSuccess })
  }

  const handleDeleteAsset = (asset: Asset) => {
    if (!canWrite) return
    const shouldDelete = window.confirm(`Delete "${asset.title}" permanently?`)
    if (!shouldDelete) return

    const onSuccess = () => {
      if (selectedAssetId === asset.id) setSelectedAssetId(null)
      if (page !== 'library') setPage('library')

      setFavoriteIds((previous) => previous.filter((entry) => entry !== asset.id))
      setRecentIds((previous) => previous.filter((entry) => entry !== asset.id))
      setCustomTags((previous) => {
        const next = { ...previous }
        delete next[asset.id]
        return next
      })
    }

    if (asset.type === 'prompt') {
      deletePrompt.mutate(asset.id, { onSuccess })
      return
    }

    deleteSkill.mutate(asset.id, { onSuccess })
  }

  const openDetailPage = (id: string) => {
    setSelectedAssetId(id)
    touchRecent(id)
    setPage('detail')
  }

  const openEditorFromAsset = (id: string) => {
    if (!canWrite) return
    const asset = allAssets.find((entry) => entry.id === id)
    if (!asset) return

    setEditingDraft(toAssetDraft(asset))
    setSelectedAssetId(id)
    touchRecent(id)
    setPage('edit')
  }

  const openCreatePage = (type: AssetType) => {
    if (!canWrite) return
    setEditingDraft(createDraft(type))
    setPage('edit')
  }

  const handleSaveDraft = (draft: AssetDraft) => {
    if (!canWrite) return
    const normalizedDraft: AssetDraft = {
      ...draft,
      title: draft.title.trim(),
      key: draft.key.trim(),
      summary: draft.summary.trim(),
      content: draft.content,
      collection: draft.collection.trim() || (draft.type === 'prompt' ? DEFAULT_PROMPT_COLLECTION : DEFAULT_SKILL_COLLECTION),
      tags: normalizeTags(draft.tags),
    }

    if (!normalizedDraft.title || !normalizedDraft.key || !normalizedDraft.content.trim()) return

    const handleSuccess = (id: string) => {
      setStoredTags(id, normalizedDraft.tags)
      setSelectedAssetId(id)
      touchRecent(id)
      setEditingDraft(null)
      setPage('library')
    }

    if (normalizedDraft.type === 'prompt') {
      const existingPromptNames = new Set(prompts.map((prompt) => prompt.name))
      const fallbackKey = slugify(normalizedDraft.title) || 'prompt'
      const chosenKey = normalizedDraft.id
        ? normalizedDraft.key
        : ensureUniqueKey(normalizedDraft.key || fallbackKey, existingPromptNames)

      savePrompt.mutate(
        {
          id: normalizedDraft.id,
          name: chosenKey,
          title: normalizedDraft.title,
          content: normalizedDraft.content,
          description: normalizedDraft.summary || undefined,
          category: normalizedDraft.collection,
        },
        {
          onSuccess: (savedPrompt) => handleSuccess(savedPrompt.id),
        }
      )
      return
    }

    const existingSkillNames = new Set(skills.map((skill) => skill.name))
    const fallbackSkillKey = slugify(normalizedDraft.title) || 'skill'
    const chosenSkillKey = normalizedDraft.id
      ? normalizedDraft.key
      : ensureUniqueKey(normalizedDraft.key || fallbackSkillKey, existingSkillNames)

    saveSkill.mutate(
      {
        id: normalizedDraft.id,
        name: chosenSkillKey,
        description: normalizedDraft.summary || normalizedDraft.title,
        manifest: normalizedDraft.content,
        type: normalizedDraft.collection,
        isActive: true,
      },
      {
        onSuccess: (savedSkill) => handleSuccess(savedSkill.id),
      }
    )
  }

  if (page === 'edit' && editingDraft) {
    const onDelete =
      editingDraft.id && selectedAsset
        ? () => {
            handleDeleteAsset(selectedAsset)
          }
        : undefined

    return (
      <AssetEditorPage
        draft={editingDraft}
        mode={editingDraft.id ? 'edit' : 'create'}
        onBack={() => {
          setEditingDraft(null)
          setPage(selectedAssetId ? 'detail' : 'library')
        }}
        onSave={handleSaveDraft}
        onDelete={onDelete}
      />
    )
  }

  if (page === 'detail' && selectedAsset) {
    return (
      <AssetDetailPage
        asset={selectedAsset}
        canWrite={canWrite}
        isFavorite={favoriteIds.includes(selectedAsset.id)}
        onBack={() => setPage('library')}
        onEdit={() => openEditorFromAsset(selectedAsset.id)}
        onToggleFavorite={toggleFavorite}
        onHide={handleHideAsset}
        onDelete={handleDeleteAsset}
      />
    )
  }

  return (
    <AssetLibrary
      assets={filteredAssets}
      allAssetCount={allAssets.length}
      promptCount={promptCount}
      skillCount={skillCount}
      favoriteCount={favoriteCount}
      recentCount={recentCount}
      selectedAsset={selectedAsset}
      selectedAssetId={selectedAssetId}
      sidebarSection={sidebarSection}
      onSidebarSectionChange={handleSidebarSectionChange}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      sortMode={sortMode}
      onSortModeChange={setSortMode}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      activeCollection={activeCollection}
      onActiveCollectionChange={setActiveCollection}
      activeTag={activeTag}
      onActiveTagChange={setActiveTag}
      collections={collectionCounts}
      tags={tagCounts}
      canWrite={canWrite}
      adminKey={adminKey}
      onAdminKeyChange={setAdminKey}
      favoriteIds={favoriteIds}
      onToggleFavorite={toggleFavorite}
      onSelectAsset={(id) => {
        setSelectedAssetId(id)
        touchRecent(id)
      }}
      onOpenAsset={openDetailPage}
      onEditAsset={openEditorFromAsset}
      onHideAsset={handleHideAsset}
      onDeleteAsset={handleDeleteAsset}
      onCreatePrompt={() => openCreatePage('prompt')}
      onCreateSkill={() => openCreatePage('skill')}
    />
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  )
}
