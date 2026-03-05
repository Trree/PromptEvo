import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Save, ChevronLeft, Layers, Code2, Layout } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const queryClient = new QueryClient();
const api = axios.create({ baseURL: 'http://192.210.243.20:3000/api' });

const CATEGORIES = ['All', 'Coding', 'Marketing', 'Business', 'Creative', 'General'];

// ─── Editor View ─────────────────────────────────────────────────────────────

const EditorView = ({
  item,
  contentType,
  onBack,
  onSave,
}: {
  item: any;
  contentType: 'prompts' | 'skills';
  onBack: () => void;
  onSave: (data: any) => void;
}) => {
  const [draft, setDraft] = useState(item);
  const contentKey = contentType === 'prompts' ? 'content' : 'manifest';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">
            {draft.title || 'Untitled'}
          </span>
        </div>
        <button
          onClick={() => onSave(draft)}
          className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-10 space-y-5">
        <input
          value={draft.title || ''}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="text-3xl font-black text-gray-900 border-none outline-none w-full placeholder:text-gray-200"
          placeholder="Give it a title..."
        />
        <textarea
          value={draft[contentKey] || ''}
          onChange={(e) => setDraft({ ...draft, [contentKey]: e.target.value })}
          placeholder="Write your content here..."
          className="w-full min-h-[480px] bg-gray-50 border border-gray-200 rounded-2xl p-6 outline-none focus:bg-white focus:border-gray-300 transition-all font-mono text-sm leading-relaxed resize-none"
        />
      </main>
    </div>
  );
};

// ─── Template Card ────────────────────────────────────────────────────────────

const TemplateCard = ({
  item,
  contentType,
  onClick,
}: {
  item: any;
  contentType: 'prompts' | 'skills';
  onClick: () => void;
}) => {
  const previewText =
    contentType === 'prompts'
      ? item.content || ''
      : item.manifest || item.description || '';

  return (
    <div className="flex flex-col gap-2.5 group cursor-pointer" onClick={onClick}>
      {/* Content preview */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-200">
        {/* Category tag */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-sm">
            {item.category || (contentType === 'prompts' ? 'Prompt' : 'Skill')}
          </span>
        </div>

        {/* Actual content text */}
        <div className="absolute inset-0 pt-10 px-4 pb-4 overflow-hidden">
          <p className="text-[11px] leading-relaxed text-gray-500 font-mono whitespace-pre-wrap break-words">
            {previewText}
          </p>
        </div>

        {/* Fade out at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg scale-95 group-hover:scale-100 transition-transform duration-200">
            Open
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
          {item.title || item.name || 'Untitled'}
        </p>
        {item.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
        )}
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

const MainApp = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [contentType, setContentType] = useState<'prompts' | 'skills'>('prompts');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: prompts = [] } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.get('/prompts').then((res) => res.data),
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then((res) => res.data),
  });

  const filteredItems = useMemo(() => {
    const items = contentType === 'prompts' ? prompts : skills;
    if (activeCategory === 'All') return items;
    return (items as any[]).filter((item) => item.category === activeCategory);
  }, [contentType, prompts, skills, activeCategory]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post(`/${contentType}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [contentType] });
      setSelectedItem(null);
    },
  });

  if (selectedItem) {
    return (
      <EditorView
        item={selectedItem}
        contentType={contentType}
        onBack={() => setSelectedItem(null)}
        onSave={(data) => saveMutation.mutate(data)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex text-gray-900 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-52 border-r border-gray-200 flex flex-col h-screen sticky top-0 bg-white shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
              <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" />
              <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" />
              <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-[15px] tracking-tight text-gray-900">YouWare</span>
        </div>

        <div className="flex-1" />

        {/* Create button */}
        <div className="p-4">
          <button
            onClick={() =>
              setSelectedItem({ name: '', title: '', content: '', description: '', category: 'General' })
            }
            className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-800 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="px-8 py-7">
          {/* Heading + type toggle */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Templates</h1>
            <div className="flex bg-gray-100 p-1 rounded-lg gap-0.5">
              <button
                onClick={() => setContentType('prompts')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1',
                  contentType === 'prompts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Layers className="w-3 h-3" />
                Prompts
              </button>
              <button
                onClick={() => setContentType('skills')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1',
                  contentType === 'skills' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Code2 className="w-3 h-3" />
                Skills
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex border-b border-gray-200 mb-7 gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'relative px-3.5 py-2.5 text-sm transition-all whitespace-nowrap',
                  activeCategory === cat
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-700 font-medium'
                )}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {(filteredItems as any[]).map((item) => (
              <TemplateCard
                key={item.id}
                item={item}
                contentType={contentType}
                onClick={() => setSelectedItem(item)}
              />
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <Layout className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">No templates yet</p>
                <p className="text-xs text-gray-300 mt-1">Create your first one</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}
