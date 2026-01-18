
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getDogmaticLinksForCatechism, getCatechismHierarchy } from '../services/gemini';
import { CatechismParagraph, Dogma, CatechismHierarchy } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const Catechism: React.FC<{ onDeepDive?: (topic: string) => void, onNavigateDogmas?: (q: string) => void }> = ({ onDeepDive, onNavigateDogmas }) => {
  const { lang, t } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'search' | 'browse'>('browse');
  const [query, setQuery] = useState('');
  const [hierarchy, setHierarchy] = useState<CatechismHierarchy[]>([]);
  const [currentPath, setCurrentPath] = useState<CatechismHierarchy[]>([]);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [dogmaticLinks, setDogmaticLinks] = useState<Record<number, Dogma[]>>({});

  // Inicializa o Navegador
  useEffect(() => {
    if (viewMode === 'browse') loadHierarchy();
  }, [viewMode]);

  const loadHierarchy = async (parentId?: string) => {
    setLoading(true);
    try {
      const data = await getCatechismHierarchy(parentId, lang);
      setHierarchy(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleNavigate = (item: CatechismHierarchy) => {
    setCurrentPath([...currentPath, item]);
    // Se o item for um artigo (nível baixo), carregamos os parágrafos dele
    if (item.level === 'article') {
      handleSearch(`parágrafos do ${item.title}`);
    } else {
      loadHierarchy(item.id);
    }
  };

  const goBack = () => {
    const newPath = [...currentPath];
    newPath.pop();
    setCurrentPath(newPath);
    const lastItem = newPath[newPath.length - 1];
    loadHierarchy(lastItem?.id);
    setParagraphs([]);
  };

  const handleSearch = async (term?: string) => {
    const q = term || query;
    if (!q.trim()) return;
    setLoading(true);
    setParagraphs([]);
    setDogmaticLinks({});
    try {
      const results = await getCatechismSearch(q, {}, lang);
      setParagraphs(results);
      if (results.length > 0) {
        const links = await getDogmaticLinksForCatechism(results.slice(0, 5));
        setDogmaticLinks(links);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-48 page-enter">
      <header className="text-center space-y-6">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Codex Fidei</h2>
        <p className="text-stone-400 italic text-2xl font-serif">"Norma segura para o ensino da Fé." — João Paulo II</p>
        
        <div className="flex justify-center gap-4 mt-8">
           <button 
             onClick={() => setViewMode('browse')}
             className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'browse' ? 'bg-[#8b0000] text-white shadow-xl scale-105' : 'bg-stone-100 dark:bg-stone-900 text-stone-400'}`}
           >
             Navegar Navegando
           </button>
           <button 
             onClick={() => setViewMode('search')}
             className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'search' ? 'bg-[#8b0000] text-white shadow-xl scale-105' : 'bg-stone-100 dark:bg-stone-900 text-stone-400'}`}
           >
             Investigação Rápida
           </button>
        </div>
      </header>

      {viewMode === 'search' ? (
        <section className="bg-white dark:bg-stone-900 p-6 md:p-10 rounded-[3.5rem] shadow-3xl border border-stone-100 dark:border-stone-800">
          <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex gap-4">
             <div className="flex-1 relative">
                <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/30" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  placeholder="Qual verdade sua alma busca?" 
                  className="w-full pl-16 pr-6 py-6 bg-stone-50 dark:bg-stone-800 rounded-[2rem] outline-none font-serif italic text-2xl focus:border-gold transition-all"
                />
             </div>
             <button type="submit" disabled={loading} className="px-12 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl">
               {loading ? <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" /> : "Investigar"}
             </button>
          </form>
        </section>
      ) : (
        <nav className="space-y-6">
           {currentPath.length > 0 && (
             <button onClick={goBack} className="flex items-center gap-3 text-gold text-[10px] font-black uppercase tracking-widest hover:translate-x-[-5px] transition-transform">
               <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar ao Nível Anterior
             </button>
           )}
           
           <div className="flex flex-wrap gap-2 pb-6 border-b border-stone-100 dark:border-stone-800">
              <span className="text-[10px] font-black uppercase text-stone-300">Caminho:</span>
              <span className="text-[10px] font-black uppercase text-sacred">O Catecismo</span>
              {currentPath.map((item, i) => (
                <React.Fragment key={item.id}>
                  <span className="text-stone-300">/</span>
                  <span className="text-[10px] font-black uppercase text-sacred">{item.title}</span>
                </React.Fragment>
              ))}
           </div>

           {loading ? (
             <div className="grid md:grid-cols-2 gap-4">
               {[1, 2, 3, 4].map(n => <div key={n} className="h-24 bg-stone-50 dark:bg-stone-900 rounded-[2rem] animate-pulse" />)}
             </div>
           ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                {hierarchy.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleNavigate(item)}
                    className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 text-left hover:border-gold hover:shadow-xl transition-all group flex flex-col justify-between"
                  >
                     <div className="space-y-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gold/60">{item.level} {item.number}</span>
                        <h4 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight">{item.title}</h4>
                     </div>
                     <Icons.ArrowDown className="w-5 h-5 -rotate-90 mt-6 text-stone-200 group-hover:text-gold transition-colors" />
                  </button>
                ))}
             </div>
           )}
        </nav>
      )}

      {/* Exibição dos Parágrafos (Modo Codex) */}
      <div className="space-y-12">
        {paragraphs.map((p, i) => (
          <article key={i} className="bg-white dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] shadow-2xl border-l-[15px] border-sacred relative group animate-in slide-in-from-bottom-8">
             <header className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                   <span className="px-6 py-2 bg-stone-900 text-gold rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Parágrafo {p.number}</span>
                   {p.context && <p className="text-[9px] font-black uppercase text-stone-400 mt-2">{p.context}</p>}
                </div>
                <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC ${p.number}`} content={p.content} />
             </header>
             
             <p className="text-3xl md:text-5xl font-serif italic text-stone-800 dark:text-stone-100 leading-snug tracking-tight first-letter:text-8xl first-letter:font-bold first-letter:text-sacred first-letter:float-left first-letter:mr-4">
                {p.content}
             </p>

             {dogmaticLinks[p.number] && (
               <div className="mt-16 pt-12 border-t border-stone-100 dark:border-stone-800 space-y-8">
                  <h5 className="text-[11px] font-black uppercase tracking-[0.6em] text-gold flex items-center gap-4">
                    <div className="h-px w-8 bg-gold" /> Nexos Dogmáticos <div className="h-px w-8 bg-gold" />
                  </h5>
                  <div className="grid md:grid-cols-2 gap-6">
                     {dogmaticLinks[p.number].map((dogma, dIdx) => (
                       <button 
                        key={dIdx} 
                        onClick={() => onNavigateDogmas?.(dogma.title)}
                        className="p-8 bg-[#fcf8e8] dark:bg-stone-800/40 rounded-[2rem] border border-gold/20 text-left hover:scale-[1.02] transition-all group/dogma shadow-md"
                       >
                          <h6 className="text-xl font-serif font-bold text-sacred group-hover/dogma:text-gold">{dogma.title}</h6>
                          <p className="text-sm italic text-stone-500 mt-2 line-clamp-2">"{dogma.definition}"</p>
                       </button>
                     ))}
                  </div>
               </div>
             )}
          </article>
        ))}
        
        {loading && paragraphs.length === 0 && (
          <div className="py-32 text-center space-y-6">
             <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-2xl font-serif italic text-stone-400">Consultando o Compêndio da Fé...</p>
          </div>
        )}
      </div>

      <footer className="text-center pt-20 border-t border-gold/10">
         <Icons.Cross className="w-10 h-10 mx-auto text-stone-200" />
         <p className="text-[11px] font-black uppercase tracking-[1em] text-stone-300 mt-6">Custodire et Tradere</p>
      </footer>
    </div>
  );
};

export default Catechism;
