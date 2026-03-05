import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Zap, 
  Save, 
  ChevronLeft, 
  Layers,
  Code2,
  Compass,
  Layout,
  FlaskConical,
  Users,
  FolderOpen,
  GraduationCap,
  PanelLeft,
  Eye,
  Heart,
  GitFork,
  Flower2,
  Cloud,
  Moon,
  Sun
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const queryClient = new QueryClient();

// API 基础路径
const api = axios.create({ baseURL: 'http://192.210.243.20:3000/api' });

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<'prompts' | 'skills'>('prompts');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // 获取数据
  const { data: prompts = [] } = useQuery({ 
    queryKey: ['prompts'], 
    queryFn: () => api.get('/prompts').then(res => res.data) 
  });
  
  const { data: skills = [] } = useQuery({ 
    queryKey: ['skills'], 
    queryFn: () => api.get('/skills').then(res => res.data) 
  });

  const categories = ['All', 'Coding', 'Marketing', 'Business', 'Creative', 'General'];

  // 过滤逻辑
  const filteredItems = useMemo(() => {
    const items = activeTab === 'prompts' ? prompts : skills;
    return items.filter((item: any) => {
      const matchSearch = (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [activeTab, prompts, skills, activeCategory, searchQuery]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post(`/${activeTab}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] });
      setSelectedItem(null);
    },
  });

  // 编辑器视图
  if (selectedItem) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col animate-in fade-in duration-500">
        <header className="h-16 border-b border-fresh-100 flex items-center justify-between px-6 bg-white/70 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-fresh-50 rounded-full transition-colors group">
              <ChevronLeft className="w-5 h-5 text-fresh-600 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-slate-700">{selectedItem.title || 'Untitled'}</h1>
              <p className="text-[10px] font-mono text-fresh-600 uppercase tracking-widest">{selectedItem.name || 'New'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => saveMutation.mutate(selectedItem)}
              className="bg-fresh-500 text-white px-6 py-2 rounded-2xl text-sm font-semibold shadow-lg shadow-fresh-500/10 hover:bg-fresh-600 hover:shadow-fresh-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full p-8 md:p-12 space-y-10">
           <input 
              value={selectedItem.title || ''}
              onChange={(e) => setSelectedItem({...selectedItem, title: e.target.value})}
              className="text-4xl font-bold tracking-tight text-slate-800 border-none outline-none focus:ring-0 w-full placeholder:text-fresh-100 bg-transparent"
              placeholder="Template name..."
            />
            <textarea 
              value={selectedItem.content || ''}
              onChange={(e) => setSelectedItem({...selectedItem, content: e.target.value})}
              placeholder="Start writing..."
              className="w-full min-h-[550px] bg-white/60 border border-fresh-100 rounded-[2.5rem] p-10 outline-none focus:bg-white focus:ring-8 focus:ring-fresh-50/50 focus:border-fresh-200 transition-all font-mono text-sm leading-relaxed text-slate-600 shadow-soft"
            />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex text-slate-700 font-sans selection:bg-fresh-100 selection:text-fresh-700">
      {/* 侧边栏 - 小清新风格：浅绿配奶油白 */}
      <aside className="w-64 border-r border-fresh-100 flex flex-col h-screen sticky top-0 bg-white/50 backdrop-blur-xl z-10">
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-fresh-100 flex items-center justify-center shadow-sm">
              <Flower2 className="w-5 h-5 text-fresh-600 animate-pulse" />
            </div>
            <div className="font-bold text-lg tracking-tight text-slate-800">Minty</div>
          </div>
          <PanelLeft className="w-4 h-4 text-fresh-300 cursor-pointer hover:text-fresh-600" />
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<Cloud className="w-5 h-5" />} label="Explore" active />
          <NavItem icon={<Layout className="w-5 h-5" />} label="Templates" />
          <NavItem icon={<Sun className="w-5 h-5" />} label="Highlights" />
          <div className="h-6" />
          <div className="text-[10px] font-bold text-fresh-300 uppercase tracking-[0.2em] px-3 mb-2">Workspace</div>
          <NavItem icon={<FolderOpen className="w-5 h-5" />} label="Projects" />
          <NavItem icon={<Moon className="w-5 h-5" />} label="Archives" />
        </nav>

        <div className="p-6">
          <div className="bg-fresh-50 rounded-3xl p-4 flex items-center gap-4 border border-fresh-100/50">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sm font-bold text-fresh-500">JD</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">John</span>
              <span className="text-[10px] text-fresh-500 font-bold uppercase">Standard</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 bg-cream-50/80 backdrop-blur-xl border-b border-fresh-100/30 pt-8 pb-6 px-12 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Good morning</h1>
              <p className="text-sm text-fresh-600 font-medium italic">"Every prompt is a new flower in your garden."</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-white/50 border border-fresh-100 p-1 rounded-2xl shadow-sm">
                <button 
                  onClick={() => setActiveTab('prompts')}
                  className={cn("px-5 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'prompts' ? "bg-white shadow-sm text-fresh-600" : "text-slate-400 hover:text-slate-600")}
                >
                  Prompts
                </button>
                <button 
                  onClick={() => setActiveTab('skills')}
                  className={cn("px-5 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'skills' ? "bg-white shadow-sm text-fresh-600" : "text-slate-400 hover:text-slate-600")}
                >
                  Skills
                </button>
              </div>
              <button 
                onClick={() => setSelectedItem({ name: '', title: '', content: '', description: '', category: 'General' })}
                className="bg-fresh-500 text-white px-6 py-2.5 rounded-2xl text-xs font-bold hover:bg-fresh-600 transition-all shadow-lg shadow-fresh-500/10"
              >
                + Create New
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group w-full max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-fresh-300 group-focus-within:text-fresh-500 transition-colors" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your creations..."
                className="w-full bg-white border border-fresh-100 rounded-2xl pl-12 pr-6 py-3 text-sm outline-none focus:ring-8 focus:ring-fresh-50/50 focus:border-fresh-200 transition-all placeholder:text-fresh-200 font-medium shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                    activeCategory === cat 
                      ? "bg-fresh-500 text-white border-fresh-500 shadow-md shadow-fresh-500/10" 
                      : "bg-white text-slate-400 border-fresh-100 hover:border-fresh-300 hover:text-slate-600"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* 模板网格 - 小清新卡片 */}
        <div className="p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
            {filteredItems.map((item: any) => (
              <FreshCard key={item.id} item={item} onClick={() => setSelectedItem(item)} activeTab={activeTab} />
            ))}
            
            {filteredItems.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-fresh-200">
                <Flower2 className="w-16 h-16 mb-4 opacity-50 animate-bounce" />
                <p className="text-lg font-bold">The garden is empty</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className={cn(
    "flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all text-sm font-semibold",
    active ? "bg-fresh-100/50 text-fresh-700" : "text-slate-400 hover:bg-white hover:text-fresh-600 hover:shadow-sm"
  )}>
    {icon}
    <span>{label}</span>
  </div>
);

const FreshCard = ({ item, onClick, activeTab }: { item: any, onClick: () => void, activeTab: string }) => {
  const views = useMemo(() => Math.floor(Math.random() * 200) + 10, []);
  const likes = useMemo(() => Math.floor(Math.random() * 50) + 5, []);
  
  const colors = [
    'bg-sky-50 text-sky-500 border-sky-100',
    'bg-fresh-50 text-fresh-500 border-fresh-100',
    'bg-petal-50 text-petal-500 border-petal-100',
    'bg-lavender-50 text-lavender-500 border-lavender-100'
  ];
  const colorScheme = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);

  return (
    <div className="group flex flex-col gap-4">
      <div 
        className={cn(
          "relative aspect-square rounded-[2.5rem] overflow-hidden cursor-pointer shadow-soft group-hover:shadow-fresh-hover group-hover:-translate-y-2 transition-all duration-500 border-2 border-white flex items-center justify-center p-8",
          colorScheme.split(' ')[0]
        )}
        onClick={onClick}
      >
        <div className="flex flex-col items-center text-center gap-6">
          <div className={cn("w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center", colorScheme.split(' ')[1])}>
            {activeTab === 'prompts' ? <Layers className="w-6 h-6" /> : <Code2 className="w-6 h-6" />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-700 leading-tight">
              {item.title || item.name}
            </h3>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border bg-white/50", colorScheme.split(' ')[2])}>
              {item.category || 'General'}
            </span>
          </div>
        </div>

        {/* 悬浮操作 */}
        <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[4px]">
          <button className="bg-white text-fresh-600 font-bold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 transform translate-y-6 group-hover:translate-y-0 transition-all duration-500 hover:scale-105 active:scale-95">
            <GitFork className="w-4 h-4" /> Open
          </button>
        </div>
      </div>

      {/* 底部小清新元数据 */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-fresh-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {item.name.slice(0, 10)}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-bold text-fresh-300">
          <div className="flex items-center gap-1.5 hover:text-petal-500 transition-colors cursor-pointer">
            <Heart className="w-3 h-3" />
            <span>{likes}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-fresh-500 transition-colors cursor-pointer">
            <Eye className="w-3 h-3" />
            <span>{views}</span>
          </div>
        </div>
      </div>
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
