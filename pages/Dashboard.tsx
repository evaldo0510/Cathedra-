
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Icons, Logo } from '../constants';
import { getDailyBundle, DEFAULT_BUNDLE } from '../services/gemini';
import { AppRoute, User, LiturgyReading } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t } = useContext(LangContext);
  
  const [bundleData, setBundleData] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem(`cathedra_daily_${lang}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Só retorna do cache se for do dia de hoje
      if (parsed.isoDate === today) return parsed;
    }
    return { ...DEFAULT_BUNDLE, isPlaceholder: true, isoDate: today };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [activeReading, setActiveReading] = useState<'first' | 'psalm' | 'second' | 'gospel'>('gospel');

  const fetchBundle = useCallback(async (forced = false) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Evita refetch se já temos dados de hoje e não foi forçado
    if (!forced && bundleData.isoDate === today && !bundleData.isPlaceholder) return;

    setIsSyncing(true);
    try {
      const bundle = await getDailyBundle(lang);
      if (bundle && bundle.gospel && bundle.gospel.reference) {
        const newData = { ...bundle, isPlaceholder: false, isoDate: today };
        setBundleData(newData);
        localStorage.setItem(`cathedra_daily_${lang}`, JSON.stringify(newData));
      }
    } catch (err) { 
      console.error("Erro na sincronização diária:", err); 
    } finally { 
      setIsSyncing(false); 
    }
  }, [lang, bundleData.isoDate, bundleData.isPlaceholder]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  const { gospel, saint, quote, isPlaceholder } = bundleData;

  const readings = useMemo(() => {
    if (isPlaceholder) return [];
    const list: { id: 'first' | 'psalm' | 'second' | 'gospel', data: LiturgyReading | null, label: string }[] = [
      { id: 'first', data: gospel?.firstReading || null, label: 'I Leitura' },
      { id: 'psalm', data: gospel?.psalm || null, label: 'Salmo' },
      { id: 'second', data: gospel?.secondReading || null, label: 'II Leitura' },
      { id: 'gospel', data: { title: 'Evangelho', reference: gospel?.reference || '', text: gospel?.text || '' }, label: 'Evangelho' }
    ];
    return list.filter(r => r.data !== null && r.data.text);
  }, [gospel, isPlaceholder]);

  const currentReading = useMemo(() => {
    if (isPlaceholder || readings.length === 0) return null;
    const r = readings.find(r => r.id === activeReading) || readings[readings.length - 1];
    return r?.data;
  }, [readings, activeReading, isPlaceholder]);

  return (
    <div className="space-y-8 md:space-y-12 pb-16 page-enter">
      {/* STATUS BAR */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
            {isSyncing ? 'Buscando Liturgia Real...' : 'Liturgia Sincronizada'}
          </span>
        </div>
        {!isPlaceholder && (
          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
            {new Date().toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* HERO / LITURGY HEADER */}
      <section className="relative overflow-hidden rounded-[3rem] md:rounded-[5rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl min-h-[350px] md:min-h-[450px] flex items-center p-8 md:p-20 transition-all duration-700">
        <div className="absolute inset-0 z-0">
           <SacredImage 
            src={isPlaceholder ? "" : (saint?.image || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80")} 
            alt="Sacred Background" 
            className="w-full h-full opacity-[0.2] grayscale-[0.2]"
            priority={true}
            liturgicalColor={gospel?.calendar?.color}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-stone-950 dark:via-stone-950/70" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full">
          {isPlaceholder ? (
            <div className="w-24 h-24 md:w-48 md:h-48 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
          ) : (
            <Logo className="w-24 h-24 md:w-48 md:h-48" />
          )}
          
          <div className="flex-1 text-center md:text-left space-y-2 md:space-y-4">
            {isPlaceholder ? (
              <div className="space-y-4">
                <div className="h-4 w-32 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse mx-auto md:mx-0" />
                <div className="h-14 md:h-20 w-3/4 bg-stone-100 dark:bg-stone-800 rounded-3xl animate-pulse mx-auto md:mx-0" />
              </div>
            ) : (
              <>
                <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-gold/80">
                  {gospel?.calendar?.season || 'Proprium de Tempore'} • {gospel?.calendar?.rank || 'Feria'}
                </span>
                <h2 className="text-3xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {gospel?.calendar?.dayName || 'Sincronizando Liturgia...'}
                </h2>
              </>
            )}
            <div className="flex flex-col sm:flex-row justify-center md:justify-start pt-6 gap-4">
               <button onClick={() => onNavigate(AppRoute.LECTIO_DIVINA)} className="px-8 py-4 bg-sacred text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">
                  Iniciar Lectio Divina
               </button>
               <button onClick={() => fetchBundle(true)} className="px-8 py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full font-black uppercase tracking-widest text-[10px] active:scale-95">
                  Atualizar Dados
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* READINGS SECTION */}
      <section className="bg-white dark:bg-stone-900 rounded-[3rem] md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl overflow-hidden min-h-[500px] transition-all duration-1000">
         <header className="bg-stone-50 dark:bg-stone-800/30 p-6 md:p-10 border-b border-stone-100 dark:border-stone-700">
            <div className="flex items-center justify-between gap-4 flex-wrap">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-gold/10 rounded-2xl text-gold"><Icons.Book className="w-6 h-6" /></div>
                  <h3 className="text-2xl md:text-4xl font-serif font-bold tracking-tight">Escrituras do Dia</h3>
               </div>
               {!isPlaceholder && readings.length > 0 && (
                 <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {readings.map(r => (
                      <button 
                        key={r.id}
                        onClick={() => setActiveReading(r.id)}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeReading === r.id ? 'bg-gold text-stone-900 shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border border-stone-100 dark:border-stone-700 hover:border-gold'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                 </nav>
               )}
            </div>
         </header>

         <div className="p-8 md:p-20 space-y-8">
            {isPlaceholder ? (
               <div className="space-y-8 animate-pulse">
                  <div className="h-4 w-24 bg-stone-100 dark:bg-stone-800 rounded-full" />
                  <div className="h-10 w-64 bg-stone-100 dark:bg-stone-800 rounded-xl" />
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-stone-100 dark:bg-stone-800 rounded-full" />
                    <div className="h-4 w-full bg-stone-100 dark:bg-stone-800 rounded-full" />
                    <div className="h-4 w-full bg-stone-100 dark:bg-stone-800 rounded-full" />
                    <div className="h-4 w-2/3 bg-stone-100 dark:bg-stone-800 rounded-full" />
                  </div>
               </div>
            ) : currentReading ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex items-center gap-4 mb-8">
                    <span className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-gold">{currentReading.reference}</span>
                    <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                 </div>
                 <h4 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-10 leading-tight">{currentReading.title || 'Palavra do Senhor'}</h4>
                 <div className="prose dark:prose-invert max-w-none">
                    <p className="text-2xl md:text-5xl font-serif italic leading-relaxed text-stone-800 dark:text-stone-200 tracking-tight">
                       "{currentReading.text}"
                    </p>
                 </div>
                 <footer className="mt-16 flex items-center justify-between border-t border-stone-50 dark:border-stone-800 pt-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Palavra do Senhor. R: Graças a Deus.</p>
                 </footer>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-stone-400 font-serif italic text-xl">Nenhuma leitura carregada. Tente sincronizar novamente.</p>
              </div>
            )}
         </div>
      </section>

      {/* SAINT & QUOTE CARDS */}
      {!isPlaceholder && (
        <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
          <main className="lg:col-span-8 space-y-8 md:space-y-12">
            {quote && quote.quote && (
              <article className="bg-[#1a1a1a] p-10 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl text-gold text-center md:text-left relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                    <Icons.Feather className="w-48 h-48" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gold/50">Sententia Sanctorum</span>
                  <p className="text-2xl md:text-6xl font-serif italic mt-6 text-white leading-tight tracking-tighter">"{quote.quote}"</p>
                  <cite className="block text-xl md:text-3xl font-serif font-bold text-gold mt-6 not-italic tracking-tight">— {quote.author}</cite>
              </article>
            )}

            {gospel?.reflection && (
               <article className="bg-[#fdfcf8] dark:bg-stone-900/50 p-10 md:p-20 rounded-[3rem] md:rounded-[5rem] border border-gold/10 shadow-xl space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-gold/5 rounded-xl text-gold"><Icons.Feather className="w-6 h-6" /></div>
                     <h3 className="text-xl md:text-4xl font-serif font-bold">Meditatio Diária</h3>
                  </div>
                  <p className="text-2xl md:text-4xl font-serif italic leading-relaxed text-stone-700 dark:text-stone-300 tracking-tight">
                     {gospel.reflection}
                  </p>
               </article>
            )}
          </main>

          <aside className="lg:col-span-4 space-y-8 md:space-y-12">
            {saint && saint.name && (
              <section className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center flex flex-col items-center group transition-all duration-500 hover:shadow-2xl">
                  <div className="w-32 h-32 md:w-56 md:h-56 rounded-full border-8 md:border-[16px] border-white dark:border-stone-800 shadow-2xl overflow-hidden mb-8 relative transition-transform duration-700 group-hover:scale-105">
                     <SacredImage src={saint.image || ""} alt={saint.name} className="w-full h-full" priority={false} />
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred/70">{saint.feastDay || 'Hodie'}</span>
                    <h3 className="text-3xl md:text-6xl font-serif font-bold leading-none tracking-tighter">{saint.name}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mt-2">{saint.patronage}</p>
                  </div>
                  <div className="h-px w-12 bg-stone-100 my-6" />
                  <p className="text-lg md:text-2xl font-serif italic text-stone-500 leading-relaxed tracking-tight">{saint.biography}</p>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
