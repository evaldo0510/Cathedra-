import React, { useState, useEffect, useContext, useCallback, useMemo, useRef, memo } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getIntelligentStudy } from '../services/gemini';
import { getLocalHierarchy, getLocalParagraph } from '../services/catechismLocal';
import { CatechismParagraph, CatechismHierarchy, AppRoute } from '../types';
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

// Fix: Updated onDeepDive type to allow asynchronous functions (Promise<void>)
const ParagraphItem = memo(({ p, fontSize, isActive, onSelect, onDeepDive }: { 
  p: CatechismParagraph, 
  fontSize: number, 
  isActive: boolean, 
  onSelect: (n: number) => void, 
  onDeepDive: (t: string) => void | Promise<void> 
}) => (
  <article 
    id={`p-${p.number}`}
    data-paragraph={p.number}
    onClick={() => onSelect(p.number)}
    className={`parchment dark:bg-stone-900 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border-l-[12px] transition-all duration-500 group cursor-pointer ${isActive ? 'border-gold ring-4 ring-gold/10 scale-[1.01]' : 'border-sacred hover:border-gold'}`}
    style={{ fontSize: `${fontSize}rem` }}
  >
     <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'bg-gold text-stone-900' : 'bg-stone-900 text-gold'}`}>CIC {p.number}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeepDive(`Significado teológico do parágrafo ${p.number} do Catecismo: ${p.content}`); }}
            className="flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold rounded-full text-[8px] font-black uppercase tracking-widest transition-all"
          >
             <Icons.Search className="w-3 h-3" /> Investigação Scholar
          </button>
        </div>
        <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC ${p.number}`} content={p.content} />
     </header>
     <p className="font-serif italic text-stone-800 dark:text-stone-100 leading-relaxed tracking-tight text-justify">
        {p.content}
     </p>
  </article>
));

// Fix: Added missing onNavigateDogmas to the Catechism component props interface
const Catechism: React.FC<{ 
  onDeepDive?: (topic: string) => void | Promise<void>;
  onNavigateDogmas?: (query: string) => void;
}> = ({ onDeepDive, onNavigateDogmas }) => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  
  const [viewMode, setViewMode] = useState<'index' | 'browse' | 'reading'>('index');
  const [currentPath, setCurrentPath] = useState<CatechismHierarchy[]>([]);
  const [hierarchy, setHierarchy] = useState<CatechismHierarchy[]>([]);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [fontSize, setFontSize] = useState(1.2);
  const [showSidebar, setShowSidebar] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (viewMode === 'reading' && paragraphs.length > 0) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pNum = parseInt(entry.target.getAttribute('data-paragraph') || '0');
            if (pNum) setActiveParagraph(pNum);
          }
        });
      }, { threshold: 0.5, rootMargin: '-20% 0px -60% 0px' });

      paragraphs.forEach(p => {
        const el = document.getElementById(`p-${p.number}`);
        if (el) observerRef.current?.observe(el);
      });
    }
    return () => observerRef.current?.disconnect();
  }, [paragraphs, viewMode]);

  const loadHierarchy = (parentId: string, title: string) => {
    setLoading(true);
    setViewMode('browse');
    const data = getLocalHierarchy(parentId);
    setHierarchy(data);
    setCurrentPath(prev => [...prev, { id: parentId, title, level: 'section' }]);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadParagraphs = async (item: CatechismHierarchy) => {
    setParagraphs([]);
    setLoading(true);
    setViewMode('reading');
    
    try {
      const local = await offlineStorage.getContent(item.id);
      if (local) {
        setParagraphs(local);
      } else if (isOnline) {
        const data = await getCatechismSearch(`parágrafos de ${item.title}`, {}, lang);
        if (data.length > 0) {
          setParagraphs(data);
          await offlineStorage.saveContent(item.id, 'catechism', item.title, data);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const handleJump = async (num?: string) => {
    const target = num || jumpInput.trim();
    if (!target || isNaN(Number(target))) return;
    
    const targetNum = parseInt(target);
    if (targetNum < 1 || targetNum > 2865) return;

    setLoading(true);
    setViewMode('reading');
    setJumpInput(String(targetNum));
    
    try {
      const localP = getLocalParagraph(targetNum);
      if (localP) {
        setParagraphs(localP);
        setActiveParagraph(targetNum);
        setLoading(false);
        return;
      }

      const data = await getCatechismSearch(`Parágrafo ${target}`, {}, lang);
      setParagraphs(data);
      if (data.length > 0) setActiveParagraph(data[0].number);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setViewMode('index');
    setCurrentPath([]);
    setParagraphs([]);
    setHierarchy([]);
  };

  const SidebarNav = () => (
    <div className={`fixed inset-y-0 left-0 z-[500] w-80 bg-white dark:bg-[#0c0a09] border-r border-gold/20 shadow-4xl transform transition-transform duration-500 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
      <header className="p-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
        <h3 className="text-xl font-serif font-bold text-gold">Codex Fidei</h3>
        <button onClick={() => setShowSidebar(false)} className="text-stone-300 hover:text-sacred transition-colors"><Icons.Cross className="w-5 h-5 rotate-45" /></button>
      </header>
      <div className="overflow-y-auto h-[calc(100%-100px)] p-4 space-y-8 custom-scrollbar">
        {ROOT_PARTS.map(part => (
          <div key={part.id} className="space-y-2">
            <h4 className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg text-white ${part.color}`}>{part.title}</h4>
            <button 
              onClick={() => { loadHierarchy(part.id, part.title); setShowSidebar(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gold/5 rounded-xl text-xs font-serif italic text-stone-500"
            >
              Explorar Seções
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const IndexView = () => (
    <div className="space-y-16 md:space-y-24 animate-in fade-in duration-700 pb-32">
       <header className="text-center space-y-8 pt-10">
          <div className="flex justify-center">
            <div className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] shadow-sacred border border-gold/30 rotate-3 hover:rotate-0 transition-transform">
               <Icons.Cross className="w-16 h-16 text-sacred dark:text-gold" />
            </div>
          </div>
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">Codex Fidei</h2>
          <p className="text-stone-400 italic text-2xl md:text-3xl max-w-3xl mx-auto">"O Catecismo é o depósito seguro da Fé transmitida pelos Apóstolos."</p>
          
          <div className="max-w-xl mx-auto pt-10 group relative px-4">
             <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors z-10" />
             <input 
              type="number" 
              placeholder="Digite o parágrafo (1-2865)" 
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleJump()}
              className="w-full pl-20 pr-32 py-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] outline-none focus:border-gold transition-all text-2xl font-serif italic shadow-xl"
            />
            <button 
              onClick={() => handleJump()}
              className="absolute right-8 top-1/2 -translate-y-1/2 px-8 py-3 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Abrir
            </button>
          </div>
       </header>

       <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto px-4">
          {ROOT_PARTS.map(part => (
            <button 
              key={part.id} 
              onClick={() => loadHierarchy(part.id, part.title)}
              className="group relative h-80 rounded-[4rem] overflow-hidden bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-2xl hover:-translate-y-2 transition-all p-12 text-left"
            >
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <part.icon className="w-56 h-56" />
               </div>
               <div className="relative z-10 space-y-6">
                  <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${part.color}`}>Parte {part.id.split('_')[1]}</span>
                  <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-gold transition-colors">{part.title}</h3>
                  <p className="text-xl font-serif italic text-stone-400">{part.subtitle}</p>
               </div>
               <div className="absolute bottom-12 right-12 p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl group-hover:bg-gold transition-all">
                  <Icons.ArrowDown className="w-6 h-6 -rotate-90 text-stone-200 group-hover:text-stone-900" />
               </div>
            </button>
          ))}
       </div>
    </div>
  );

  const BrowseView = () => (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 px-4 pb-32 pt-10">
       <nav className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-4 rounded-full border border-stone-200 dark:border-white/10 sticky top-2 z-[150] shadow-2xl">
          <button onClick={() => currentPath.length > 0 ? reset() : setViewMode('index')} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full hover:text-gold transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
          </button>
          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
             <button onClick={reset} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-colors whitespace-nowrap">Codex</button>
             {currentPath.map((p, i) => (
               <React.Fragment key={p.id}>
                 <div className="w-1 h-1 rounded-full bg-stone-300" />
                 <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${i === currentPath.length-1 ? 'text-gold' : 'text-stone-400'}`}>{p.title}</span>
               </React.Fragment>
             ))}
          </div>
       </nav>

       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {hierarchy.map(item => (
            <button 
              key={item.id} 
              onClick={() => item.level === 'article' ? loadParagraphs(item) : loadHierarchy(item.id, item.title)}
              className="p-12 rounded-[3.5rem] bg-white dark:bg-stone-900 border-4 border-stone-100 dark:border-stone-800 hover:border-gold transition-all text-left flex flex-col justify-between group relative overflow-hidden h-72 shadow-xl"
            >
               <div className="space-y-3 relative z-10">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gold/60">{item.level}</span>
                  <h4 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-sacred transition-colors">{item.title}</h4>
               </div>
               <div className="mt-8 flex justify-end">
                  <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl group-hover:bg-gold transition-all shadow-md">
                    <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-stone-300 group-hover:text-stone-900" />
                  </div>
               </div>
            </button>
          ))}
       </div>
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-48">
      <SidebarNav />
      {showSidebar && <div className="fixed inset-0 z-[490] bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />}

      <nav className="sticky top-2 md:top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl rounded-full md:rounded-[3rem] border border-stone-200 dark:border-white/10 shadow-2xl p-2 md:p-3 flex items-center justify-between mx-2 md:mx-0">
         <div className="flex items-center gap-2">
            <button onClick={() => setShowSidebar(true)} className="p-3 md:p-4 bg-stone-900 text-gold rounded-full hover:bg-gold hover:text-stone-900 transition-all shadow-lg">
               <Icons.Menu className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-full p-1 border border-stone-200 dark:border-stone-800 shadow-inner">
               <button onClick={reset} className="px-4 md:px-6 py-2 hover:bg-white dark:hover:bg-stone-800 rounded-full text-stone-900 dark:text-white font-serif font-bold text-xs md:text-lg">Codex</button>
               <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-1 md:mx-2" />
               <form onSubmit={(e) => { e.preventDefault(); handleJump(); }} className="relative flex items-center group">
                  <input 
                    type="number" value={jumpInput} onChange={e => setJumpInput(e.target.value)}
                    className="w-12 md:w-24 px-1 md:px-2 py-1 bg-transparent border-none text-gold font-serif font-bold text-xl md:text-2xl text-center outline-none focus:ring-0"
                    placeholder="Nº"
                  />
               </form>
            </div>
         </div>

         <div className="flex items-center gap-2 md:gap-6 px-4 md:px-10 border-x border-stone-100 dark:border-white/5">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-stone-400">A</span>
               <input 
                 type="range" min="1" max="2.5" step="0.1" value={fontSize} 
                 onChange={e => setFontSize(parseFloat(e.target.value))}
                 className="w-12 md:w-32 h-1 accent-gold"
               />
               <span className="text-sm font-black text-stone-400">A</span>
            </div>
         </div>
         
         <div className="pr-4 hidden md:block">
            <span className="text-[10px] font-black uppercase text-gold">Parágrafo {activeParagraph || '...'}</span>
         </div>
      </nav>

      <header className="bg-white dark:bg-stone-900 p-12 md:p-24 rounded-[4rem] md:rounded-[5rem] shadow-xl border-t-[16px] md:border-t-[20px] border-sacred text-center relative overflow-hidden mx-2 md:mx-0">
         <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none"><Icons.Cross className="w-80 h-80" /></div>
         <div className="relative z-10 space-y-6">
            <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] text-gold">Catechismus Ecclesiæ</span>
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{currentPath[currentPath.length-1]?.title || "Parágrafo " + jumpInput}</h2>
            <div className="h-px w-32 bg-gold/20 mx-auto mt-10" />
         </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12 px-4 md:px-0">
        {loading ? (
          <div className="py-40 text-center space-y-8 animate-pulse">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-2xl font-serif italic text-stone-400">Escutando o Magistério...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {paragraphs.map(p => (
              <ParagraphItem key={p.number} p={p} fontSize={fontSize} isActive={activeParagraph === p.number} onSelect={(n) => setActiveParagraph(n)} onDeepDive={onDeepDive || (() => {})} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto page-enter overflow-x-hidden">
      {viewMode === 'index' && <IndexView />}
      {viewMode === 'browse' && <BrowseView />}
      {viewMode === 'reading' && <ReadingView />}
    </div>
  );
};

export default Catechism;