
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getCatechismHierarchy } from '../services/gemini';
import { CatechismParagraph, CatechismHierarchy } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { offlineStorage } from '../services/offlineStorage';
import { useOfflineMode } from '../hooks/useOfflineMode';

const ROOT_PARTS = [
  { id: 'part_1', title: 'A Profissão da Fé', subtitle: 'O Credo', color: 'bg-sacred', icon: Icons.Cross },
  { id: 'part_2', title: 'A Celebração do Mistério', subtitle: 'Os Sacramentos', color: 'bg-gold', icon: Icons.History },
  { id: 'part_3', title: 'A Vida em Cristo', subtitle: 'Os Mandamentos', color: 'bg-emerald-600', icon: Icons.Users },
  { id: 'part_4', title: 'A Oração Cristã', subtitle: 'O Pai-Nosso', color: 'bg-blue-600', icon: Icons.Feather }
];

const Catechism: React.FC = () => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  
  // Modos: 'index', 'browse', 'reading'
  const [viewMode, setViewMode] = useState<'index' | 'browse' | 'reading'>('index');
  const [currentPath, setCurrentPath] = useState<CatechismHierarchy[]>([]);
  const [hierarchy, setHierarchy] = useState<CatechismHierarchy[]>([]);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [preservedIds, setPreservedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState('');

  const refreshPreserved = useCallback(async () => {
    const ids = await offlineStorage.getPreservedIds('catechism');
    setPreservedIds(ids);
  }, []);

  useEffect(() => { refreshPreserved(); }, [refreshPreserved]);

  const loadHierarchy = async (parentId?: string, title?: string) => {
    setLoading(true);
    setViewMode('browse');
    try {
      const data = await getCatechismHierarchy(parentId, lang);
      setHierarchy(data);
      if (title && parentId) {
        setCurrentPath(prev => [...prev, { id: parentId, title, level: 'section' }]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadParagraphs = async (item: CatechismHierarchy) => {
    setLoading(true);
    setViewMode('reading');
    setParagraphs([]);
    
    try {
      const local = await offlineStorage.getContent(item.id);
      if (local) {
        setParagraphs(local);
        setLoading(false);
        return;
      }

      if (isOnline) {
        const data = await getCatechismSearch(`parágrafos de ${item.title}`, {}, lang);
        if (data.length > 0) {
          setParagraphs(data);
          await offlineStorage.saveContent(item.id, 'catechism', item.title, data);
          await refreshPreserved();
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const handleJump = async () => {
    if (!jumpInput.trim() || isNaN(Number(jumpInput))) return;
    setLoading(true);
    setViewMode('reading');
    try {
      const data = await getCatechismSearch(`Parágrafo ${jumpInput}`, {}, lang);
      setParagraphs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setViewMode('index');
    setCurrentPath([]);
    setParagraphs([]);
    setHierarchy([]);
  };

  const goBackHierarchy = () => {
    if (currentPath.length <= 1) {
      reset();
    } else {
      const newPath = [...currentPath];
      newPath.pop();
      setCurrentPath(newPath);
      loadHierarchy(newPath[newPath.length - 1].id);
    }
  };

  const IndexView = () => (
    <div className="space-y-16 animate-in fade-in duration-700">
       <header className="text-center space-y-6 pt-10">
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">Codex Fidei</h2>
          <p className="text-stone-400 italic text-2xl font-serif max-w-2xl mx-auto">"O Catecismo da Igreja Católica é a regra segura para o ensino da fé."</p>
          
          <div className="max-w-md mx-auto pt-8 flex gap-2">
            <input 
              type="number" 
              placeholder="Ir para o parágrafo (Ex: 121)" 
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleJump()}
              className="flex-1 px-6 py-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl outline-none focus:border-gold transition-all text-lg font-serif italic"
            />
            <button onClick={handleJump} className="px-6 py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Pular</button>
          </div>
       </header>

       <div className="grid md:grid-cols-2 gap-8">
          {ROOT_PARTS.map(part => (
            <button 
              key={part.id} 
              onClick={() => loadHierarchy(part.id, part.title)}
              className="group relative h-72 rounded-[3.5rem] overflow-hidden bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-xl hover:-translate-y-2 transition-all p-10 text-left"
            >
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <part.icon className={`w-48 h-48`} />
               </div>
               <div className="relative z-10 space-y-4">
                  <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${part.color}`}>Parte {part.id.split('_')[1]}</span>
                  <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{part.title}</h3>
                  <p className="text-lg font-serif italic text-stone-400">{part.subtitle}</p>
               </div>
               <Icons.ArrowDown className="absolute bottom-10 right-10 w-6 h-6 -rotate-90 text-stone-200 group-hover:text-gold transition-colors" />
            </button>
          ))}
       </div>
    </div>
  );

  const BrowseView = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
       <nav className="flex items-center gap-4 bg-white/50 dark:bg-stone-900/50 p-4 rounded-[2rem] border border-stone-100 dark:border-stone-800">
          <button onClick={goBackHierarchy} className="p-3 bg-white dark:bg-stone-800 rounded-xl hover:text-gold transition-colors">
            <Icons.ArrowDown className="w-4 h-4 rotate-90" />
          </button>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
             {currentPath.map((p, i) => (
               <React.Fragment key={p.id}>
                 {i > 0 && <span className="text-stone-300 text-xs">/</span>}
                 <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${i === currentPath.length-1 ? 'text-gold' : 'text-stone-400'}`}>{p.title}</span>
               </React.Fragment>
             ))}
          </div>
       </nav>

       {loading ? (
         <div className="py-40 text-center animate-pulse">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-xl font-serif italic text-stone-400">Indexando o Depósito da Fé...</p>
         </div>
       ) : (
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hierarchy.map(item => (
              <button 
                key={item.id} 
                onClick={() => item.level === 'article' ? loadParagraphs(item) : loadHierarchy(item.id, item.title)}
                className={`p-10 rounded-[3rem] border transition-all text-left flex flex-col justify-between group relative overflow-hidden ${preservedIds.has(item.id) ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/30' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
              >
                 <div className="space-y-2 relative z-10">
                    <span className="text-[8px] font-black uppercase text-gold/60 tracking-[0.2em]">{item.level}</span>
                    <h4 className="text-xl font-serif font-bold leading-tight group-hover:text-sacred transition-colors dark:text-stone-200">{item.title}</h4>
                 </div>
                 <div className="mt-8 flex justify-between items-center relative z-10">
                    <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg group-hover:bg-gold transition-colors">
                      <Icons.ArrowDown className="w-4 h-4 -rotate-90 text-stone-300 group-hover:text-stone-900" />
                    </div>
                    {preservedIds.has(item.id) && <Icons.Pin className="w-3 h-3 text-emerald-500" />}
                 </div>
              </button>
            ))}
         </div>
       )}
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <nav className="sticky top-4 z-[200] bg-white/90 dark:bg-[#0c0a09]/95 backdrop-blur-xl rounded-[2.5rem] border border-stone-200 dark:border-white/10 p-3 flex items-center justify-between shadow-4xl">
         <button onClick={() => setViewMode('browse')} className="p-4 bg-stone-50 dark:bg-stone-800 hover:bg-gold hover:text-stone-900 rounded-2xl transition-all text-stone-400">
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
         </button>
         <div className="text-center">
            <h3 className="text-stone-900 dark:text-stone-100 font-serif font-bold text-lg leading-tight truncate max-w-[250px]">{currentPath[currentPath.length-1]?.title || 'Pesquisa Direta'}</h3>
            <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Compêndio Oficial</span>
         </div>
         <div className="flex items-center gap-2 pr-2">
            <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl hidden sm:flex items-center gap-2">
               <Icons.Pin className="w-3 h-3" /> Memória Local
            </span>
         </div>
      </nav>

      <div className="max-w-4xl mx-auto space-y-12 pb-40">
        {loading ? (
          <div className="py-40 text-center space-y-6">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-2xl font-serif italic text-stone-400">Instalando os parágrafos sagrados...</p>
          </div>
        ) : paragraphs.map((p, i) => (
          <article key={i} className="parchment dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-3xl border-l-[12px] border-sacred animate-in fade-in transition-all group hover:scale-[1.01]">
             <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <span className="px-6 py-2 bg-stone-900 text-gold rounded-full text-[10px] font-black uppercase tracking-[0.2em]">CIC {p.number}</span>
                  {p.context && <span className="text-[8px] font-black uppercase text-stone-400 italic truncate max-w-xs">{p.context}</span>}
                </div>
                <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC ${p.number}`} content={p.content} />
             </header>
             <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-100 leading-relaxed tracking-tight">
                {p.content}
             </p>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-32 page-enter">
      {viewMode === 'index' && <IndexView />}
      {viewMode === 'browse' && <BrowseView />}
      {viewMode === 'reading' && <ReadingView />}
    </div>
  );
};

export default Catechism;
