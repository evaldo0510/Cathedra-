
import React, { useState, useEffect, useContext, useCallback, useMemo, useRef, memo } from 'react';
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

type ImmersiveBg = 'parchment' | 'sepia' | 'dark' | 'white';

// Componente de Parágrafo Memoizado para economia de recursos e performance
const ParagraphItem = memo(({ p, fontSize, isActive, onSelect }: { p: CatechismParagraph, fontSize: number, isActive: boolean, onSelect: (n: number) => void }) => (
  <article 
    id={`p-${p.number}`}
    data-paragraph={p.number}
    onClick={() => onSelect(p.number)}
    className={`parchment dark:bg-stone-900 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-xl border-l-[12px] transition-all duration-500 group cursor-pointer ${isActive ? 'border-gold ring-4 ring-gold/10 scale-[1.01]' : 'border-sacred hover:border-gold'}`}
    style={{ fontSize: `${fontSize}rem` }}
  >
     <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'bg-gold text-stone-900' : 'bg-stone-900 text-gold'}`}>CIC {p.number}</span>
          {p.context && <span className="text-[9px] font-black uppercase text-stone-400 italic truncate max-w-[150px] md:max-w-xs">{p.context}</span>}
        </div>
        <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC ${p.number}`} content={p.content} />
     </header>
     <p className="font-serif italic text-stone-800 dark:text-stone-100 leading-relaxed tracking-tight text-justify">
        {p.content}
     </p>
  </article>
));

const Catechism: React.FC = () => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  
  const [viewMode, setViewMode] = useState<'index' | 'browse' | 'reading'>('index');
  const [currentPath, setCurrentPath] = useState<CatechismHierarchy[]>([]);
  const [hierarchy, setHierarchy] = useState<CatechismHierarchy[]>([]);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
  const [preservedIds, setPreservedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [fontSize, setFontSize] = useState(1.2);

  const [isImmersive, setIsImmersive] = useState(false);
  const [immersiveBg, setImmersiveBg] = useState<ImmersiveBg>('parchment');

  const observerRef = useRef<IntersectionObserver | null>(null);

  const refreshPreserved = useCallback(async () => {
    const ids = await offlineStorage.getPreservedIds('catechism');
    setPreservedIds(ids);
  }, []);

  useEffect(() => { refreshPreserved(); }, [refreshPreserved]);

  // MECANISMO DE DESCARREGAMENTO: Purgar memória ao navegar entre visões
  useEffect(() => {
    if (viewMode !== 'reading') {
      setParagraphs([]);
    }
  }, [viewMode]);

  // Scroll Observer para parágrafos
  useEffect(() => {
    if (viewMode === 'reading' && paragraphs.length > 0) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pNum = parseInt(entry.target.getAttribute('data-paragraph') || '0');
            if (pNum) setActiveParagraph(pNum);
          }
        });
      }, { threshold: 0.2, rootMargin: '-10% 0px -60% 0px' });

      paragraphs.forEach(p => {
        const el = document.getElementById(`p-${p.number}`);
        if (el) observerRef.current?.observe(el);
      });
    }
    return () => observerRef.current?.disconnect();
  }, [paragraphs, viewMode]);

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
    finally { setLoading(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const loadParagraphs = async (item: CatechismHierarchy) => {
    setParagraphs([]); // DESCARREGA ANTERIOR IMEDIATAMENTE
    setLoading(true);
    setViewMode('reading');
    
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

  const handleJump = async (num?: string) => {
    const target = num || jumpInput.trim();
    if (!target || isNaN(Number(target))) return;
    
    const targetNum = parseInt(target);
    if (targetNum < 1 || targetNum > 2865) return;

    setParagraphs([]);
    setLoading(true);
    setViewMode('reading');
    setJumpInput(String(targetNum));
    setCurrentPath([{ id: `jump_${target}`, title: `Parágrafo ${target}`, level: 'paragraph' }]);
    
    try {
      const data = await getCatechismSearch(`Parágrafo ${target}`, {}, lang);
      setParagraphs(data);
      if (data.length > 0) setActiveParagraph(data[0].number);
    } catch (e) { console.error(e); }
    finally { setLoading(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const navigateParagraph = (dir: number) => {
    const current = activeParagraph || (paragraphs.length > 0 ? paragraphs[0].number : 1);
    const next = current + dir;
    if (next >= 1 && next <= 2865) {
      handleJump(String(next));
    }
  };

  const scrollToParagraph = (n: number) => {
    setActiveParagraph(n);
    const el = document.getElementById(`p-${n}`);
    if (el) {
      const yOffset = -180;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const reset = () => {
    setViewMode('index');
    setCurrentPath([]);
    setParagraphs([]);
    setHierarchy([]);
    setJumpInput('');
  };

  const goBackHierarchy = () => {
    if (currentPath.length <= 1) {
      reset();
    } else {
      const newPath = [...currentPath];
      newPath.pop();
      const last = newPath[newPath.length - 1];
      setCurrentPath(newPath);
      loadHierarchy(last.id);
    }
  };

  const IndexView = () => (
    <div className="space-y-12 md:space-y-24 animate-in fade-in duration-700 px-4">
       <header className="text-center space-y-8 pt-10">
          <div className="flex justify-center">
            <div className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] shadow-sacred border border-gold/30 rotate-3 transition-transform hover:rotate-0">
               <Icons.Cross className="w-16 h-16 text-sacred dark:text-gold" />
            </div>
          </div>
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">Codex Fidei</h2>
          <p className="text-stone-400 italic text-2xl md:text-3xl font-serif max-w-3xl mx-auto">"O Catecismo é o nexo ininterrupto entre a Revelação e o Homem de hoje."</p>
          
          <div className="max-w-xl mx-auto pt-10 group relative">
             <Icons.Search className="absolute left-10 top-[70%] -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors z-10" />
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
              className="absolute right-4 top-[70%] -translate-y-1/2 px-8 py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Pular
            </button>
          </div>
       </header>

       <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto pb-32">
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
          <button onClick={goBackHierarchy} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full hover:text-gold transition-all shadow-sm">
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
          </button>
          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-4">
             <button onClick={reset} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-colors whitespace-nowrap">Codex</button>
             {currentPath.map((p, i) => (
               <React.Fragment key={p.id}>
                 <div className="w-1 h-1 rounded-full bg-stone-300" />
                 <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${i === currentPath.length-1 ? 'text-gold' : 'text-stone-400'}`}>{p.title}</span>
               </React.Fragment>
             ))}
          </div>
       </nav>

       <header className="text-center space-y-4">
          <span className="text-[12px] font-black uppercase tracking-[0.6em] text-gold">Exploratio</span>
          <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">{currentPath[currentPath.length-1]?.title}</h2>
       </header>

       {loading ? (
         <div className="py-40 text-center animate-pulse space-y-8">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-2xl font-serif italic text-stone-400">Consultando as tábuas da Lei...</p>
         </div>
       ) : (
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {hierarchy.map(item => {
              const isPreserved = preservedIds.has(item.id);
              // DESTAQUE "IMPERIAL GOLD" PARA SELEÇÕES ATIVAS
              const isCurrent = currentPath.some(p => p.id === item.id);
              return (
                <button 
                  key={item.id} 
                  onClick={() => item.level === 'article' ? loadParagraphs(item) : loadHierarchy(item.id, item.title)}
                  className={`p-12 rounded-[3.5rem] border-4 transition-all text-left flex flex-col justify-between group relative overflow-hidden h-72 shadow-xl ${
                    isCurrent 
                      ? 'bg-[#b8952e] border-gold text-white scale-105 z-10 shadow-[0_0_40px_rgba(184,149,46,0.5)]' 
                      : isPreserved ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'
                  } hover:border-gold hover:-translate-y-2`}
                >
                   <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isCurrent ? 'text-white/80' : 'text-gold/60'}`}>{item.level}</span>
                        {isPreserved && <Icons.Pin className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-emerald-500'}`} />}
                      </div>
                      <h4 className={`text-2xl md:text-3xl font-serif font-bold leading-tight transition-colors ${isCurrent ? 'text-white' : 'group-hover:text-sacred dark:text-stone-200'}`}>{item.title}</h4>
                   </div>
                   <div className="mt-8 flex justify-end relative z-10">
                      <div className={`p-4 rounded-2xl transition-all shadow-md ${isCurrent ? 'bg-white/20' : 'bg-stone-50 dark:bg-stone-800 group-hover:bg-gold'}`}>
                        <Icons.ArrowDown className={`w-5 h-5 -rotate-90 ${isCurrent ? 'text-white' : 'text-stone-300 group-hover:text-stone-900'}`} />
                      </div>
                   </div>
                   {isCurrent && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />}
                </button>
              );
            })}
         </div>
       )}
    </div>
  );

  const ImmersiveLectorium = () => {
    const bgStyles: Record<ImmersiveBg, string> = {
      parchment: 'bg-[#fdfcf8] text-stone-800 parchment',
      sepia: 'bg-[#f4ecd8] text-[#5b4636]',
      dark: 'bg-[#0c0a09] text-stone-300',
      white: 'bg-white text-stone-900'
    };

    return (
      <div className={`fixed inset-0 z-[1000] overflow-y-auto custom-scrollbar animate-in fade-in duration-700 ${bgStyles[immersiveBg]}`}>
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-40">
           <header className="text-center mb-24 space-y-6 opacity-30 hover:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] font-black uppercase tracking-[1.5em] text-gold">Catechismus Ecclesiæ</span>
              <h2 className="text-4xl md:text-8xl font-serif font-bold tracking-tighter">Codex CIC</h2>
              <div className="h-px w-24 bg-current mx-auto opacity-20" />
           </header>

           <div className="space-y-16">
             {paragraphs.map(p => (
               <ParagraphItem key={p.number} p={p} fontSize={fontSize * 1.3} isActive={activeParagraph === p.number} onSelect={scrollToParagraph} />
             ))}
           </div>

           <div className="mt-40 pt-20 border-t border-current opacity-5 flex justify-center pb-20">
              <Icons.Cross className="w-24 h-24" />
           </div>
        </div>

        {/* Floating Minimal Controls */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1010] bg-stone-900/90 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-6 group">
           <div className="flex items-center gap-4 border-r border-white/10 pr-10">
              {(['parchment', 'sepia', 'dark', 'white'] as ImmersiveBg[]).map(bg => (
                <button 
                  key={bg}
                  onClick={() => setImmersiveBg(bg)}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 ${immersiveBg === bg ? 'border-gold scale-110 shadow-lg' : 'border-white/20'}`}
                  style={{ backgroundColor: bg === 'parchment' ? '#fdfcf8' : bg === 'sepia' ? '#f4ecd8' : bg === 'dark' ? '#0c0a09' : '#ffffff' }}
                />
              ))}
           </div>
           
           <div className="flex items-center gap-4 text-white/40">
             <button onClick={() => setFontSize(prev => Math.max(0.8, prev - 0.1))} className="hover:text-gold transition-colors"><Icons.ArrowDown className="w-4 h-4 rotate-90" /></button>
             <span className="text-[10px] font-black uppercase tracking-widest min-w-[60px] text-center">Tamanho</span>
             <button onClick={() => setFontSize(prev => Math.min(2.5, prev + 0.1))} className="hover:text-gold transition-colors"><Icons.ArrowDown className="w-4 h-4 -rotate-90" /></button>
           </div>

           <button 
             onClick={() => setIsImmersive(false)}
             className="flex items-center gap-2 text-white hover:text-sacred transition-colors text-[10px] font-black uppercase tracking-widest pl-6 border-l border-white/10"
           >
             <Icons.Cross className="w-5 h-5 rotate-45" /> Sair
           </button>
        </div>
      </div>
    );
  };

  const ReadingView = () => (
    <div className="space-y-12 md:space-y-20 animate-in fade-in duration-700 pb-48">
      {isImmersive && <ImmersiveLectorium />}

      {/* BARRA DE NAVEGAÇÃO SUPERIOR - REFINADA IGUAL À BÍBLIA */}
      <nav className="sticky top-2 md:top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl rounded-full md:rounded-[3rem] border border-stone-200 dark:border-white/10 shadow-2xl p-2 md:p-3 flex items-center justify-between mx-2 md:mx-0 transition-all">
         <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('browse')} className="p-3 md:p-4 bg-stone-50 dark:bg-stone-800 hover:bg-gold hover:text-stone-900 rounded-full transition-all text-stone-400 group">
               <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 rotate-90 group-hover:-translate-x-1" />
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-full p-1 border border-stone-200 dark:border-stone-800 shadow-inner">
               <button onClick={reset} className="px-4 md:px-6 py-2 hover:bg-white dark:hover:bg-stone-800 rounded-full text-stone-900 dark:text-white font-serif font-bold text-xs md:text-lg transition-colors truncate max-w-[80px] md:max-w-none">Codex</button>
               <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-1 md:mx-2" />
               
               {/* SALTO DE PARÁGRAFO DIRETO */}
               <form onSubmit={(e) => { e.preventDefault(); handleJump(); }} className="relative flex items-center group">
                  <input 
                    type="number" 
                    value={jumpInput}
                    onChange={e => setJumpInput(e.target.value)}
                    className="w-12 md:w-24 px-1 md:px-2 py-1 bg-transparent border-none text-gold font-serif font-bold text-xl md:text-2xl text-center outline-none focus:ring-0 placeholder-gold/30"
                    placeholder="Nº"
                    min="1"
                    max="2865"
                  />
                  <button type="submit" className="p-1 md:p-2 text-stone-300 group-hover:text-gold transition-colors" title="Pular para parágrafo">
                     <Icons.Search className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
               </form>
            </div>
         </div>
         
         {/* NAVEGAÇÃO SEQUENCIAL DISCRETA */}
         <div className="flex items-center gap-2 md:gap-6 px-4 md:px-10 border-x border-stone-100 dark:border-white/5">
            <button 
              onClick={() => navigateParagraph(-1)}
              className="p-2 md:p-3 text-stone-300 hover:text-gold transition-all group/v"
              aria-label="Parágrafo anterior"
            >
              <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 rotate-180 group-active/v:scale-75" />
            </button>
            <div className="flex flex-col items-center min-w-[40px] md:min-w-[80px]">
               <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-stone-400 select-none">Parágrafo</span>
               <span className="text-sm md:text-xl font-serif font-bold text-gold tabular-nums transition-all">{activeParagraph || paragraphs[0]?.number || '...'}</span>
            </div>
            <button 
              onClick={() => navigateParagraph(1)}
              className="p-2 md:p-3 text-stone-300 hover:text-gold transition-all group/v"
              aria-label="Próximo parágrafo"
            >
              <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 group-active/v:scale-75" />
            </button>
         </div>

         <div className="flex items-center gap-2 md:gap-4 pr-2">
            <button 
               onClick={() => setIsImmersive(true)}
               className="p-3 md:p-4 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-gold hover:text-stone-900 transition-all text-stone-400 shadow-sm"
               title="Modo Lectorium (Imersivo)"
            >
               <Icons.Layout className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-stone-50 dark:bg-stone-800 p-2 rounded-2xl border border-stone-100 dark:border-stone-700">
               <span className="text-[9px] font-black text-stone-400">A</span>
               <input 
                 type="range" min="0.8" max="2.5" step="0.1" value={fontSize} 
                 onChange={e => setFontSize(parseFloat(e.target.value))}
                 className="w-20 h-1 bg-stone-200 dark:bg-stone-900 rounded-lg appearance-none cursor-pointer accent-gold"
               />
               <span className="text-sm font-black text-stone-400">A</span>
            </div>
         </div>
      </nav>

      {/* HEADER DE SEÇÃO */}
      <header className="bg-white dark:bg-stone-900 p-12 md:p-24 rounded-[4rem] md:rounded-[5rem] shadow-xl border-t-[16px] md:border-t-[20px] border-sacred text-center relative overflow-hidden mx-2 md:mx-0">
         <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none">
            <Icons.Cross className="w-80 h-80" />
         </div>
         <div className="relative z-10 space-y-6">
            <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] text-gold">Codex Fidei</span>
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{currentPath[currentPath.length-1]?.title}</h2>
            <div className="h-px w-32 bg-gold/20 mx-auto mt-10" />
         </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto space-y-12 px-4 md:px-0">
        {loading ? (
          <div className="py-40 text-center space-y-8 animate-pulse">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-2xl font-serif italic text-stone-400">Invocando o Depósito da Fé...</p>
          </div>
        ) : (
          <div className="space-y-12 pb-20">
            {paragraphs.map(p => (
              <ParagraphItem key={p.number} p={p} fontSize={fontSize} isActive={activeParagraph === p.number} onSelect={scrollToParagraph} />
            ))}
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO INFERIOR */}
      <div className="flex flex-col md:flex-row justify-center gap-6 pb-40 px-4 md:px-0">
         <button 
           disabled={paragraphs.length > 0 && paragraphs[0].number <= 1}
           onClick={() => navigateParagraph(-1)}
           className="px-12 md:px-14 py-7 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] disabled:opacity-10 transition-all hover:border-gold shadow-xl flex items-center justify-center gap-6 group"
         >
           <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:-translate-x-2 transition-transform" /> Anterior
         </button>
         <button 
           disabled={paragraphs.length > 0 && paragraphs[paragraphs.length-1].number >= 2865}
           onClick={() => navigateParagraph(1)}
           className="px-16 md:px-24 py-7 bg-gold text-stone-900 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] shadow-[0_25px_50px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-6 group"
         >
           Próximo <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:translate-x-2 transition-transform" />
         </button>
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
