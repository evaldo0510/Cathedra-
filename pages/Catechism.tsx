
import React, { useState, useContext, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { 
  CIC_PARTS, 
  CIC_STRUCTURE, 
  getParagraphsForChapter, 
  searchCatechismLocal,
  getParagraphLocal
} from '../services/catechismLocal';
import { CatechismParagraph } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const ParagraphItem = memo(({ p, fontSize, isActive, onInvestigate }: { 
  p: CatechismParagraph, 
  fontSize: number, 
  isActive: boolean,
  onInvestigate: (p: CatechismParagraph) => void 
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && itemRef.current) {
      const yOffset = -180; 
      const y = itemRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [isActive]);

  return (
    <article 
      ref={itemRef}
      id={`para-${p.number}`}
      className={`p-6 md:p-10 rounded-[2.5rem] border-2 transition-all duration-700 group relative overflow-hidden mb-6 ${
        isActive 
          ? 'bg-gold/15 border-gold shadow-[0_20px_50px_rgba(212,175,55,0.2)] ring-8 ring-gold/5 scale-[1.02] z-10' 
          : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/30'
      }`}
      style={{ fontSize: `${fontSize}rem` }}
    >
       {isActive && <div className="absolute top-0 left-0 w-full h-1.5 bg-gold animate-shimmer" />}
       
       <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all duration-500 ${isActive ? 'bg-gold text-stone-900 scale-110' : 'bg-stone-900 dark:bg-stone-700 text-gold'}`}>
              § {p.number}
            </div>
            <span className={`text-[10px] font-serif italic transition-colors ${isActive ? 'text-gold' : 'text-stone-400'}`}>{p.context}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onInvestigate(p)}
              className="flex items-center gap-2 px-6 py-2.5 bg-sacred text-white hover:bg-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
               Análise IA
            </button>
            <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC §${p.number}`} content={p.content} className="scale-90" />
          </div>
       </header>

       <p className={`font-serif leading-relaxed tracking-tight text-justify transition-all duration-500 ${isActive ? 'text-stone-900 dark:text-stone-50 font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
          {p.content}
       </p>
    </article>
  );
});

const Catechism: React.FC<{ onDeepDive: (topic: string) => void }> = ({ onDeepDive }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paragraphJump, setParagraphJump] = useState('');
  const [fontSize, setFontSize] = useState(1.1);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loadedContent, setLoadedContent] = useState<Record<string, CatechismParagraph[]>>({});
  const [searchResults, setSearchResults] = useState<CatechismParagraph[] | null>(null);
  const [activeParaNumber, setActiveParaNumber] = useState<number | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleChapter = useCallback((section: any, chapter: string, partId: string) => {
    const chapterKey = `${section.id}_${chapter}`;
    if (!expandedChapters.has(chapterKey)) {
      if (!loadedContent[chapterKey]) {
        const data = getParagraphsForChapter(partId, section.title, chapter);
        setLoadedContent(prev => ({ ...prev, [chapterKey]: data }));
      }
    }
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterKey)) next.delete(chapterKey);
      else next.add(chapterKey);
      return next;
    });
  }, [expandedChapters, loadedContent]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(paragraphJump);
    if (isNaN(num)) return;

    const p = getParagraphLocal(num);
    if (p) {
      setSearchResults([p]);
      setActiveParaNumber(num);
      setParagraphJump('');
    } else {
      alert("Parágrafo não encontrado na base offline.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }
    const results = searchCatechismLocal(searchTerm);
    setSearchResults(results);
    setActiveParaNumber(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-40 px-2 md:px-4">
       <header className="text-center space-y-6 pt-4">
          <div className="flex justify-center">
             <Icons.Cross className="w-12 h-12 text-gold p-3 bg-stone-900 rounded-full" />
          </div>
          <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">Codex Fidei</h2>
          
          <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto pt-4">
            <form onSubmit={handleSearch} className="flex-1 relative group">
               <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
               <input 
                type="text" 
                placeholder="Busca temática..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-12 py-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] outline-none focus:ring-8 focus:ring-gold/5 focus:border-gold transition-all font-serif italic shadow-lg"
              />
            </form>

            <form onSubmit={handleJump} className="flex-shrink-0 relative group">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gold font-bold">§</div>
               <input 
                type="number" 
                placeholder="Ir p/ §..." 
                value={paragraphJump}
                onChange={e => setParagraphJump(e.target.value)}
                className="w-full md:w-44 pl-12 pr-6 py-5 bg-[#fcf8e8] dark:bg-stone-800 border-2 border-gold/20 rounded-[2rem] outline-none focus:ring-8 focus:ring-gold/5 focus:border-gold transition-all font-bold shadow-lg"
              />
            </form>
          </div>
       </header>

       {/* RESULTADOS / JUMP VIEW */}
       {searchResults && (
         <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 px-4">
               <h3 className="text-xl font-serif font-bold">Resultados</h3>
               <button onClick={() => { setSearchResults(null); setActiveParaNumber(null); }} className="text-[9px] font-black uppercase text-sacred">Limpar</button>
            </div>
            <div className="space-y-4 px-2">
              {searchResults.map(p => (
                <ParagraphItem 
                  key={`res_${p.number}`} 
                  p={p} 
                  fontSize={fontSize} 
                  isActive={activeParaNumber === p.number}
                  onInvestigate={(item) => onDeepDive(`Analogia teológica para o parágrafo ${item.number} do CIC`)} 
                />
              ))}
            </div>
         </section>
       )}

       {/* ESTRUTURA COLAPSÁVEL NATIVA */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {CIC_PARTS.map(part => (
            <div key={part.id} className="bg-white dark:bg-stone-950 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl overflow-hidden h-fit">
               <div className={`p-8 ${part.color} text-white space-y-1 relative overflow-hidden group/part`}>
                  <Icons.Cross className="absolute -right-6 -bottom-6 w-24 h-24 opacity-10 group-hover/part:rotate-12 transition-transform duration-700" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-70">Parte {part.id}</span>
                  <h3 className="text-xl md:text-2xl font-serif font-bold">{part.title}</h3>
               </div>
               
               <div className="p-4 md:p-6 space-y-3">
                  {CIC_STRUCTURE[part.id]?.map((sec: any) => {
                    const isSectionOpen = expandedSections.has(sec.id);
                    return (
                      <div key={sec.id} className="border border-stone-50 dark:border-stone-900 rounded-[2rem] overflow-hidden">
                        <button 
                          onClick={() => toggleSection(sec.id)}
                          className={`w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors ${isSectionOpen ? 'bg-stone-50 dark:bg-stone-900' : 'hover:bg-stone-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSectionOpen ? 'bg-gold text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>
                              <Icons.Book className="w-3.5 h-3.5" />
                            </div>
                            <h4 className={`text-xs md:text-sm font-serif font-bold ${isSectionOpen ? 'text-stone-900 dark:text-gold' : 'text-stone-600'}`}>{sec.title}</h4>
                          </div>
                          <Icons.ArrowDown className={`w-4 h-4 text-stone-300 transition-transform ${isSectionOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSectionOpen && (
                          <div className="p-2 bg-stone-50/30 dark:bg-stone-950/40 space-y-2 animate-in slide-in-from-top-2 duration-300">
                            {sec.chapters.map((chap: string) => {
                              const chapterKey = `${sec.id}_${chap}`;
                              const isChapterOpen = expandedChapters.has(chapterKey);
                              const chapterParas = loadedContent[chapterKey] || [];
                              
                              return (
                                <div key={chap} className="border border-stone-100/50 dark:border-stone-800 rounded-[1.5rem] overflow-hidden bg-white dark:bg-stone-900/40">
                                   <button 
                                      onClick={() => toggleChapter(sec, chap, part.id)}
                                      className={`w-full flex items-center justify-between px-5 py-3 text-left transition-all ${isChapterOpen ? 'bg-gold/5' : ''}`}
                                   >
                                      <span className={`text-[9px] font-black uppercase tracking-widest ${isChapterOpen ? 'text-gold' : 'text-stone-400'}`}>Capítulo {chap}</span>
                                      <Icons.ArrowDown className={`w-3 h-3 text-stone-300 transition-transform ${isChapterOpen ? 'rotate-180' : ''}`} />
                                   </button>
                                   
                                   {isChapterOpen && (
                                     <div className="px-2 pb-4 pt-1">
                                        {chapterParas.map(p => (
                                          <ParagraphItem 
                                            key={`${chapterKey}_${p.number}`} 
                                            p={p} 
                                            fontSize={fontSize} 
                                            isActive={activeParaNumber === p.number}
                                            onInvestigate={(item) => onDeepDive(`Investigação teológica: CIC §${item.number}`)} 
                                          />
                                        ))}
                                     </div>
                                   )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          ))}
       </div>

       {/* ACESSIBILIDADE FIXA */}
       <div className="fixed bottom-24 right-4 md:right-8 z-[300] flex flex-col gap-2">
          <button onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-xl font-black">A+</span></button>
          <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-lg font-black">A-</span></button>
       </div>
    </div>
  );
};

export default Catechism;
