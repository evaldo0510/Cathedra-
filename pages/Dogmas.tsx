
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Icons } from '../constants';
import { getDogmas } from '../services/gemini';
import { Dogma } from '../types';

type ViewMode = 'list' | 'period' | 'council';
type FilterTag = 'all' | 'marian' | 'christological' | 'sacramental' | 'trinitarian';

interface DogmasProps {
  initialQuery?: string;
}

const Dogmas: React.FC<DogmasProps> = ({ initialQuery = '' }) => {
  const [dogmas, setDogmas] = useState<Dogma[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterTag, setFilterTag] = useState<FilterTag>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDogmas = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const data = await getDogmas(q);
      setDogmas(data);
      if (viewMode !== 'list') {
        const allKeys = new Set<string>(data.map(d => viewMode === 'period' ? (d.period || 'Geral') : (d.council || 'Geral')));
        setExpandedGroups(allKeys);
      }
    } catch (e) {
      console.error("Erro ao buscar dogmas:", e);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setQuery(searchInput);
      fetchDogmas(searchInput);
    }, 600);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput, fetchDogmas]);

  useEffect(() => {
    if (initialQuery) {
      setSearchInput(initialQuery);
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const filteredDogmas = useMemo(() => {
    return dogmas.filter(d => {
      if (!d.tags) return filterTag === 'all';
      const matchesFilter = filterTag === 'all' || 
        d.tags.some(t => {
          if (!t) return false;
          const lowerT = t.toLowerCase();
          if (filterTag === 'marian') return lowerT.includes('maria') || lowerT.includes('nossa senhora') || lowerT.includes('virgem');
          if (filterTag === 'christological') return lowerT.includes('cristo') || lowerT.includes('jesus') || lowerT.includes('encarnação');
          if (filterTag === 'sacramental') return lowerT.includes('sacramento') || lowerT.includes('eucaristia');
          if (filterTag === 'trinitarian') return lowerT.includes('trindade') || lowerT.includes('pai') || lowerT.includes('espírito');
          return false;
        });

      return matchesFilter;
    });
  }, [dogmas, filterTag]);

  const groupedDogmas = useMemo(() => {
    if (viewMode === 'list') return null;
    const groups: Record<string, Dogma[]> = {};
    filteredDogmas.forEach(d => {
      const key = viewMode === 'period' ? (d.period || 'Geral') : (d.council || 'Geral');
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return Object.entries(groups).sort((a, b) => {
      const yearA = parseInt(a[1][0]?.year) || 0;
      const yearB = parseInt(b[1][0]?.year) || 0;
      return yearA - yearB;
    });
  }, [filteredDogmas, viewMode]);

  const renderDogmaCard = (d: Dogma, idx: number) => (
    <article 
      key={`${d.title}-${idx}`} 
      className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm relative group hover:shadow-sacred/10 transition-all overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${(idx % 10) * 50}ms` }}
    >
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
         <Icons.Cross className="w-32 h-32" />
      </div>
      
      <div className="flex justify-between items-start mb-6">
         <div className="space-y-3 max-w-[85%]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-sacred text-gold px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                Fidei Dogma
              </span>
              <span className="text-stone-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-stone-50 dark:bg-stone-800/50 px-3 py-1 rounded-full">
                <Icons.History className="w-3 h-3" />
                {d.council || 'Magistério'} • {d.year || 'S/D'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
               <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tight">{d.title}</h3>
               {d.sourceUrl && (
                 <a 
                   href={d.sourceUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="p-2.5 bg-stone-50 dark:bg-stone-800 text-sacred dark:text-gold rounded-full hover:bg-sacred hover:text-white transition-all shadow-md active:scale-95 group/link"
                 >
                   <Icons.ExternalLink className="w-4 h-4" />
                 </a>
               )}
            </div>
         </div>
         <Icons.Feather className="w-8 h-8 text-gold/20 flex-shrink-0" />
      </div>
      
      <div className="space-y-4 relative z-10">
        <div className="bg-stone-50/30 dark:bg-stone-800/20 p-6 md:p-8 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-inner">
          <p className="text-stone-700 dark:text-stone-300 font-serif italic text-xl md:text-2xl leading-relaxed tracking-tight">
            "{d.definition}"
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-stone-50 dark:border-stone-800 mt-6">
        <div className="flex gap-1.5 flex-wrap">
           {d.tags?.map((tag, tIdx) => (
             <span key={tIdx} className="text-[8px] font-black uppercase tracking-tighter text-stone-400 bg-stone-50 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-100/50 dark:border-stone-700">
               #{tag}
             </span>
           ))}
        </div>
        {d.period && (
          <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em] px-4 py-1.5 bg-stone-900 dark:bg-stone-800 rounded-full shadow-lg">
            {d.period}
          </span>
        )}
      </div>
    </article>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="p-6 bg-[#fcf8e8] dark:bg-stone-900 rounded-full border border-gold/30 shadow-sacred relative group">
              <div className="absolute inset-0 bg-gold/10 blur-[30px] rounded-full animate-pulse" />
              <Icons.Cross className="w-14 h-14 text-sacred relative z-10 group-hover:rotate-180 transition-transform duration-1000" />
           </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Verdades de Fé</h2>
          <p className="text-stone-400 italic font-serif text-xl md:text-2xl max-w-2xl mx-auto">
            "A verdade não se impõe senão pela força da própria verdade."
          </p>
        </div>
      </header>

      <section className="bg-white dark:bg-stone-900 p-6 md:p-10 rounded-[3.5rem] shadow-3xl border border-stone-100 dark:border-stone-800 space-y-8 sticky top-4 z-[140] backdrop-blur-xl bg-white/90 dark:bg-stone-900/90">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
           <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'marian', label: 'Marianos' },
                { id: 'christological', label: 'Cristológicos' },
                { id: 'trinitarian', label: 'Trinitários' },
                { id: 'sacramental', label: 'Sacramentais' }
              ].map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setFilterTag(tag.id as FilterTag)}
                  className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${filterTag === tag.id ? 'bg-sacred text-white border-sacred shadow-sacred scale-105' : 'bg-white dark:bg-stone-800 text-stone-400 border-stone-100 dark:border-stone-700 hover:border-gold'}`}
                >
                  {tag.label}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-full border border-stone-100 dark:border-stone-700">
              {[
                { id: 'list', label: 'Lista', icon: Icons.Layout },
                { id: 'council', label: 'Concílio', icon: Icons.Users },
                { id: 'period', label: 'Período', icon: Icons.History }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode.id ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-md scale-105' : 'text-stone-300 hover:text-stone-500'}`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="relative group">
          <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/50 group-hover:scale-110 transition-transform" />
          <input 
            type="text" 
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Pesquisar dogmas (Ex: Imaculada, Trindade, Trento...)" 
            className="w-full pl-18 pr-12 py-6 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-[2.5rem] focus:ring-16 focus:ring-gold/5 outline-none text-xl md:text-2xl font-serif italic shadow-inner transition-all dark:text-white"
          />
          {loading && (
             <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <div className="w-6 h-6 border-4 border-gold border-t-transparent rounded-full animate-spin" />
             </div>
          )}
        </div>
      </section>

      <div className="pb-40 min-h-[40vh]">
        {loading && dogmas.length === 0 ? (
          <div className="grid gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-stone-900 rounded-[3rem] animate-pulse border border-stone-100 shadow-sm" />
            ))}
          </div>
        ) : filteredDogmas.length > 0 ? (
          viewMode === 'list' ? (
            <div className="grid gap-8">
              {filteredDogmas.map((d, i) => renderDogmaCard(d, i))}
            </div>
          ) : (
            <div className="space-y-12">
               {groupedDogmas?.map(([groupName, groupItems], gIdx) => {
                 const isExpanded = expandedGroups.has(groupName);
                 return (
                   <section key={`${groupName}-${gIdx}`} className="space-y-6 animate-in fade-in duration-700">
                      <button 
                        onClick={() => toggleGroup(groupName)}
                        className={`w-full flex items-center gap-6 group p-8 rounded-[3rem] transition-all border ${isExpanded ? 'bg-stone-50/50 dark:bg-stone-800/50 border-stone-200' : 'bg-white dark:bg-stone-900 border-stone-100 hover:border-gold/40 shadow-xl'}`}
                      >
                         <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                         <div className="flex flex-col items-center flex-shrink-0">
                            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-gold mb-2">{viewMode === 'council' ? 'Magistério' : 'Era'}</span>
                            <div className="flex items-center gap-4">
                               <h4 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">{groupName}</h4>
                               <div className={`p-2.5 bg-white dark:bg-stone-800 rounded-full border border-stone-100 shadow-sm transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                                  <Icons.ArrowDown className="w-4 h-4 text-sacred" />
                               </div>
                            </div>
                         </div>
                         <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/20 to-transparent" />
                      </button>
                      
                      {isExpanded && (
                        <div className="grid gap-8 pt-2 pl-0 md:pl-8 border-l-0 md:border-l-4 border-gold/10 animate-in slide-in-from-top-4 duration-500">
                           {groupItems.map((d, i) => renderDogmaCard(d, i))}
                        </div>
                      )}
                   </section>
                 );
               })}
            </div>
          )
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-white/40 dark:bg-stone-900/40 rounded-[4rem] border-2 border-dashed border-stone-100 shadow-inner">
             <div className="p-6 bg-white dark:bg-stone-900 rounded-full shadow-xl mb-8">
               <Icons.Cross className="w-16 h-16 text-stone-200 opacity-30" />
             </div>
             <h3 className="text-3xl font-serif italic text-stone-300 tracking-tighter">Nenhuma verdade identificada nesta busca.</h3>
             <p className="text-stone-300 font-serif mt-4 italic text-lg">Aprofunde sua meditação ou refine os filtros aplicados.</p>
          </div>
        )}
      </div>

      <footer className="text-center pt-16 border-t border-gold/10 pb-16">
         <p className="text-[10px] font-black uppercase tracking-[0.8em] text-stone-300 dark:text-stone-800 mb-4">Depositum Fidei</p>
         <p className="text-stone-400 font-serif italic text-xl">"O que a Igreja ensina, nós cremos."</p>
      </footer>
    </div>
  );
};

export default Dogmas;
