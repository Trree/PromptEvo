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
  MoreHorizontal
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

  // 如果有选中项，显示编辑器视图
  if (selectedItem) {
    return (
      <div className="min-h-screen bg-white flex flex-col animate-in fade-in duration-500">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-slate-900 leading-none mb-1">{selectedItem.title || 'Untitled'}</h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{selectedItem.name || 'New'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => saveMutation.mutate(selectedItem)}
              className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-8">
           <input 
              value={selectedItem.title || ''}
              onChange={(e) => setSelectedItem({...selectedItem, title: e.target.value})}
              className="text-4xl font-bold tracking-tight text-slate-900 border-none outline-none focus:ring-0 w-full placeholder:text-slate-200"
              placeholder="Give it a title..."
            />
            <textarea 
              value={selectedItem.content || ''}
              onChange={(e) => setSelectedItem({...selectedItem, content: e.target.value})}
              placeholder="Write your prompt or skill configuration here..."
              className="w-full min-h-[500px] bg-slate-50 border border-slate-100 rounded-3xl p-8 outline-none focus:bg-white focus:ring-4 focus:ring-brand-50/50 focus:border-brand-200 transition-all font-mono text-sm leading-relaxed"
            />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-[#1A1A1A] font-sans">
      {/* 侧边栏 */}
      <aside className="w-64 border-r border-slate-100 flex flex-col h-screen sticky top-0 bg-white shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="font-bold text-lg tracking-tight text-slate-900">YouWare</div>
          </div>
          <PanelLeft className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-900" />
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          <NavItem icon={<Compass className="w-5 h-5" />} label="Explore" active />
          <NavItem icon={<Layout className="w-5 h-5" />} label="Templates" />
          <NavItem icon={<FlaskConical className="w-5 h-5" />} label="Labs" />
          <div className="h-4" />
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">My Workspace</div>
          <NavItem icon={<FolderOpen className="w-5 h-5" />} label="My Projects" />
          <NavItem icon={<Users className="w-5 h-5" />} label="Community" />
        </nav>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 border-2 border-white shadow-sm" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">John Doe</span>
              <span className="text-xs text-slate-500 font-medium">1,250 Credits</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区域 - Explore Style */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* 顶部搜索与分类 */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100 pt-6 pb-4 px-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Explore</h1>
            <div className="flex items-center gap-4">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('prompts')}
                  className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", activeTab === 'prompts' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                >
                  Prompts
                </button>
                <button 
                  onClick={() => setActiveTab('skills')}
                  className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", activeTab === 'skills' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                >
                  Skills
                </button>
              </div>
              <button 
                onClick={() => setSelectedItem({ name: '', title: '', content: '', description: '', category: 'General' })}
                className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20"
              >
                + New {activeTab === 'prompts' ? 'Prompt' : 'Skill'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative group w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the community..."
                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 focus:border-brand-300 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                    activeCategory === cat 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* 社区 Feed 网格 - Dribbble/YouWare Explore 风格 */}
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {filteredItems.map((item: any) => (
              <ExploreCard key={item.id} item={item} onClick={() => setSelectedItem(item)} activeTab={activeTab} />
            ))}
            
            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No projects found</p>
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
    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-bold",
    active ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
  )}>
    {icon}
    <span>{label}</span>
  </div>
);

const ExploreCard = ({ item, onClick, activeTab }: { item: any, onClick: () => void, activeTab: string }) => {
  // 生成随机统计数据和配色
  const views = useMemo(() => Math.floor(Math.random() * 5000) + 100, []);
  const likes = useMemo(() => Math.floor(Math.random() * 1000) + 10, []);
  
  const gradients = [
    'from-blue-500 to-cyan-400',
    'from-indigo-500 to-purple-500',
    'from-emerald-400 to-teal-500',
    'from-orange-400 to-rose-400',
    'from-slate-800 to-slate-900',
    'from-pink-500 to-rose-500'
  ];
  const bgGradient = useMemo(() => gradients[Math.floor(Math.random() * gradients.length)], []);

  return (
    <div className="group flex flex-col gap-3">
      {/* 卡片预览区 */}
      <div 
        className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 cursor-pointer shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 border border-slate-200/60"
        onClick={onClick}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", bgGradient)} />
        
        <div className="absolute inset-0 p-6 flex flex-col">
          <div className="flex justify-between items-start">
            <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
              {item.category || 'General'}
            </span>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-white/90 backdrop-blur-sm",
              activeTab === 'prompts' ? "text-brand-600" : "text-emerald-600"
            )}>
              {activeTab === 'prompts' ? <Layers className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
            </div>
          </div>
          
          <div className="mt-auto">
             <h3 className="text-2xl font-black text-slate-900 leading-tight line-clamp-2">
              {item.title || item.name}
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-2 line-clamp-2">
              {item.description || "A powerful configuration for your AI workflow."}
            </p>
          </div>
        </div>

        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <button className="bg-white text-slate-900 font-bold px-6 py-2.5 rounded-full shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105">
            <GitFork className="w-4 h-4" /> Remix
          </button>
        </div>
      </div>

      {/* 卡片底部元数据 */}
      <div className="flex items-center justify-between px-1 mt-1">
        <div className="flex items-center gap-2.5 cursor-pointer group/user">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border border-slate-200">
            <span className="text-[10px] font-bold text-indigo-700">AI</span>
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover/user:text-brand-600 transition-colors">
            {item.name.split('-')[0] || 'Creator'}
          </span>
          <span className="text-xs text-slate-400 font-medium px-1.5 py-0.5 bg-slate-100 rounded-md">PRO</span>
        </div>
        
        <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1 hover:text-slate-600 transition-colors cursor-pointer">
            <Heart className="w-3.5 h-3.5" />
            <span>{(likes / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex items-center gap-1 hover:text-slate-600 transition-colors cursor-pointer">
            <Eye className="w-3.5 h-3.5" />
            <span>{(views / 1000).toFixed(1)}k</span>
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
