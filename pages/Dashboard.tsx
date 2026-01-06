
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Icons, Logo } from '../constants';
import { getDailyBundle, generateSpeech, DEFAULT_BUNDLE } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t } = useContext(LangContext);
  
  // Chave de data estável para cache (YYYY-MM-DD)
  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const [bundleData, setBundleData] = useState(() => {
    const today = getTodayKey();
    const cached = localStorage.getItem(`cathedra_daily_${lang}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.isoDate === today) return parsed;
    }
    return { ...DEFAULT_BUNDLE, isPlaceholder: true };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [activeReading, setActiveReading] = useState<'first' | 'psalm' | 'second' | 'gospel'>('gospel');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor(diff / 1000) % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBundle = useCallback(async (forced = false) => {
    const today = getTodayKey();
    if (!forced && bundleData.isoDate === today && !bundleData.isPlaceholder) return;

    setIsSyncing(true);
    try {
      const bundle = await getDailyBundle(lang);
      if (bundle && bundle.gospel) {
        const newData = { isoDate: today, ...bundle, isPlaceholder: false };
        setBundleData(newData);
        localStorage.setItem(`cathedra_daily_${lang}`, JSON.stringify(newData));
      }
    } catch (err) { console.error(err); }
    finally { setIsSyncing(false); }
  }, [lang, bundleData.isoDate, bundleData.isPlaceholder]);

  useEffect(() => { fetchBundle(); }, [fetchBundle]);

  const { gospel, saint, quote, insight } = bundleData;

  const readings = useMemo(() => {
    const list: { id: 'first' | 'psalm' | 'second' | 'gospel', data: LiturgyReading | null, label: string }[] = [
      { id: 'first', data: gospel?.firstReading || null, label: 'I Leitura' },
      { id: 'psalm', data: gospel?.psalm || null, label: 'Salmo' },
      { id: 'second', data: gospel?.secondReading || null, label: 'II Leitura' },
      { id: 'gospel', data: { title: 'Evangelho', reference: gospel?.reference || '', text: gospel?.text || '' }, label: 'Evangelho' }
    ];
    return list.filter(r => r.data !== null);
  }, [gospel]);

  const currentReading = useMemo(() => {
    const r = readings.find(r => r.id === activeReading) || readings[readings.length - 1];
    return r?.data;
  }, [readings, activeReading]);

  return (
    <div className="space-y-8 md:space-y-12 pb-16 page-enter">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Status: {isSyncing ? 'Sincronizando' : 'Sincronizado'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.History className="w-3 h-3 text-gold" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gold">Renovação: {timeLeft}</span>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[3rem] md:rounded-[5rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl min-h-[300px] md:min-h-[420px] flex items-center p-8 md:p-20">
        <div className="absolute inset-0 z-0">
           <SacredImage 
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80" 
            alt="Sacred Background" 
            className="w-full h-full opacity-[0.25] grayscale-[0.3]"
            priority={true}
            liturgicalColor={gospel?.calendar?.color}
            dominantColor="#8b0000"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-stone-950 dark:via-stone-950/80" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full">
          <Logo className="w-24 h-24 md:w-48 md:h-48" />
          <div className="flex-1 text-center md:text-left space-y-2 md:space-y-4">
            <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-gold/80">{gospel?.calendar?.season || 'Liturgia'}</span>
            <h2 className="text-3xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
              {bundleData.isPlaceholder ? 'Buscando Luz...' : (gospel?.calendar?.dayName || 'Liturgia do Dia')}
            </h2>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start pt-4 gap-3">
               <button onClick={() => onNavigate(AppRoute.LECTIO_DIVINA)} className="px-6 py-3 bg-sacred text-white rounded-full font-black uppercase tracking-widest text-[9px] shadow-lg active:scale-95 transition-all">
                  Lectio Divina
               </button>
               <button onClick={() => fetchBundle(true)} className="px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full font-black uppercase tracking-widest text-[9px] active:scale-95">
                  Forçar Sincronia
               </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-stone-900 rounded-[3rem] md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
         <header className="bg-stone-50 dark:bg-stone-800/50 p-6 md:p-10 border-b border-stone-100 dark:border-stone-700">
            <div className="flex items-center justify-between gap-4 flex-wrap">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-gold/10 rounded-2xl text-gold"><Icons.Book className="w-6 h-6" /></div>
                  <h3 className="text-2xl md:text-4xl font-serif font-bold tracking-tight">Liturgia da Palavra</h3>
               </div>
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
            </div>
         </header>

         <div className="p-8 md:p-16 space-y-8">
            {currentReading ? (
              <div className="animate-in fade-in duration-500">
                 <div className="flex items-center gap-4 mb-6">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-gold">{currentReading.reference}</span>
                    <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                 </div>
                 <h4 className="text-2xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-8">{currentReading.title || 'Palavra do Senhor'}</h4>
                 <div className="prose dark:prose-invert max-w-none">
                    <p className="text-xl md:text-4xl font-serif italic leading-relaxed text-stone-800 dark:text-stone-200">
                       "{currentReading.text}"
                    </p>
                 </div>
                 <footer className="mt-12 flex items-center justify-between border-t border-stone-50 dark:border-stone-800 pt-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Palavra do Senhor. R: Graças a Deus.</p>
                    <button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-[9px] font-black uppercase tracking-widest text-gold hover:text-sacred transition-colors">Ver no Cânon →</button>
                 </footer>
              </div>
            ) : (
              <div className="py-20 text-center animate-pulse">
                 <Icons.Book className="w-12 h-12 text-stone-100 mx-auto mb-4" />
                 <p className="text-stone-300 font-serif italic text-xl">Preparando as Escrituras...</p>
              </div>
            )}
         </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6 md:gap-12">
        <main className="lg:col-span-8 space-y-6 md:space-y-12">
          {quote && (
            <article className="bg-[#1a1a1a] p-8 md:p-12 rounded-[2.5rem] md:rounded-[4.5rem] shadow-xl text-gold text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gold/60">{t('daily_quote')}</span>
                <p className="text-2xl md:text-5xl font-serif italic mt-4 text-white">"{quote.quote}"</p>
                <cite className="block text-lg md:text-2xl font-serif font-bold text-gold mt-4 not-italic">— {quote.author}</cite>
            </article>
          )}

          {gospel?.reflection && (
             <article className="bg-[#fdfcf8] dark:bg-stone-900/50 p-8 md:p-16 rounded-[2.5rem] md:rounded-[5rem] border border-gold/10 shadow-lg space-y-6">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-gold/5 rounded-xl text-gold"><Icons.Feather className="w-6 h-6" /></div>
                   <h3 className="text-xl md:text-3xl font-serif font-bold">Meditatio Diária</h3>
                </div>
                <p className="text-xl md:text-3xl font-serif italic leading-relaxed text-stone-700 dark:text-stone-300">
                   {gospel.reflection}
                </p>
             </article>
          )}
        </main>

        <aside className="lg:col-span-4 space-y-6 md:space-y-12">
          {saint && (
            <section className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center flex flex-col items-center">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 md:border-[12px] border-white dark:border-stone-800 shadow-xl overflow-hidden mb-6 relative">
                   <SacredImage 
                    src={saint.image || ''} 
                    alt={saint.name} 
                    className="w-full h-full" 
                    priority={false} 
                    dominantColor="#d4af37"
                   />
                </div>
                <h3 className="text-2xl md:text-5xl font-serif font-bold leading-tight">{saint.name}</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-sacred mt-2">{saint.patronage}</p>
                <p className="mt-6 text-sm md:text-xl font-serif italic text-stone-500 leading-relaxed">{saint.biography}</p>
            </section>
          )}

          {insight && (
             <div className="bg-[#1a1a1a] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-gold shadow-2xl border border-gold/10">
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gold/40 mb-4 block">Lumen Diei</span>
                <p className="text-xl md:text-2xl font-serif italic leading-snug">
                   "{insight}"
                </p>
             </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
