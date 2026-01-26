
import React, { useState, useContext, useMemo, memo, useCallback } from 'react';
import { Icons } from '../constants';
import { 
  CIC_PARTS, 
  CIC_STRUCTURE, 
  getParagraphsForChapter, 
  searchCatechismLocal 
} from '../services/catechismLocal';
import { CatechismParagraph } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const ParagraphItem = memo(({ p, fontSize, onInvestigate }: { 
  p: CatechismParagraph, 
  fontSize: number, 
  onInvestigate: (p: CatechismParagraph) => void 
}) => (
  <article 
    className="bg-white dark:bg-stone-800/40 p-6 md:p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 group relative overflow-hidden mb-4 hover:shadow-md"
    style={{ fontSize: `${fontSize}rem` }}
  >
     <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 bg-stone-900 dark:bg-stone-700 text-gold rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            § {p.number}
          </div>
          <span className="text-[9px] text-stone-400 font-serif italic">{p.context}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onInvestigate(p)}
            className="flex items-center gap-2 px-5 py-2 bg-sacred text-white hover:bg-stone-900 rounded-full text-[8px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 group/ai"
          >
             <Icons.Search className="w-3 h-3 group-hover/ai:rotate-12 transition-transform" /> 
             Análise IA
          </button>
          <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC §${p.number}`} content={p.content} className="scale-90" />
        </div>
     </header>

     <p className="font-serif text-stone-800 dark:text-stone-200 leading-relaxed tracking-tight text-justify first-letter:text-4xl first-letter:font-serif first-letter:text-sacred first-letter:mr-2 first-letter:float-left">
        {p.content}
     </p>
  </article>
));

const Catechism: React.FC<{ onDeepDive: (topic: string) => void }> = ({ onDeepDive }) => {
  const { lang } = useContext(LangContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(1.0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loadedContent, setLoadedContent] = useState<Record<string, CatechismParagraph[]>>({});
  const [searchResults, setSearchResults] = useState<CatechismParagraph[] | null>(null);

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
      // Lazy load content if not already loaded
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) {
      setSearchResults(null);
      return;
    }
    const results = searchCatechismLocal(searchTerm);
    setSearchResults(results);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-40 px-4 md:px-0">
       <header className="text-center space-y-8 pt-10">
          <div className="flex justify-center">
            <div className="p-8 bg-stone-900 rounded-[3rem] shadow-sacred border-4 border-gold/30">
               <Icons.Cross className="w-16 h-16 text-gold" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">Codex Fidei</h2>
            <p className="text-stone-400 italic text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed">"O depósito sagrado da fé confiado à Igreja."</p>
          </div>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-10 group relative">
             <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors z-10" />
             <input 
              type="text" 
              placeholder="Número do § ou tema..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-32 py-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] outline-none focus:ring-16 focus:ring-gold/5 focus:border-gold transition-all text-2xl font-serif italic shadow-2xl dark:text-white"
            />
            <button type="submit" className="absolute right-8 top-1/2 -translate-y-1/2 px-10 py-3 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform">Buscar</button>
          </form>
       </header>

       {/* RESULTADOS DE BUSCA */}
       {searchResults && (
         <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
               <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Resultados da Investigação</h3>
               <button onClick={clearSearch} className="text-[10px] font-black uppercase text-sacred hover:underline">Limpar Busca</button>
            </div>
            {searchResults.length > 0 ? (
              searchResults.map(p => (
                <ParagraphItem 
                  key={`search_${p.number}`} 
                  p={p} 
                  fontSize={fontSize} 
                  onInvestigate={(item) => onDeepDive(`Análise teológica profunda do parágrafo ${item.number} do CIC: "${item.content}"`)} 
                />
              ))
            ) : (
              <div className="py-20 text-center text-stone-400 font-serif italic">Nenhum parágrafo encontrado.</div>
            )}
         </section>
       )}

       {/* NAVEGAÇÃO HIERÁRQUICA */}
       <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {CIC_PARTS.map(part => (
            <div key={part.id} className="bg-white dark:bg-stone-900 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl overflow-hidden flex flex-col h-fit">
               <div className={`p-10 ${part.color} text-white space-y-2 relative overflow-hidden group/part`}>
                  <Icons.Cross className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover/part:scale-110 transition-transform duration-700" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] relative z-10 opacity-70">Parte {part.id}</span>
                  <h3 className="text-3xl font-serif font-bold relative z-10">{part.title}</h3>
                  <p className="text-[10px] font-serif italic relative z-10 opacity-80">{part.subtitle}</p>
               </div>
               
               <div className="p-8 flex-1 space-y-4">
                  {CIC_STRUCTURE[part.id]?.map((sec: any) => {
                    const isSectionOpen = expandedSections.has(sec.id);
                    return (
                      <div key={sec.id} className="border border-stone-50 dark:border-stone-800 rounded-[2.5rem] overflow-hidden transition-all duration-300">
                        <button 
                          onClick={() => toggleSection(sec.id)}
                          className={`w-full flex items-center justify-between p-6 text-left transition-colors ${isSectionOpen ? 'bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-700' : 'hover:bg-stone-50 dark:hover:bg-stone-800/30'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${isSectionOpen ? 'bg-gold text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>
                              <Icons.Book className="w-4 h-4" />
                            </div>
                            <h4 className={`text-sm font-serif font-bold transition-colors ${isSectionOpen ? 'text-stone-900 dark:text-gold' : 'text-stone-600 dark:text-stone-400'}`}>
                              {sec.title}
                            </h4>
                          </div>
                          <Icons.ArrowDown className={`w-5 h-5 text-stone-300 transition-transform duration-500 ${isSectionOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSectionOpen && (
                          <div className="p-4 bg-stone-50/30 dark:bg-stone-950/20 space-y-3 animate-in slide-in-from-top-2 duration-300">
                            {sec.chapters.map((chap: string) => {
                              const chapterKey = `${sec.id}_${chap}`;
                              const isChapterOpen = expandedChapters.has(chapterKey);
                              const chapterParas = loadedContent[chapterKey] || [];
                              
                              return (
                                <div key={chap} className="border border-stone-100/50 dark:border-stone-800 rounded-[2rem] overflow-hidden bg-white dark:bg-stone-900/50">
                                   <button 
                                      onClick={() => toggleChapter(sec, chap, part.id)}
                                      className={`w-full flex items-center justify-between px-6 py-4 text-left transition-all ${isChapterOpen ? 'bg-gold/5' : 'hover:bg-gold/5'}`}
                                   >
                                      <span className={`text-[11px] font-black uppercase tracking-widest ${isChapterOpen ? 'text-gold' : 'text-stone-400'}`}>Capítulo {chap}</span>
                                      <div className={`p-1.5 rounded-full transition-transform duration-500 ${isChapterOpen ? 'rotate-180 bg-gold text-stone-900' : 'text-stone-300'}`}>
                                        <Icons.ArrowDown className="w-3 h-3" />
                                      </div>
                                   </button>
                                   
                                   {isChapterOpen && (
                                     <div className="px-4 pb-6 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                        {chapterParas.length > 0 ? (
                                          chapterParas.map(p => (
                                            <ParagraphItem 
                                              key={`${chapterKey}_${p.number}`} 
                                              p={p} 
                                              fontSize={fontSize} 
                                              onInvestigate={(item) => onDeepDive(`Realize uma Análise IA profunda para o parágrafo ${item.number} do CIC que diz: "${item.content}". Busque referências na Bíblia e Santos.`)} 
                                            />
                                          ))
                                        ) : (
                                          <div className="py-10 text-center animate-pulse flex flex-col items-center gap-3">
                                             <Icons.History className="w-6 h-6 text-gold/30 animate-spin" />
                                             <span className="text-[9px] font-black uppercase text-stone-400">Extraindo Parágrafos...</span>
                                          </div>
                                        )}
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

       {/* CONTROLES FLUTUANTES (Ajuste de Texto) */}
       <div className="fixed bottom-32 right-8 z-[300] flex flex-col gap-3">
          <button 
            onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))}
            className="p-4 bg-white dark:bg-stone-800 rounded-full shadow-2xl border border-stone-100 dark:border-stone-700 text-stone-400 hover:text-gold transition-all"
          >
            <span className="text-xl font-bold">A+</span>
          </button>
          <button 
            onClick={() => setFontSize(f => Math.max(f - 0.1, 0.7))}
            className="p-4 bg-white dark:bg-stone-800 rounded-full shadow-2xl border border-stone-100 dark:border-stone-700 text-stone-400 hover:text-gold transition-all"
          >
            <span className="text-sm font-bold">A-</span>
          </button>
       </div>
    </div>
  );
};

export default Catechism;
