import {
  Clock3,
  FileText,
  FolderTree,
  Grid3X3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  Wrench,
  EyeOff,
  PencilLine,
  Trash2,
  ArrowUpRight,
} from 'lucide-react'
import type { Asset, AssetType } from '../types'
import { cn } from '../lib/cn'

export type LibrarySection = 'all' | 'prompts' | 'skills' | 'favorites' | 'recent'
export type AssetSortMode = 'updated' | 'title' | 'type'
export type AssetViewMode = 'grid' | 'list'

interface CounterItem {
  name: string
  count: number
}

interface AssetLibraryProps {
  assets: Asset[]
  allAssetCount: number
  promptCount: number
  skillCount: number
  favoriteCount: number
  recentCount: number
  selectedAsset: Asset | null
  selectedAssetId: string | null
  sidebarSection: LibrarySection
  onSidebarSectionChange: (section: LibrarySection) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  typeFilter: 'all' | AssetType
  onTypeFilterChange: (filter: 'all' | AssetType) => void
  sortMode: AssetSortMode
  onSortModeChange: (mode: AssetSortMode) => void
  viewMode: AssetViewMode
  onViewModeChange: (mode: AssetViewMode) => void
  activeCollection: string | null
  onActiveCollectionChange: (value: string | null) => void
  activeTag: string | null
  onActiveTagChange: (value: string | null) => void
  collections: CounterItem[]
  tags: CounterItem[]
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  onSelectAsset: (id: string) => void
  onOpenAsset: (id: string) => void
  onEditAsset: (id: string) => void
  onHideAsset: (asset: Asset) => void
  onDeleteAsset: (asset: Asset) => void
  onCreatePrompt: () => void
  onCreateSkill: () => void
}

const sectionItems: Array<{ key: LibrarySection; label: string; icon: typeof Sparkles }> = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'prompts', label: 'Prompts', icon: FileText },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'favorites', label: 'Favorites', icon: Star },
  { key: 'recent', label: 'Recent', icon: Clock3 },
]

function formatUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt).getTime()
  if (Number.isNaN(parsed)) return 'Unknown'

  const delta = Date.now() - parsed
  const minutes = Math.floor(delta / 60000)
  const hours = Math.floor(delta / 3600000)
  const days = Math.floor(delta / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getTypeLabel(type: AssetType) {
  return type === 'prompt' ? 'Prompt' : 'Skill'
}

function SidebarSectionButton({
  label,
  icon: Icon,
  active,
  count,
  onClick,
}: {
  label: string
  icon: typeof Sparkles
  active: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-[var(--surface-subtle)] text-slate-950 shadow-[inset_0_0_0_1px_var(--border-strong)]'
          : 'text-slate-600 hover:bg-[var(--surface-subtle)] hover:text-slate-900'
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="rounded-md bg-white px-1.5 py-0.5 text-xs text-slate-500">{count}</span>
    </button>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs transition-colors',
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-[var(--border-muted)] bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800'
      )}
    >
      {label}
    </button>
  )
}

function CardActionMenu({
  asset,
  onEdit,
  onHide,
  onDelete,
  onToggleFavorite,
  isFavorite,
}: {
  asset: Asset
  onEdit: (id: string) => void
  onHide: (asset: Asset) => void
  onDelete: (asset: Asset) => void
  onToggleFavorite: (id: string) => void
  isFavorite: boolean
}) {
  return (
    <details className="relative" onClick={(event) => event.stopPropagation()}>
      <summary className="list-none rounded-md border border-transparent p-1.5 text-slate-500 hover:border-[var(--border-muted)] hover:bg-[var(--surface-subtle)] hover:text-slate-800">
        <MoreHorizontal className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 top-8 z-30 min-w-36 overflow-hidden rounded-xl border border-[var(--border-muted)] bg-white p-1 shadow-[0_14px_40px_rgba(15,23,42,0.12)]">
        <button
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-[var(--surface-subtle)]"
          onClick={() => onEdit(asset.id)}
        >
          <PencilLine className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-[var(--surface-subtle)]"
          onClick={() => onToggleFavorite(asset.id)}
        >
          <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
          {isFavorite ? 'Remove favorite' : 'Add favorite'}
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-[var(--surface-subtle)]"
          onClick={() => onHide(asset)}
        >
          <EyeOff className="h-3.5 w-3.5" />
          Hide
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(asset)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </details>
  )
}

function AssetCard({
  asset,
  selected,
  viewMode,
  isFavorite,
  onSelect,
  onOpen,
  onEdit,
  onHide,
  onDelete,
  onToggleFavorite,
}: {
  asset: Asset
  selected: boolean
  viewMode: AssetViewMode
  isFavorite: boolean
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onHide: (asset: Asset) => void
  onDelete: (asset: Asset) => void
  onToggleFavorite: (id: string) => void
}) {
  if (viewMode === 'list') {
    return (
      <article
        onClick={() => onSelect(asset.id)}
        onDoubleClick={() => onOpen(asset.id)}
        className={cn(
          'group flex h-[124px] cursor-pointer items-center justify-between rounded-xl border bg-white px-4 py-3 transition-colors',
          selected
            ? 'border-[var(--border-strong)] shadow-[0_10px_28px_rgba(15,23,42,0.08)]'
            : 'border-[var(--border-muted)] hover:border-slate-300 hover:bg-[var(--surface-card-hover)]'
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md border border-[var(--border-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {getTypeLabel(asset.type)}
            </span>
            {isFavorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
            <span className="text-xs text-slate-400">v{asset.version}</span>
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{asset.title}</h3>
          <p className="line-clamp-2 pt-1 text-xs text-slate-500">{asset.summary || 'No summary available.'}</p>
        </div>
        <div className="ml-4 flex items-center gap-3">
          <div className="text-right text-xs text-slate-400">
            <div>{asset.collection}</div>
            <div>{formatUpdatedAt(asset.updatedAt)}</div>
          </div>
          <CardActionMenu
            asset={asset}
            onEdit={onEdit}
            onHide={onHide}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        </div>
      </article>
    )
  }

  return (
    <article
      onClick={() => onSelect(asset.id)}
      onDoubleClick={() => onOpen(asset.id)}
      className={cn(
        'group flex h-[212px] cursor-pointer flex-col rounded-xl border bg-white p-4 transition-colors',
        selected
          ? 'border-[var(--border-strong)] shadow-[0_14px_30px_rgba(15,23,42,0.08)]'
          : 'border-[var(--border-muted)] hover:border-slate-300 hover:bg-[var(--surface-card-hover)]'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-[var(--border-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {getTypeLabel(asset.type)}
          </span>
          {isFavorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
        </div>
        <CardActionMenu
          asset={asset}
          onEdit={onEdit}
          onHide={onHide}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
        />
      </div>

      <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{asset.title}</h3>
      <p className="line-clamp-2 pt-1 text-xs leading-5 text-slate-500">{asset.summary || 'No summary available.'}</p>

      <div className="mt-3 flex min-h-6 flex-wrap gap-1">
        {asset.tags.slice(0, 3).map((tag) => (
          <span
            key={`${asset.id}-${tag}`}
            className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[11px] text-slate-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-slate-400">
        <span>v{asset.version}</span>
        <span>{formatUpdatedAt(asset.updatedAt)}</span>
      </div>
    </article>
  )
}

export function AssetLibrary({
  assets,
  allAssetCount,
  promptCount,
  skillCount,
  favoriteCount,
  recentCount,
  selectedAsset,
  selectedAssetId,
  sidebarSection,
  onSidebarSectionChange,
  searchQuery,
  onSearchQueryChange,
  typeFilter,
  onTypeFilterChange,
  sortMode,
  onSortModeChange,
  viewMode,
  onViewModeChange,
  activeCollection,
  onActiveCollectionChange,
  activeTag,
  onActiveTagChange,
  collections,
  tags,
  favoriteIds,
  onToggleFavorite,
  onSelectAsset,
  onOpenAsset,
  onEditAsset,
  onHideAsset,
  onDeleteAsset,
  onCreatePrompt,
  onCreateSkill,
}: AssetLibraryProps) {
  const selectedTypeFilter = typeFilter

  return (
    <div className="flex h-screen bg-[var(--surface-app)] text-slate-900">
      <aside className="w-[248px] shrink-0 border-r border-[var(--border-muted)] bg-[var(--surface-app)] px-4 py-5">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Asset Manager</div>
            <div className="text-xs text-slate-500">Prompt + Skill Library</div>
          </div>
        </div>

        <div className="space-y-1">
          {sectionItems.map(({ key, label, icon }) => {
            const count =
              key === 'all'
                ? allAssetCount
                : key === 'prompts'
                  ? promptCount
                  : key === 'skills'
                    ? skillCount
                    : key === 'favorites'
                      ? favoriteCount
                      : recentCount

            return (
              <SidebarSectionButton
                key={key}
                label={label}
                icon={icon}
                active={sidebarSection === key}
                count={count}
                onClick={() => onSidebarSectionChange(key)}
              />
            )
          })}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <FolderTree className="h-3.5 w-3.5" />
              Collections
            </div>
            <div className="max-h-32 space-y-1 overflow-auto pr-1">
              {collections.length === 0 && <p className="px-2 text-xs text-slate-400">No collections</p>}
              {collections.map((collection) => (
                <button
                  key={collection.name}
                  onClick={() =>
                    onActiveCollectionChange(activeCollection === collection.name ? null : collection.name)
                  }
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors',
                    activeCollection === collection.name
                      ? 'bg-[var(--surface-subtle)] text-slate-900'
                      : 'text-slate-500 hover:bg-[var(--surface-subtle)] hover:text-slate-700'
                  )}
                >
                  <span className="truncate">{collection.name}</span>
                  <span>{collection.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </div>
            <div className="max-h-32 space-y-1 overflow-auto pr-1">
              {tags.length === 0 && <p className="px-2 text-xs text-slate-400">No tags</p>}
              {tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => onActiveTagChange(activeTag === tag.name ? null : tag.name)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors',
                    activeTag === tag.name
                      ? 'bg-[var(--surface-subtle)] text-slate-900'
                      : 'text-slate-500 hover:bg-[var(--surface-subtle)] hover:text-slate-700'
                  )}
                >
                  <span className="truncate">{tag.name}</span>
                  <span>{tag.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2 border-t border-[var(--border-muted)] pt-4">
          <button
            onClick={onCreatePrompt}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Prompt
          </button>
          <button
            onClick={onCreateSkill}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-muted)] bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[var(--surface-subtle)]"
          >
            <Plus className="h-4 w-4" />
            New Skill
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
        <div className="rounded-[14px] border border-[var(--border-muted)] bg-white px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Asset Library</h1>
              <p className="mt-1 text-sm text-slate-500">{assets.length} assets in view</p>
            </div>
            <button
              onClick={() => {
                if (selectedAssetId) onOpenAsset(selectedAssetId)
              }}
              disabled={!selectedAssetId}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-muted)] bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Open Detail
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block xl:w-[420px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Search assets by title, summary, tags"
                className="h-10 w-full rounded-[10px] border border-[var(--border-muted)] bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Chip
                label="All types"
                active={selectedTypeFilter === 'all'}
                onClick={() => onTypeFilterChange('all')}
              />
              <Chip
                label="Prompts"
                active={selectedTypeFilter === 'prompt'}
                onClick={() => onTypeFilterChange('prompt')}
              />
              <Chip
                label="Skills"
                active={selectedTypeFilter === 'skill'}
                onClick={() => onTypeFilterChange('skill')}
              />

              <select
                value={sortMode}
                onChange={(event) => onSortModeChange(event.target.value as AssetSortMode)}
                className="h-9 rounded-[10px] border border-[var(--border-muted)] bg-white px-2.5 text-xs text-slate-600 outline-none transition-colors focus:border-slate-400"
              >
                <option value="updated">Sort: Updated</option>
                <option value="title">Sort: Title</option>
                <option value="type">Sort: Type</option>
              </select>

              <div className="flex items-center rounded-[10px] border border-[var(--border-muted)] bg-white p-0.5">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={cn(
                    'rounded-[8px] p-1.5 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-[var(--surface-subtle)] text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={cn(
                    'rounded-[8px] p-1.5 transition-colors',
                    viewMode === 'list'
                      ? 'bg-[var(--surface-subtle)] text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {(activeCollection || activeTag) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border-muted)] pt-3">
              <span className="text-xs text-slate-400">Active filters:</span>
              {activeCollection && (
                <button
                  onClick={() => onActiveCollectionChange(null)}
                  className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs text-slate-600"
                >
                  Collection: {activeCollection} ×
                </button>
              )}
              {activeTag && (
                <button
                  onClick={() => onActiveTagChange(null)}
                  className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs text-slate-600"
                >
                  Tag: {activeTag} ×
                </button>
              )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto pb-2 pr-1">
          {assets.length === 0 ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-[14px] border border-dashed border-[var(--border-muted)] bg-white">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">No assets found</p>
                <p className="mt-1 text-xs text-slate-400">Adjust filters, or create a new prompt or skill.</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  viewMode={viewMode}
                  selected={selectedAssetId === asset.id}
                  isFavorite={favoriteIds.includes(asset.id)}
                  onSelect={onSelectAsset}
                  onOpen={onOpenAsset}
                  onEdit={onEditAsset}
                  onHide={onHideAsset}
                  onDelete={onDeleteAsset}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  viewMode={viewMode}
                  selected={selectedAssetId === asset.id}
                  isFavorite={favoriteIds.includes(asset.id)}
                  onSelect={onSelectAsset}
                  onOpen={onOpenAsset}
                  onEdit={onEditAsset}
                  onHide={onHideAsset}
                  onDelete={onDeleteAsset}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="hidden w-[340px] shrink-0 border-l border-[var(--border-muted)] bg-white p-5 xl:flex xl:flex-col">
        {!selectedAsset ? (
          <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-[var(--border-muted)] bg-[var(--surface-subtle)] text-center">
            <div>
              <p className="text-sm font-medium text-slate-700">Select an asset</p>
              <p className="mt-1 text-xs text-slate-400">Preview appears here for faster browsing.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-md border border-[var(--border-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {getTypeLabel(selectedAsset.type)}
              </span>
              <button
                onClick={() => onToggleFavorite(selectedAsset.id)}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs transition-colors',
                  favoriteIds.includes(selectedAsset.id)
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-[var(--border-muted)] text-slate-500 hover:bg-[var(--surface-subtle)]'
                )}
              >
                {favoriteIds.includes(selectedAsset.id) ? 'Favorited' : 'Favorite'}
              </button>
            </div>

            <h2 className="text-xl font-semibold leading-7 text-slate-950">{selectedAsset.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{selectedAsset.summary || 'No summary available.'}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {selectedAsset.tags.length === 0 && <span className="text-xs text-slate-400">No tags</span>}
              {selectedAsset.tags.map((tag) => (
                <span
                  key={`${selectedAsset.id}-preview-${tag}`}
                  className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>

            <dl className="mt-5 space-y-3 rounded-[14px] border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">Collection</dt>
                <dd className="font-medium text-slate-800">{selectedAsset.collection}</dd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">Updated</dt>
                <dd className="font-medium text-slate-800">{formatUpdatedAt(selectedAsset.updatedAt)}</dd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">Version</dt>
                <dd className="font-medium text-slate-800">v{selectedAsset.version}</dd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">Key</dt>
                <dd className="max-w-[180px] truncate font-mono text-[11px] text-slate-700">{selectedAsset.key}</dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => onOpenAsset(selectedAsset.id)}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-slate-900 bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Open detail
              </button>
              <button
                onClick={() => onEditAsset(selectedAsset.id)}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--border-muted)] bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[var(--surface-subtle)]"
              >
                Edit asset
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => onHideAsset(selectedAsset)}
                className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border-muted)] bg-white px-2 py-2 text-xs text-slate-600 transition-colors hover:bg-[var(--surface-subtle)]"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Hide
              </button>
              <button
                onClick={() => onDeleteAsset(selectedAsset)}
                className="flex items-center justify-center gap-1.5 rounded-[10px] border border-rose-200 bg-rose-50 px-2 py-2 text-xs text-rose-700 transition-colors hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
