
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getDogmaticLinksForCatechism } from '../services/gemini';
import { CatechismParagraph, Dogma } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const PILLARS = [
  { id: 'pillar1', title: "A Profissão da Fé", range: "1 - 1065", icon: Icons.Cross },
  { id: 'pillar2', title: "A Celebração dos Mistérios", range: "1066 - 1690", icon: Icons.Book },
  { id: 'pillar3', title: "A Vida em Cristo", range: "1691 - 2557", icon: Icons.Feather },
  { id: 'pillar4', title: "A Oração Cristã", range: "2558 - 2865", icon: Icons.History }
];

const ITEMS_PER_PAGE = 10;

interface CatechismProps {
  onDeepDive?: (topic: string) => void;
  onNavigateDogmas?: (dogmaTitle: string) => void;
}

const Catechism: React.FC<CatechismProps> = ({ onDeepDive, onNavigateDogmas }) => {
  const { lang, t } = useContext(LangContext);
  const [query, setQuery] = useState('');
  const [jumpNumber, setJumpNumber] = useState('');
  const [allParagraphs, setAllParagraphs] = useState<CatechismParagraph[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dogmaticLinks, setDogmaticLinks] = useState<Record<number, Dogma[]>>({});
  const [activePillarId, setActivePillarId] = useState<string | null>(null);

  const renderSafeText = (text: any) => {
    if (typeof text === 'string') return text;
    if (text && typeof text === 'object') {
      return Object.values(text).find(v => typeof v === 'string') || JSON.stringify(text);
    }
    return '';
  };

  const visibleParagraphs = useMemo(() => {
    if (!Array.isArray(allParagraphs)) return [];
    return allParagraphs.slice(0, visibleCount);
  }, [allParagraphs, visibleCount]);

  const handleSearch = async (q?: string, pillarId?: string) => {
    const term = q || query;
    if (!term.trim() && !pillarId) return;
    
    setLoading(true);
    setAllParagraphs([]);
    setVisibleCount(ITEMS_PER_PAGE);
    setDogmaticLinks({});
    if (pillarId) setActivePillarId(pillarId);

    try {
      const data = await getCatechismSearch(term, {}, lang);
      const paragraphs = Array.isArray(data) ? data : [];
      setAllParagraphs(paragraphs);
      
      const firstBatch = paragraphs.slice(0, ITEMS_PER_PAGE);
      if (firstBatch.length > 0) {
        const links = await getDogmaticLinksForCatechism(firstBatch);
        setDogmaticLinks(links);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleJumpToNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumpNumber.trim()) return;
    setLoading(true);
    setAllParagraphs([]);
    try {
      const data = await getCatechismSearch(`parágrafo ${jumpNumber}`, {}, lang);
      const paragraphs = Array.isArray(data) ? data : [];
      setAllParagraphs(paragraphs);
      if (paragraphs.length > 0) {
        const links = await getDogmaticLinksForCatechism(paragraphs);
        setDogmaticLinks(links);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMore = async () => {
    if (!Array.isArray(allParagraphs)) return;
    const nextCount = visibleCount + ITEMS_PER_PAGE;
    setLoadingMore(true);
    try {
      const nextBatch = allParagraphs.slice(visibleCount, nextCount);
      if (nextBatch.length > 0) {
        const newLinks = await getDogmaticLinksForCatechism(nextBatch);
        setDogmaticLinks(prev => ({ ...prev, ...newLinks }));
      }
      setVisibleCount(nextCount);
    } catch (e) { console.error(e); } finally { setLoadingMore(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 page-enter">
      <header className="text-center space-y-6">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">{t('catechism')}</h2>
        <p className="text-stone-400 italic text-2xl">"Depositum Fidei — Custodire et Tradere"</p>
        <div className="flex justify-center pt-4">
          <form onSubmit={handleJumpToNumber} className="flex items-center gap-2 bg-[#fcf8e8] dark:bg-stone-900 px-6 py-3 rounded-2xl border border-gold/20 shadow-inner group transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold/60">№</span>
            <input type="number" placeholder="Ir p/ parágrafo..." value={jumpNumber} onChange={e => setJumpNumber(e.target.value)} className="bg-transparent outline-none font-serif italic text-lg w-32 dark:text-gold" />
            <button type="submit" className="text-gold"><Icons.ArrowDown className="w-4 h-4 -rotate-90" /></button>
          </form>
        </div>
      </header>

      <nav className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {PILLARS.map(p => (
          <button key={p.id} onClick={() => handleSearch(p.title, p.id)} className={`p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border transition-all text-left shadow-sm active:scale-95 ${activePillarId === p.id ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white scale-105' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}>
            <div className={`p-4 rounded-2xl mb-4 w-fit ${activePillarId === p.id ? 'bg-gold' : 'bg-stone-50 dark:bg-stone-800'}`}><p.icon className={`w-6 h-6 ${activePillarId === p.id ? 'text-stone-900' : 'text-gold'}`} /></div>
            <h4 className="text-lg font-serif font-bold leading-tight">{p.title}</h4>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1 block">{p.range}</span>
          </button>
        ))}
      </nav>

      <section className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
             <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/30" />
             <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('search_placeholder')} className="w-full pl-14 pr-6 py-5 bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 rounded-[2rem] outline-none font-serif italic text-xl focus:border-gold transition-all dark:text-white" />
          </div>
          <button type="submit" disabled={loading} className="px-10 py-5 bg-[#1a1a1a] dark:bg-gold text-gold dark:text-stone-900 font-black rounded-[2rem] uppercase tracking-widest text-[10px] disabled:opacity-50">
             {loading ? <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <span>{t('investigate')}</span>}
          </button>
        </form>
      </section>

      <div className="space-y-10">
        {loading ? (
          <div className="space-y-10 animate-pulse">
            {[1, 2].map(n => <div key={n} className="h-64 bg-stone-50 dark:bg-stone-900 rounded-[4rem]" />)}
          </div>
        ) : (
          <>
            {visibleParagraphs.map((p, i) => (
              <article key={i} className="p-10 md:p-16 rounded-[3.5rem] bg-white dark:bg-stone-900 border-l-[15px] md:border-l-[20px] border-[#8b0000] shadow-2xl transition-all animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-8">
                   <span className="px-6 py-2 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full text-[10px] font-black uppercase tracking-widest">CIC {p.number}</span>
                   <ActionButtons itemId={`cic_${p.number}`} textToCopy={`CIC ${p.number}: ${p.content}`} fullData={p} className="p-1 rounded-xl" />
                </div>
                <p className="text-2xl md:text-5xl font-serif italic leading-snug tracking-tight text-stone-800 dark:text-stone-100">"{renderSafeText(p.content)}"</p>
                {dogmaticLinks[p.number]?.length > 0 && (
                  <div className="mt-12 pt-10 border-t border-stone-100 dark:border-stone-800 space-y-6">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">{t('related_dogmas')}</h5>
                    <div className="flex flex-wrap gap-4">
                      {dogmaticLinks[p.number].map((dogma, dIdx) => (
                        <button key={dIdx} onClick={() => onNavigateDogmas?.(dogma.title)} className="flex items-center gap-4 px-6 py-3 bg-[#fcf8e8] dark:bg-stone-800 border border-gold/30 rounded-[1.5rem] hover:bg-gold hover:text-stone-900 transition-all shadow-md">
                           <Icons.Cross className="w-5 h-5 text-sacred" />
                           <span className="text-lg md:text-xl font-serif font-bold dark:text-gold">{renderSafeText(dogma.title)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}

            {Array.isArray(allParagraphs) && allParagraphs.length > visibleCount && (
              <div className="flex flex-col items-center pt-10">
                <button onClick={loadMore} disabled={loadingMore} className="px-16 py-6 bg-[#fcf8e8] dark:bg-stone-900 text-gold border-2 border-gold/30 rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-gold hover:text-stone-900 transition-all flex items-center gap-4 disabled:opacity-50">
                  {loadingMore ? <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <span>Prosseguir no Estudo</span>}
                </button>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-4">Visualizando {visibleCount} de {allParagraphs.length}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Catechism;
