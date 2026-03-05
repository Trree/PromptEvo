import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Layout, Zap, Save, ChevronRight, BrainCircuit, Wrench } from 'lucide-react';

const queryClient = new QueryClient();

// API 基础路径
const api = axios.create({ baseURL: 'http://192.210.243.20:3000/api' });

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<'prompts' | 'skills'>('prompts');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();

  // 获取数据
  const { data: prompts = [] } = useQuery({ queryKey: ['prompts'], queryFn: () => api.get('/prompts').then(res => res.data) });
  const { data: skills = [] } = useQuery({ queryKey: ['skills'], queryFn: () => api.get('/skills').then(res => res.data) });

  // 保存 Prompt 的 Mutation
  const savePrompt = useMutation({
    mutationFn: (data: any) => api.post('/prompts', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] }),
  });

  return (
    <div className="flex h-screen bg-white">
      {/* 侧边栏 */}
      <aside className="w-72 border-r bg-slate-50 flex flex-col">
        <div className="p-6 border-b bg-white">
          <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-600">
            <BrainCircuit size={24} />
            Gemini Manager
          </h1>
        </div>
        
        {/* Tab 切换 */}
        <div className="flex p-2 gap-1">
          <button 
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'prompts' ? 'bg-white shadow-sm border text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Layout size={16} /> Prompts
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'skills' ? 'bg-white shadow-sm border text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Zap size={16} /> Skills
          </button>
        </div>

        {/* 列表区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(activeTab === 'prompts' ? prompts : skills).map((item: any) => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`group p-3 rounded-lg cursor-pointer flex items-center justify-between transition-all ${selectedItem?.id === item.id ? 'bg-indigo-50 border-indigo-200 border' : 'hover:bg-slate-100 border-transparent border'}`}
            >
              <div className="flex flex-col min-w-0">
                <span className="font-semibold truncate text-slate-700">{item.title || item.name}</span>
                <span className="text-xs text-slate-400 truncate font-mono uppercase">{item.name}</span>
              </div>
              <ChevronRight size={14} className={`text-slate-300 group-hover:text-indigo-400 transition-colors ${selectedItem?.id === item.id ? 'text-indigo-500' : ''}`} />
            </div>
          ))}
          
          <button 
            onClick={() => setSelectedItem({ name: '', title: '', content: '', description: '', category: '' })}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2 transition-all mt-4"
          >
            <Plus size={18} /> New {activeTab === 'prompts' ? 'Prompt' : 'Skill'}
          </button>
        </div>
      </aside>

      {/* 主工作区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedItem ? (
          <div className="flex-1 flex flex-col">
            <header className="px-8 py-6 border-b flex items-center justify-between">
              <div className="flex-1 max-w-2xl">
                <input 
                  value={selectedItem.title || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, title: e.target.value})}
                  className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-slate-300"
                  placeholder="Untitled Prompt..."
                />
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {selectedItem.name || 'new'}</span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{selectedItem.category || 'general'}</span>
                </div>
              </div>
              <button 
                onClick={() => savePrompt.mutate(selectedItem)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm active:scale-95 transition-all"
              >
                <Save size={18} /> Save Changes
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* 编辑器区域 */}
              <div className="flex-1 p-8 flex flex-col gap-6 bg-slate-50/30 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Key (Name)</label>
                  <input 
                    value={selectedItem.name || ''}
                    onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                    placeholder="e.g. blog-writer"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div className="flex-1 flex flex-col space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Content</label>
                  <textarea 
                    value={selectedItem.content || ''}
                    onChange={(e) => setSelectedItem({...selectedItem, content: e.target.value})}
                    placeholder="Write your prompt here... Use {{variable}} for dynamic content"
                    className="flex-1 w-full bg-white border border-slate-200 rounded-lg px-6 py-6 font-mono text-sm leading-relaxed outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm min-h-[400px]"
                  />
                </div>
              </div>

              {/* 右边栏：变量预览 */}
              <aside className="w-80 border-l bg-slate-50/50 p-6 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Wrench size={14} /> Detected Variables
                </h3>
                <div className="space-y-3">
                  {JSON.parse(selectedItem.variables || '[]').length > 0 ? (
                    JSON.parse(selectedItem.variables || '[]').map((v: string) => (
                      <div key={v} className="bg-white border rounded-lg p-3 shadow-sm border-indigo-100">
                        <span className="text-sm font-mono text-indigo-600 font-semibold">{v}</span>
                        <div className="mt-2 h-8 bg-slate-50 rounded animate-pulse" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">No variables found. Add them using {"{{name}}"}.</p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <Layout size={64} className="mb-4 text-slate-200" />
            <p className="text-lg">Select an item to edit or create a new one</p>
          </div>
        )}
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
