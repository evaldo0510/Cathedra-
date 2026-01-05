
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons, Logo } from '../constants';
import { getDailyBundle, generateSpeech, DEFAULT_BUNDLE } from '../services/gemini';
import { Saint, Gospel, AppRoute, User } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t } = useContext(LangContext);
  const [bundleData, setBundleData] = useState(() => {
    const cached = localStorage.getItem(`cathedra_daily_${lang}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.date === new Date().toLocaleDateString('pt-BR')) return parsed;
    }
    return { ...DEFAULT_BUNDLE, isPlaceholder: true };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBundle = useCallback(async () => {
    setIsSyncing(true);
    try {
      const bundle = await getDailyBundle(lang);
      if (bundle && bundle.gospel) {
        const newData = { date: new Date().toLocaleDateString('pt-BR'), ...bundle, isPlaceholder: false };
        setBundleData(newData);
        localStorage.setItem(`cathedra_daily_${lang}`, JSON.stringify(newData));
      }
    } catch (err) { console.error(err); }
    finally { setIsSyncing(false); }
  }, [lang]);

  useEffect(() => { fetchBundle(); }, [fetchBundle]);

  const { gospel, saint, quote, insight } = bundleData;

  return (
    <div className="space-y-8 md:space-y-12 pb-16 page-enter">
      {/* HEADER MOBILE INFO */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Status: Sincronizado</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.History className="w-3 h-3 text-gold" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gold">Renovação: {timeLeft}</span>
        </div>
      </div>

      {/* HERO SECTION MOBILE OPTIMIZED */}
      <section className="relative overflow-hidden rounded-[3rem] md:rounded-[5rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl min-h-[300px] md:min-h-[420px] flex items-center p-8 md:p-20">
        <div className="absolute inset-0 z-0">
           <SacredImage 
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80" 
            alt="Sacred" 
            className="w-full h-full opacity-[0.2] grayscale"
            priority={true}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-white/10 dark:from-stone-950 dark:via-stone-950/80" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full">
          <Logo className="w-24 h-24 md:w-48 md:h-48" />
          <div className="flex-1 text-center md:text-left space-y-2 md:space-y-4">
            <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-gold/80">{gospel?.calendar?.season || 'Liturgia'}</span>
            <h2 className="text-3xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
              {bundleData.isPlaceholder ? 'Buscando Luz...' : gospel?.calendar?.dayName}
            </h2>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start pt-4 gap-3">
               <button onClick={() => onNavigate(AppRoute.LECTIO_DIVINA)} className="px-6 py-3 bg-sacred text-white rounded-full font-black uppercase tracking-widest text-[9px] shadow-lg active:scale-95 transition-all">
                  Lectio Divina
               </button>
               <button onClick={fetchBundle} className="px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full font-black uppercase tracking-widest text-[9px] active:scale-95">
                  Atualizar
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT GRID */}
      <div className="grid lg:grid-cols-12 gap-6 md:gap-12">
        <main className="lg:col-span-8 space-y-6 md:space-y-12">
          {quote && (
            <article className="bg-[#1a1a1a] p-8 md:p-12 rounded-[2.5rem] md:rounded-[4.5rem] shadow-xl text-gold text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gold/60">{t('daily_quote')}</span>
                <p className="text-2xl md:text-5xl font-serif italic mt-4 text-white">"{quote.quote}"</p>
                <cite className="block text-lg md:text-2xl font-serif font-bold text-gold mt-4 not-italic">— {quote.author}</cite>
            </article>
          )}

          <article className="bg-white dark:bg-stone-900 p-8 md:p-16 rounded-[2.5rem] md:rounded-[5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-sacred/5 rounded-xl"><Icons.Book className="w-6 h-6 text-sacred" /></div>
                <h3 className="text-xl md:text-3xl font-serif font-bold">{gospel?.reference}</h3>
             </div>
             <p className="text-2xl md:text-5xl font-serif italic leading-snug tracking-tight text-stone-800 dark:text-stone-100">"{gospel?.text}"</p>
          </article>
        </main>

        <aside className="lg:col-span-4 space-y-6 md:space-y-12">
          {saint && (
            <section className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center flex flex-col items-center">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 md:border-[12px] border-white dark:border-stone-800 shadow-xl overflow-hidden mb-6 relative">
                   <SacredImage src={saint.image || ''} alt={saint.name} className="w-full h-full" priority={false} />
                </div>
                <h3 className="text-2xl md:text-5xl font-serif font-bold leading-tight">{saint.name}</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-sacred mt-2">{saint.patronage}</p>
                <p className="mt-6 text-sm md:text-xl font-serif italic text-stone-500 leading-relaxed">{saint.biography}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
