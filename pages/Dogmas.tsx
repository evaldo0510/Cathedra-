
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icons } from '../constants';
import { getDogmas } from '../services/gemini';
import { Dogma } from '../types';

type ViewMode = 'list' | 'period' | 'council';
type FilterTag = 'all' | 'marian' | 'christological' | 'sacramental';

interface DogmasProps {
  initialQuery?: string;
}

const Dogmas: React.FC<DogmasProps> = ({ initialQuery = '' }) => {
  const [dogmas, setDogmas] = useState<Dogma[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterTag, setFilterTag] = useState<FilterTag>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchDogmas = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await getDogmas(q || query);
      setDogmas(data);
      if (viewMode !== 'list') {
        const allKeys = new Set<string>(data.map(d => viewMode === 'period' ? (d.period || 'Geral') : (d.council || 'Geral')));
        setExpandedGroups(allKeys);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, viewMode]);

  useEffect(() => { 
    fetchDogmas(initialQuery); 
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery, fetchDogmas]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredDogmas = useMemo(() => {
    return dogmas.filter(d => {
      const matchesQuery = query.trim() === '' || 
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.definition.toLowerCase().includes(query.toLowerCase()) ||
        d.council.toLowerCase().includes(query.toLowerCase());
      
      const matchesFilter = filterTag === 'all' || 
        d.tags.some(t => {
          const lowerT = t.toLowerCase();
          if (filterTag === 'marian') return lowerT.includes('maria') || lowerT.includes('nossa senhora') || lowerT.includes('virgem');
          if (filterTag === 'christological') return lowerT.includes('cristo') || lowerT.includes('jesus') || lowerT.includes('encarnação');
          if (filterTag === 'sacramental') return lowerT.includes('sacramento') || lowerT.includes('eucaristia');
          return false;
        });

      return matchesQuery && matchesFilter;
    });
  }, [dogmas, query, filterTag]);

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
    <article key={idx} className="bg-white dark:bg-stone-900 p-10 md:p-12 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-sm relative group hover:shadow-sacred/10 transition-all overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
         <Icons.Cross className="w-32 h-32" />
      </div>
      
      <div className="flex justify-between items-start mb-8">
         <div className="space-y-4 max-w-[85%]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-[#8b0000] text-[#d4af37] px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                Fidei Dogma
              </span>
              <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Icons.History className="w-3 h-3" />
                {d.council} • {d.year}
              </span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
               <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tight">{d.title}</h3>
               {d.sourceUrl && (
                 <a 
                   href={d.sourceUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="p-3 bg-[#fcf8e8] dark:bg-stone-800 text-[#8b0000] dark:text-[#d4af37] rounded-full hover:bg-[#8b0000] hover:text-white transition-all shadow-md active:scale-95 group/link"
                   title="Acessar Fonte Primária (Vatican.va)"
                 >
                   <Icons.ExternalLink className="w-5 h-5 group-hover/link:scale-110 transition-transform" />
                 </a>
               )}
            </div>
         </div>
         <Icons.Feather className="w-10 h-10 text-[#d4af37]/20 flex-shrink-0" />
      </div>
      
      <div className="space-y-6 relative z-10">
        <div className="bg-stone-50/50 dark:bg-stone-800/40 p-8 rounded-[2rem] border border-stone-100/50 dark:border-stone-700">
          <p className="text-stone-700 dark:text-stone-300 font-serif italic text-2xl leading-relaxed tracking-tight">
            "{d.definition}"
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-stone-50 dark:border-stone-800 mt-8">
        <div className="flex gap-2 flex-wrap">
           {d.tags.map((tag, tIdx) => (
             <span key={tIdx} className="text-[9px] font-black uppercase tracking-tighter text-stone-400 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-100/50 dark:border-stone-700">
               #{tag}
             </span>
           ))}
        </div>
        {d.period && (
          <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em] px-5 py-2 bg-[#1a1a1a] dark:bg-stone-800 rounded-full shadow-lg">
            {d.period}
          </span>
        )}
      </div>
    </article>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-8">
        <div className="flex justify-center">
           <div className="p-8 bg-[#fcf8e8] dark:bg-stone-900 rounded-full border border-[#d4af37]/30 shadow-sacred relative">
              <div className="absolute inset-0 bg-[#d4af37]/20 blur-[30px] rounded-full animate-pulse" />
              <Icons.Cross className="w-16 h-16 text-[#8b0000] relative z-10" />
           </div>
        </div>
        <h2 className="text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight text-shadow-sacred">Verdades de Fé</h2>
        <p className="text-stone-400 italic font-serif text-2xl max-w-2xl mx-auto">
          "O dogma não é um obstáculo, mas uma janela aberta para o infinito."
        </p>
      </header>

      <section className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[4.5rem] shadow-3xl border border-stone-100 dark:border-stone-800 space-y-12">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
           <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'marian', label: 'Marianos' },
                { id: 'christological', label: 'Cristológicos' },
                { id: 'sacramental', label: 'Sacramentais' }
              ].map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setFilterTag(tag.id as FilterTag)}
                  className={`px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${filterTag === tag.id ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-sacred scale-105' : 'bg-white dark:bg-stone-800 text-stone-400 border-stone-100 dark:border-stone-700 hover:border-[#d4af37]'}`}
                >
                  {tag.label}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 p-2 rounded-full border border-stone-100 dark:border-stone-700">
              {[
                { id: 'list', label: 'Lista', icon: Icons.Layout },
                { id: 'council', label: 'Concílio', icon: Icons.Users },
                { id: 'period', label: 'Período', icon: Icons.History }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode.id ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-md scale-105' : 'text-stone-300 hover:text-stone-500'}`}
                >
                  <mode.icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              ))}
           </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); fetchDogmas(query); }} className="relative group">
          <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-8 h-8 text-[#d4af37]/50 group-hover:scale-110 transition-transform" />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar dogmas por título, definição ou concílio..." 
            className="w-full pl-24 pr-12 py-9 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-[3rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none text-2xl md:text-3xl font-serif italic shadow-inner transition-all placeholder:text-stone-200"
          />
          <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-[#d4af37] p-6 rounded-full hover:bg-[#8b0000] hover:text-white transition-all shadow-2xl active:scale-90">
             {loading ? <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Search className="w-8 h-8" />}
          </button>
        </form>
      </section>

      <div className="pb-40">
        {loading ? (
          <div className="grid gap-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-stone-900 rounded-[4rem] animate-pulse border border-stone-100 shadow-sm" />
            ))}
          </div>
        ) : filteredDogmas.length > 0 ? (
          viewMode === 'list' ? (
            <div className="grid gap-12">
              {filteredDogmas.map((d, i) => renderDogmaCard(d, i))}
            </div>
          ) : (
            <div className="space-y-16">
               {groupedDogmas?.map(([groupName, groupItems], gIdx) => {
                 const isExpanded = expandedGroups.has(groupName);
                 return (
                   <section key={gIdx} className="space-y-10 animate-in fade-in duration-700">
                      <button 
                        onClick={() => toggleGroup(groupName)}
                        className={`w-full flex items-center gap-12 group p-10 rounded-[4rem] transition-all border ${isExpanded ? 'bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 shadow-inner' : 'bg-white dark:bg-stone-900 border-stone-100 hover:border-[#d4af37]/40 shadow-xl'}`}
                      >
                         <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
                         <div className="flex flex-col items-center flex-shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#d4af37] mb-3">{viewMode === 'council' ? 'Concílio / Magistério' : 'Período Histórico'}</span>
                            <div className="flex items-center gap-6">
                               <h4 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">{groupName}</h4>
                               <div className={`p-4 bg-white dark:bg-stone-800 rounded-full border border-stone-100 shadow-sm transition-transform duration-700 ${isExpanded ? 'rotate-180' : ''}`}>
                                  <svg className="w-5 h-5 text-[#8b0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                  </svg>
                               </div>
                            </div>
                         </div>
                         <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d4af37]/20 to-transparent" />
                      </button>
                      
                      {isExpanded && (
                        <div className="grid gap-12 pt-4 pl-0 md:pl-16 border-l-0 md:border-l-[10px] border-[#d4af37]/10 animate-in slide-in-from-top-4 duration-700">
                           {groupItems.map((d, i) => renderDogmaCard(d, i))}
                        </div>
                      )}
                   </section>
                 );
               })}
            </div>
          )
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-white/40 dark:bg-stone-900/40 rounded-[5rem] border-2 border-dashed border-stone-100 shadow-inner">
             <div className="p-8 bg-white dark:bg-stone-900 rounded-full shadow-2xl mb-10 rotate-12">
               <Icons.Cross className="w-24 h-24 text-stone-200 opacity-30" />
             </div>
             <h3 className="text-4xl font-serif italic text-stone-300 tracking-tighter">Nenhuma verdade de fé identificada nesta categoria.</h3>
             <p className="text-stone-300 font-serif mt-6 italic text-xl">Aprofunde sua busca ou mude os filtros aplicados.</p>
          </div>
        )}
      </div>

      <footer className="text-center pt-24 border-t border-[#d4af37]/10 pb-16">
         <div className="flex items-center justify-center gap-8 mb-8">
            <div className="h-px w-20 bg-stone-100 dark:bg-stone-800" />
            <p className="text-[12px] font-black uppercase tracking-[1em] text-stone-300">Depositum Fidei</p>
            <div className="h-px w-20 bg-stone-100 dark:bg-stone-800" />
         </div>
         <p className="text-stone-400 font-serif italic text-2xl">"O que a Igreja ensina, nós cremos."</p>
      </footer>
    </div>
  );
};

export default Dogmas;
