
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getDogmaticLinksForCatechism } from '../services/gemini';
import { CatechismParagraph, Dogma, AppRoute } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const PILLARS = [
  { id: 'pillar1', title: "A Profissão da Fé", range: "1 - 1065", icon: Icons.Cross },
  { id: 'pillar2', title: "A Celebração dos Mistérios", range: "1066 - 1690", icon: Icons.Book },
  { id: 'pillar3', title: "A Vida em Cristo", range: "1691 - 2557", icon: Icons.Feather },
  { id: 'pillar4', title: "A Oração Cristã", range: "2558 - 2865", icon: Icons.History }
];

interface CatechismProps {
  onDeepDive?: (topic: string) => void;
  onNavigateDogmas?: (dogmaTitle: string) => void;
}

const Catechism: React.FC<CatechismProps> = ({ onDeepDive, onNavigateDogmas }) => {
  const { lang, t } = useContext(LangContext);
  const [query, setQuery] = useState('');
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [dogmaticLinks, setDogmaticLinks] = useState<Record<number, Dogma[]>>({});
  const [activePillarId, setActivePillarId] = useState<string | null>(null);

  const renderSafeText = (text: any) => {
    if (typeof text === 'string') return text;
    if (text && typeof text === 'object') {
      return Object.values(text).find(v => typeof v === 'string') || JSON.stringify(text);
    }
    return '';
  };

  const handleSearch = async (q?: string, pillarId?: string) => {
    const term = q || query;
    if (!term.trim() && !pillarId) return;
    
    setLoading(true);
    setParagraphs([]);
    setDogmaticLinks({});
    if (pillarId) setActivePillarId(pillarId);

    try {
      const data = await getCatechismSearch(term, {}, lang);
      setParagraphs(data);
      // Busca links dogmáticos em paralelo
      getDogmaticLinksForCatechism(data).then(links => setDogmaticLinks(links));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 page-enter">
      <header className="text-center space-y-4">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">{t('catechism')}</h2>
        <p className="text-stone-400 italic text-2xl">"Depositum Fidei — Custodire et Tradere"</p>
      </header>

      {/* Navegação por Pilares */}
      <nav className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {PILLARS.map(p => (
          <button 
            key={p.id}
            onClick={() => handleSearch(p.title, p.id)}
            className={`p-8 rounded-[3rem] border transition-all text-left group shadow-sm hover:shadow-xl ${activePillarId === p.id ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white scale-105 shadow-2xl' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
          >
            <div className={`p-4 rounded-2xl mb-4 w-fit ${activePillarId === p.id ? 'bg-gold' : 'bg-stone-50'}`}>
               <p.icon className={`w-6 h-6 ${activePillarId === p.id ? 'text-stone-900' : 'text-gold'}`} />
            </div>
            <h4 className="text-lg font-serif font-bold">{p.title}</h4>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{p.range}</span>
          </button>
        ))}
      </nav>

      {/* Busca */}
      <section className="bg-white dark:bg-stone-900 p-8 rounded-[4rem] shadow-xl border border-stone-100 dark:border-stone-800">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
             <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/50" />
             <input 
               type="text" 
               value={query}
               onChange={e => setQuery(e.target.value)}
               placeholder={t('search_placeholder')}
               className="w-full pl-16 pr-6 py-6 bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 rounded-[2.5rem] outline-none font-serif italic text-2xl shadow-inner dark:text-white"
             />
          </div>
          <button type="submit" className="px-12 py-6 bg-[#1a1a1a] dark:bg-gold text-gold dark:text-stone-900 font-black rounded-[2.5rem] uppercase tracking-widest text-xs shadow-xl active:scale-95 flex items-center justify-center gap-3">
             {loading ? <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <><Icons.Search className="w-5 h-5" /> <span>{t('investigate')}</span></>}
          </button>
        </form>
      </section>

      {/* Lista de Parágrafos */}
      <div className="space-y-10">
        {paragraphs.map((p, i) => {
          const pid = `cic_${p.number}`;
          const relatedDogmas = dogmaticLinks[p.number];
          
          return (
            <article key={i} className="p-12 md:p-16 rounded-[4.5rem] bg-white dark:bg-stone-900 border-l-[20px] border-[#8b0000] shadow-2xl relative group transition-all animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-start mb-8">
                 <div className="flex items-center gap-6">
                    <span className="px-8 py-2 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full text-[10px] font-black uppercase tracking-widest">CIC {p.number}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">{p.source}</span>
                 </div>
                 <ActionButtons itemId={pid} textToCopy={`CIC ${p.number}: ${p.content}`} fullData={p} />
              </div>

              <p className="text-3xl md:text-5xl font-serif italic leading-snug tracking-tight text-stone-800 dark:text-stone-100">
                "{renderSafeText(p.content)}"
              </p>

              {/* Links Dogmáticos Exclusivos */}
              {relatedDogmas && relatedDogmas.length > 0 && (
                <div className="mt-12 pt-10 border-t border-stone-100 dark:border-stone-800 space-y-6">
                  <h5 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">{t('related_dogmas')}</h5>
                  <div className="flex flex-wrap gap-4">
                    {relatedDogmas.map((dogma, dIdx) => (
                      <button 
                        key={dIdx}
                        onClick={() => onNavigateDogmas?.(dogma.title)}
                        className="flex items-center gap-4 px-8 py-4 bg-[#fcf8e8] dark:bg-stone-800 border border-gold/30 rounded-[1.5rem] hover:bg-gold hover:text-stone-900 transition-all shadow-md group/dogma active:scale-95"
                      >
                         <Icons.Cross className="w-5 h-5 text-sacred group-hover/dogma:text-stone-900 transition-colors" />
                         <span className="text-xl font-serif font-bold dark:text-gold group-hover/dogma:text-stone-900">{renderSafeText(dogma.title)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <footer className="mt-12 flex justify-end">
                <button 
                  onClick={() => onDeepDive?.(`Explicação teológica para CIC ${p.number}`)}
                  className="px-10 py-4 bg-stone-50 dark:bg-stone-800 text-stone-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:text-gold transition-colors"
                >
                  {t('see_more')} →
                </button>
              </footer>
            </article>
          );
        })}

        {paragraphs.length === 0 && !loading && (
          <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-white/30 rounded-[5rem] border-2 border-dashed border-stone-100">
             <Icons.Book className="w-24 h-24 text-stone-200 opacity-30 mb-8" />
             <p className="text-3xl font-serif italic text-stone-300">Inicie uma consulta para ver os ensinamentos da Igreja.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catechism;
