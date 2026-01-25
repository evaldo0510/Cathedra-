
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getCatechismHierarchy } from '../services/gemini';
import { CatechismParagraph, CatechismHierarchy } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { offlineStorage } from '../services/offlineStorage';
import { useOfflineMode } from '../hooks/useOfflineMode';

const ROOT_PARTS = [
  { id: 'part_1', title: 'A Profissão da Fé', subtitle: 'A Fé professada (O Creio)', color: 'sacred' },
  { id: 'part_2', title: 'A Celebração do Mistério', subtitle: 'A Fé celebrada (Sacramentos)', color: 'gold' },
  { id: 'part_3', title: 'A Vida em Cristo', subtitle: 'A Fé vivida (Mandamentos)', color: 'emerald-600' },
  { id: 'part_4', title: 'A Oração Cristã', subtitle: 'A Fé rezada (O Pai Nosso)', color: 'blue-600' }
];

const Catechism: React.FC = () => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  const [viewMode, setViewMode] = useState<'parts' | 'articles' | 'reading'>('parts');
  const [currentPath, setCurrentPath] = useState<CatechismHierarchy[]>([]);
  const [hierarchy, setHierarchy] = useState<CatechismHierarchy[]>([]);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [preservedIds, setPreservedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const refreshPreserved = useCallback(async () => {
    const ids = await offlineStorage.getPreservedIds('catechism');
    setPreservedIds(ids);
  }, []);

  useEffect(() => { refreshPreserved(); }, [refreshPreserved]);

  const loadLevel = async (parentId?: string) => {
    setLoading(true);
    try {
      const data = await getCatechismHierarchy(parentId, lang);
      setHierarchy(data);
      setViewMode('articles');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadParagraphs = async (item: CatechismHierarchy) => {
    setLoading(true);
    setViewMode('reading');
    setParagraphs([]);
    
    try {
      // 1. Tentar Local
      const local = await offlineStorage.getContent(item.id);
      if (local) {
        setParagraphs(local);
        setLoading(false);
        return;
      }

      // 2. IA + Salvar
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

  const reset = () => {
    setViewMode('parts');
    setCurrentPath([]);
    setParagraphs([]);
  };

  const PartsView = () => (
    <div className="grid md:grid-cols-2 gap-8 animate-in fade-in duration-700">
       {ROOT_PARTS.map(part => (
         <button 
           key={part.id} 
           onClick={() => { setCurrentPath([{ id: part.id, title: part.title, level: 'part' }]); loadLevel(part.id); }}
           className="group relative h-80 rounded-[4rem] overflow-hidden bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-2xl hover:-translate-y-2 transition-all p-12 text-left"
         >
            <div className={`absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform text-${part.color}`}>
              <Icons.Cross className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-4">
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-stone-100 dark:bg-stone-800 text-${part.color}`}>Estrutura Fundamental</span>
               <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{part.title}</h3>
               <p className="text-xl font-serif italic text-stone-400">{part.subtitle}</p>
            </div>
            <Icons.ArrowDown className="absolute bottom-12 right-12 w-8 h-8 -rotate-90 text-stone-200 group-hover:text-gold transition-colors" />
         </button>
       ))}
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <nav className="sticky top-4 z-[200] bg-stone-900/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-4 flex items-center justify-between shadow-4xl">
         <button onClick={() => setViewMode('articles')} className="p-4 bg-white/5 hover:bg-gold hover:text-stone-900 rounded-2xl transition-all text-gold">
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
         </button>
         <h3 className="text-white font-serif font-bold truncate max-w-[60%]">{currentPath[currentPath.length-1]?.title}</h3>
         <div className="flex items-center gap-2 pr-4">
            <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl flex items-center gap-2">
               <Icons.Pin className="w-3 h-3" /> Memória de Pedra
            </span>
         </div>
      </nav>

      <div className="space-y-12">
        {loading ? (
          <div className="py-40 text-center space-y-6">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-2xl font-serif italic text-stone-400">Instalando Compêndio na Memória Local...</p>
          </div>
        ) : paragraphs.map((p, i) => (
          <article key={i} className="parchment dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] shadow-3xl border-l-[16px] border-sacred animate-in fade-in">
             <header className="flex justify-between items-center mb-10">
                <span className="px-6 py-2 bg-stone-900 text-gold rounded-full text-[10px] font-black uppercase tracking-widest">CIC {p.number}</span>
                <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC ${p.number}`} content={p.content} />
             </header>
             <p className="text-3xl md:text-5xl font-serif italic text-stone-800 dark:text-stone-100 leading-snug tracking-tight first-letter:text-8xl first-letter:font-bold first-letter:text-sacred first-letter:float-left first-letter:mr-4">
                {p.content}
             </p>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-32 page-enter">
      <header className="text-center space-y-6">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter" onClick={reset}>Codex Fidei</h2>
        <div className="flex justify-center gap-4">
           <div className="bg-emerald-500/10 text-emerald-500 px-6 py-2 rounded-full border border-emerald-500/20 inline-flex items-center gap-2">
              <Icons.Pin className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{preservedIds.size} Artigos Instalados</span>
           </div>
        </div>
      </header>

      {viewMode === 'parts' && <PartsView />}
      
      {viewMode === 'articles' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <button onClick={reset} className="text-gold text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-[-4px] transition-transform">
              <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Reiniciar Navegação
           </button>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hierarchy.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => item.level === 'article' ? loadParagraphs(item) : loadLevel(item.id)}
                  className={`p-10 rounded-[3rem] border transition-all text-left flex flex-col justify-between group relative overflow-hidden ${preservedIds.has(item.id) ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
                >
                   <div className="space-y-2 relative z-10">
                      <span className="text-[9px] font-black uppercase text-gold/60">{item.level}</span>
                      <h4 className="text-2xl font-serif font-bold leading-tight group-hover:text-sacred transition-colors">{item.title}</h4>
                   </div>
                   <div className="mt-8 flex justify-between items-center relative z-10">
                      <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-stone-200 group-hover:text-gold" />
                      {preservedIds.has(item.id) && <Icons.Pin className="w-3 h-3 text-emerald-500" />}
                   </div>
                </button>
              ))}
           </div>
        </div>
      )}

      {viewMode === 'reading' && <ReadingView />}
    </div>
  );
};

export default Catechism;
