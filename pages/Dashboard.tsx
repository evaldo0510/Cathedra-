
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons, Logo } from '../constants';
import { getDailyBundle, generateSpeech, DEFAULT_BUNDLE } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Lógica do Temporizador de Contagem Regressiva para Meia-noite
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchBundle = useCallback(async () => {
    setIsSyncing(true);
    try {
      const bundle = await getDailyBundle(lang);
      if (bundle && bundle.gospel) {
        const newData = { date: new Date().toLocaleDateString('pt-BR'), ...bundle, isPlaceholder: false };
        setBundleData(newData);
        setLastUpdated(new Date().toLocaleTimeString());
        localStorage.setItem(`cathedra_daily_${lang}`, JSON.stringify(newData));
      }
    } catch (err) { console.error(err); }
    finally { setIsSyncing(false); }
  }, [lang]);

  useEffect(() => { 
    fetchBundle();
  }, [fetchBundle]);

  const renderSafeText = (text: any) => {
    if (typeof text === 'string') return text;
    if (text && typeof text === 'object') {
      return Object.values(text).find(v => typeof v === 'string') || "";
    }
    return '';
  };

  const { gospel, saint, quote, insight } = bundleData;

  return (
    <div className="space-y-12 pb-32 page-enter">
      {/* HEADER DE STATUS E LOGO */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
            {isSyncing ? 'Sincronizando...' : 'Status: 100% Atualizado'}
            {lastUpdated && <span className="ml-2 opacity-50">({lastUpdated})</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.History className="w-3 h-3 text-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gold">Renovação em: {timeLeft}</span>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[5rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl min-h-[420px] flex items-center p-12 md:p-20 transition-all duration-700">
        <div className="absolute inset-0 z-0">
           <SacredImage 
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80" 
            alt="Sacred" 
            className="w-full h-full opacity-[0.2] grayscale mix-blend-multiply"
            priority={true}
            liturgicalColor={gospel?.calendar?.color}
           />
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-stone-950 dark:via-stone-950/90" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 w-full">
          <div className="flex flex-col items-center">
            <Logo className="w-48 h-48 md:w-64 md:h-64" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <span className="text-[12px] font-black uppercase tracking-[0.6em] text-gold/80">{renderSafeText(gospel?.calendar?.season || t('liturgy'))}</span>
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tighter">
              {bundleData.isPlaceholder ? t('wait') : renderSafeText(gospel?.calendar?.dayName)}
            </h2>
            <div className="flex justify-center md:justify-start pt-4 gap-4">
               <button onClick={() => onNavigate(AppRoute.LECTIO_DIVINA)} className="px-8 py-3 bg-sacred text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
                  Iniciar Lectio Divina
               </button>
               <button onClick={fetchBundle} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-400 hover:text-gold transition-all">
                  <Icons.History className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
               </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-12">
        <main className="lg:col-span-8 space-y-12">
          {quote && (
            <article className="bg-[#1a1a1a] p-12 rounded-[4.5rem] shadow-3xl text-gold relative overflow-hidden group">
              <div className="relative z-10 space-y-8">
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gold/60">{t('daily_quote')}</span>
                <p className="text-4xl md:text-6xl font-serif italic leading-tight tracking-tight text-white relative z-10">"{renderSafeText(quote.quote)}"</p>
                <cite className="block text-2xl font-serif font-bold text-gold not-italic">— {renderSafeText(quote.author)}</cite>
              </div>
            </article>
          )}

          <article className="bg-white dark:bg-stone-900 p-16 rounded-[5rem] shadow-2xl border border-stone-100 dark:border-stone-800 space-y-10">
             <div className="flex items-center gap-6">
                <div className="p-5 bg-sacred/5 rounded-[2rem]"><Icons.Book className="w-8 h-8 text-sacred" /></div>
                <h3 className="text-3xl font-serif font-bold">{renderSafeText(gospel?.reference)}</h3>
             </div>
             <p className="text-4xl md:text-6xl font-serif italic leading-snug tracking-tight text-stone-800 dark:text-stone-100">"{renderSafeText(gospel?.text)}"</p>
             <div className="p-12 bg-stone-50 dark:bg-stone-800/40 rounded-[4rem] border-l-[20px] border-gold">
                <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold mb-6">Meditatio</h4>
                <p className="text-2xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">{renderSafeText(gospel?.reflection)}</p>
             </div>
          </article>
        </main>

        <aside className="lg:col-span-4 space-y-12">
          {saint && (
            <section className="bg-white dark:bg-stone-900 p-12 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-3xl text-center flex flex-col items-center">
                <div className="w-48 h-48 md:w-60 md:h-60 rounded-full border-[12px] border-white dark:border-stone-800 shadow-2xl overflow-hidden mb-10 relative ring-[15px] ring-gold/5">
                   <SacredImage src={saint.image || ''} alt={saint.name} className="w-full h-full" priority={true} />
                </div>
                <h3 className="text-4xl md:text-6xl font-serif font-bold leading-tight">{renderSafeText(saint.name)}</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred mt-2">{renderSafeText(saint.patronage)}</p>
                <p className="mt-10 text-xl font-serif italic text-stone-500 leading-relaxed">{renderSafeText(saint.biography)}</p>
            </section>
          )}

          {insight && (
            <article className="bg-[#fcf8e8] dark:bg-stone-900/50 p-12 rounded-[4rem] border border-gold/30 shadow-xl space-y-6">
               <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-[#8b0000]">{t('insight')}</h3>
               <p className="text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">"{renderSafeText(insight)}"</p>
            </article>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
