import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  EyeOff,
  FileText,
  Layers,
  PencilLine,
  Settings2,
  Star,
  Trash2,
  Wrench,
} from 'lucide-react'
import { usePromptVersions } from '../api'
import { cn } from '../lib/cn'
import type { Asset } from '../types'

type DetailTab = 'overview' | 'content' | 'versions' | 'settings'

interface AssetDetailPageProps {
  asset: Asset
  canWrite: boolean
  isFavorite: boolean
  onBack: () => void
  onEdit: () => void
  onToggleFavorite: (id: string) => void
  onHide: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

const tabItems: Array<{ key: DetailTab; label: string; icon: typeof Layers }> = [
  { key: 'overview', label: 'Overview', icon: Layers },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'versions', label: 'Versions', icon: Clock3 },
  { key: 'settings', label: 'Settings', icon: Settings2 },
]

function formatDateLabel(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function TypeBadge({ type }: { type: Asset['type'] }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-muted)] bg-[var(--surface-subtle)] px-2 py-1 text-[11px] font-medium text-slate-600">
      {type === 'prompt' ? <FileText className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
      {type === 'prompt' ? 'Prompt' : 'Skill'}
    </span>
  )
}

async function copyTextToClipboard(text: string) {
  if (!text) return false

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to a legacy fallback when Clipboard API is unavailable or blocked.
    }
  }

  if (typeof document === 'undefined') return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
}

function CopyContentButton({
  value,
  copied,
  onCopy,
}: {
  value: string
  copied: boolean
  onCopy: (value: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      disabled={!value}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
        value
          ? 'border-[var(--border-muted)] bg-white text-slate-600 hover:bg-[var(--surface-subtle)] hover:text-slate-900'
          : 'cursor-not-allowed border-[var(--border-muted)] bg-slate-100 text-slate-400'
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function OverviewTab({ asset }: { asset: Asset }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-[14px] border border-[var(--border-muted)] bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{asset.summary || 'No summary available.'}</p>

        <h3 className="mt-5 text-sm font-semibold text-slate-900">Tags</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {asset.tags.length === 0 && <span className="text-xs text-slate-400">No tags</span>}
          {asset.tags.map((tag) => (
            <span
              key={`${asset.id}-tag-${tag}`}
              className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-[var(--border-muted)] bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Metadata</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Asset ID</dt>
            <dd className="max-w-[220px] truncate font-mono text-xs text-slate-700">{asset.id}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Key</dt>
            <dd className="max-w-[220px] truncate font-mono text-xs text-slate-700">{asset.key}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Collection</dt>
            <dd className="text-slate-800">{asset.collection}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Version</dt>
            <dd className="text-slate-800">v{asset.version}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Updated</dt>
            <dd className="text-slate-800">{formatDateLabel(asset.updatedAt)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function ContentTab({ asset }: { asset: Asset }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (value: string) => {
    const didCopy = await copyTextToClipboard(value)
    if (!didCopy) return

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="rounded-[14px] border border-[var(--border-muted)] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Content</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{asset.type === 'prompt' ? 'Prompt body' : 'Skill manifest'}</span>
          {asset.type === 'prompt' && <CopyContentButton value={asset.content} copied={copied} onCopy={handleCopy} />}
        </div>
      </div>
      <pre className="min-h-[440px] overflow-auto rounded-xl border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-4 text-xs leading-6 text-slate-700 whitespace-pre-wrap">
        {asset.content || 'No content provided.'}
      </pre>
    </section>
  )
}

function VersionsTab({ asset }: { asset: Asset }) {
  const shouldLoadPromptVersions = asset.type === 'prompt'
  const { data: versions = [], isLoading } = usePromptVersions(shouldLoadPromptVersions ? asset.id : null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const currentVersionCard = useMemo(
    () => ({
      id: `${asset.id}-current`,
      version: asset.version,
      savedAt: asset.updatedAt,
      content: asset.content,
    }),
    [asset.content, asset.id, asset.updatedAt, asset.version]
  )

  const handleCopy = async (id: string, value: string) => {
    const didCopy = await copyTextToClipboard(value)
    if (!didCopy) return

    setCopiedId(id)
    window.setTimeout(() => {
      setCopiedId((previous) => (previous === id ? null : previous))
    }, 1500)
  }

  if (asset.type !== 'prompt') {
    return (
      <section className="rounded-[14px] border border-[var(--border-muted)] bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Versions</h2>
        <p className="mt-2 text-sm text-slate-500">
          Skill assets currently expose only the latest revision in this interface.
        </p>
        <div className="mt-4 rounded-xl border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">v{asset.version}</span>
            <span className="text-xs text-slate-500">{formatDateLabel(asset.updatedAt)}</span>
          </div>
          <p className="line-clamp-3 mt-2 text-xs text-slate-600">{asset.content || 'No content available.'}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[14px] border border-[var(--border-muted)] bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Versions</h2>
      <p className="mt-1 text-xs text-slate-500">Latest revision plus previous prompt snapshots.</p>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">Current v{currentVersionCard.version}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{formatDateLabel(currentVersionCard.savedAt)}</span>
              <CopyContentButton
                value={currentVersionCard.content}
                copied={copiedId === currentVersionCard.id}
                onCopy={(value) => handleCopy(currentVersionCard.id, value)}
              />
            </div>
          </div>
          <p className="line-clamp-4 mt-2 text-xs text-slate-600">{currentVersionCard.content || 'No content available.'}</p>
        </div>

        {isLoading && <p className="py-5 text-center text-sm text-slate-400">Loading history...</p>}

        {!isLoading && versions.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--border-muted)] py-6 text-center text-sm text-slate-400">
            No previous versions yet.
          </p>
        )}

        {!isLoading &&
          versions.map((version) => (
            <div key={version.id} className="rounded-xl border border-[var(--border-muted)] bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">v{version.version}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{formatDateLabel(version.savedAt)}</span>
                  <CopyContentButton
                    value={version.content}
                    copied={copiedId === version.id}
                    onCopy={(value) => handleCopy(version.id, value)}
                  />
                </div>
              </div>
              <p className="line-clamp-4 mt-2 text-xs text-slate-600">{version.content || 'No content available.'}</p>
            </div>
          ))}
      </div>
    </section>
  )
}

function SettingsTab({
  asset,
  onHide,
  onDelete,
}: {
  asset: Asset
  onHide: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-[14px] border border-[var(--border-muted)] bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Configuration</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Type</dt>
            <dd className="text-slate-800">{asset.type}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Collection</dt>
            <dd className="text-slate-800">{asset.collection}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Version</dt>
            <dd className="text-slate-800">v{asset.version}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Last updated</dt>
            <dd className="text-slate-800">{formatDateLabel(asset.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-[14px] border border-[var(--border-muted)] bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Danger Zone</h2>
        <p className="mt-2 text-sm text-slate-500">Hide assets from library view, or permanently delete them.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onHide(asset)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border-muted)] bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-[var(--surface-subtle)]"
          >
            <EyeOff className="h-4 w-4" />
            Hide
          </button>
          <button
            onClick={() => onDelete(asset)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </section>
  )
}

export function AssetDetailPage({
  asset,
  canWrite,
  isFavorite,
  onBack,
  onEdit,
  onToggleFavorite,
  onHide,
  onDelete,
}: AssetDetailPageProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const visibleTabs = canWrite ? tabItems : tabItems.filter((tab) => tab.key !== 'settings')

  return (
    <div className="h-screen overflow-auto bg-[var(--surface-app)] px-6 py-5">
      <div className="mx-auto max-w-[1200px]">
        <header className="rounded-[14px] border border-[var(--border-muted)] bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={onBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-muted)] text-slate-600 transition-colors hover:bg-[var(--surface-subtle)]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <TypeBadge type={asset.type} />
                  <span className="text-xs text-slate-400">v{asset.version}</span>
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950">{asset.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(asset.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-sm transition-colors',
                  isFavorite
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-[var(--border-muted)] bg-white text-slate-600 hover:bg-[var(--surface-subtle)]'
                )}
              >
                <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </button>
              {canWrite && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border-muted)] bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-[var(--surface-subtle)]"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1">
            {visibleTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm transition-colors',
                  activeTab === key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-[var(--surface-subtle)] hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className="mt-4 pb-6">
          {activeTab === 'overview' && <OverviewTab asset={asset} />}
          {activeTab === 'content' && <ContentTab asset={asset} />}
          {activeTab === 'versions' && <VersionsTab asset={asset} />}
          {activeTab === 'settings' && canWrite && <SettingsTab asset={asset} onHide={onHide} onDelete={onDelete} />}
        </main>
      </div>
    </div>
  )
}
