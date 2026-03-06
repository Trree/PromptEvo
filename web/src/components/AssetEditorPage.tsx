import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, FileText, PencilLine, Save, Trash2, Wrench } from 'lucide-react'
import { cn } from '../lib/cn'
import type { AssetDraft } from '../types'

type EditorPane = 'editor' | 'preview'

interface AssetEditorPageProps {
  draft: AssetDraft
  mode: 'create' | 'edit'
  onBack: () => void
  onSave: (draft: AssetDraft) => void
  onDelete?: () => void
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  )
}

export function AssetEditorPage({ draft, mode, onBack, onSave, onDelete }: AssetEditorPageProps) {
  const [localDraft, setLocalDraft] = useState(draft)
  const [pane, setPane] = useState<EditorPane>('editor')

  useEffect(() => {
    setLocalDraft(draft)
  }, [draft])

  const contentLabel = useMemo(
    () => (localDraft.type === 'prompt' ? 'Prompt Content' : 'Skill Manifest'),
    [localDraft.type]
  )

  const saveDisabled =
    localDraft.title.trim().length === 0 ||
    localDraft.key.trim().length === 0 ||
    localDraft.content.trim().length === 0

  return (
    <div className="flex h-screen flex-col bg-[var(--surface-app)]">
      <header className="border-b border-[var(--border-muted)] bg-white px-6 py-3">
        <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={onBack}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-muted)] text-slate-600 transition-colors hover:bg-[var(--surface-subtle)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {mode === 'create' ? 'Create asset' : 'Edit asset'}
              </p>
              <h1 className="truncate text-base font-semibold text-slate-900">
                {localDraft.title || 'Untitled Asset'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'edit' && onDelete && (
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
            <button
              onClick={() => onSave(localDraft)}
              disabled={saveDisabled}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save asset
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden px-6 py-5">
        <div className="mx-auto grid h-full w-full max-w-[1380px] gap-4 lg:grid-cols-[360px_1fr]">
          <section className="overflow-auto rounded-[14px] border border-[var(--border-muted)] bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Metadata</h2>
            <p className="mt-1 text-xs text-slate-500">Keep this concise and scannable in the library.</p>

            <div className="mt-4 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Type</span>
                <select
                  value={localDraft.type}
                  onChange={(event) => {
                    const nextType = event.target.value as AssetDraft['type']
                    setLocalDraft((previous) => ({
                      ...previous,
                      type: nextType,
                      collection:
                        previous.collection || (nextType === 'prompt' ? 'General' : 'local'),
                    }))
                  }}
                  className="h-10 w-full rounded-[10px] border border-[var(--border-muted)] bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
                >
                  <option value="prompt">Prompt</option>
                  <option value="skill">Skill</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Title</span>
                <input
                  value={localDraft.title}
                  onChange={(event) => {
                    const title = event.target.value
                    setLocalDraft((previous) => ({
                      ...previous,
                      title,
                      key:
                        previous.type === 'skill' && previous.key === previous.title
                          ? title
                          : previous.key,
                    }))
                  }}
                  placeholder="Short descriptive title"
                  className="h-10 w-full rounded-[10px] border border-[var(--border-muted)] bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Key</span>
                <input
                  value={localDraft.key}
                  onChange={(event) =>
                    setLocalDraft((previous) => ({
                      ...previous,
                      key: event.target.value,
                    }))
                  }
                  placeholder="Unique identifier"
                  className="h-10 w-full rounded-[10px] border border-[var(--border-muted)] bg-white px-3 font-mono text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Summary</span>
                <textarea
                  value={localDraft.summary}
                  onChange={(event) =>
                    setLocalDraft((previous) => ({
                      ...previous,
                      summary: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="2-line summary shown on cards"
                  className="w-full rounded-[10px] border border-[var(--border-muted)] bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Collection</span>
                <input
                  value={localDraft.collection}
                  onChange={(event) =>
                    setLocalDraft((previous) => ({
                      ...previous,
                      collection: event.target.value,
                    }))
                  }
                  placeholder={localDraft.type === 'prompt' ? 'General' : 'local'}
                  className="h-10 w-full rounded-[10px] border border-[var(--border-muted)] bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Tags</span>
                <input
                  value={localDraft.tags.join(', ')}
                  onChange={(event) =>
                    setLocalDraft((previous) => ({
                      ...previous,
                      tags: parseTags(event.target.value),
                    }))
                  }
                  placeholder="tag-1, tag-2"
                  className="h-10 w-full rounded-[10px] border border-[var(--border-muted)] bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <div className="rounded-[10px] border border-[var(--border-muted)] bg-[var(--surface-subtle)] px-3 py-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Version</span>
                  <span className="font-medium text-slate-700">v{localDraft.version || 1}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-[14px] border border-[var(--border-muted)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {localDraft.type === 'prompt' ? <FileText className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                {contentLabel}
              </div>

              <div className="flex items-center rounded-[10px] border border-[var(--border-muted)] bg-white p-0.5">
                <button
                  onClick={() => setPane('editor')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-xs transition-colors',
                    pane === 'editor'
                      ? 'bg-[var(--surface-subtle)] text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  Editor
                </button>
                <button
                  onClick={() => setPane('preview')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-xs transition-colors',
                    pane === 'preview'
                      ? 'bg-[var(--surface-subtle)] text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 p-4">
              {pane === 'editor' ? (
                <textarea
                  value={localDraft.content}
                  onChange={(event) =>
                    setLocalDraft((previous) => ({
                      ...previous,
                      content: event.target.value,
                    }))
                  }
                  placeholder={
                    localDraft.type === 'prompt'
                      ? 'Write prompt content. Example: {{user_name}}'
                      : 'Write skill manifest JSON or implementation details.'
                  }
                  className="h-full min-h-[420px] w-full resize-none rounded-[12px] border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-4 font-mono text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />
              ) : (
                <pre className="h-full min-h-[420px] overflow-auto rounded-[12px] border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                  {localDraft.content || 'No content to preview yet.'}
                </pre>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
