
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDailyQuote, generateSpeech, getLiturgyInsight } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CACHE_KEY = 'cathedra_daily_v3.4';
const INSIGHT_CACHE_PREFIX = 'cath_ins_v3.4_';

const CardSkeleton = ({ className }: { className: string }) => (
  <div className={`bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[2rem] ${className}`} />
);

const SacredImage = memo(({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const optimizedSrc = src.includes('unsplash.com') ? `${src}&w=600&q=80` : src;

  return (
    <div className={`relative bg-stone-100 dark:bg-stone-800 ${className} flex items-center justify-center overflow-hidden`}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      <img 
        src={error || !src ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=600&q=80" : optimizedSrc} 
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  );
});

interface DashboardProps {
  onSearch: (topic: string) => void;
  onNavigate: (route: AppRoute) => void;
  user: User | null;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user }) => {
  const [saint, setSaint] = useState<Saint | null>(null);
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [loading, setLoading] = useState({ saint: true, gospel: true, quote: true });
  const [isSaintExpanded, setIsSaintExpanded] = useState(false);
  const [query, setQuery] = useState('');
  
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<{ reading: LiturgyReading, text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const warmUpInsight = useCallback(async (g: Gospel) => {
    const key = `${INSIGHT_CACHE_PREFIX}${g.reference}`;
    if (localStorage.getItem(key)) return;
    try {
      const insight = await getLiturgyInsight(g.title, g.reference, g.text);
      localStorage.setItem(key, insight);
    } catch (e) {}
  }, []);

  const fetchFreshData = useCallback(async (force = false) => {
    const today = new Date().toLocaleDateString('pt-BR');
    if (force) {
      setIsSyncing(true);
      setLoading({ saint: true, gospel: true, quote: true });
      localStorage.removeItem(CACHE_KEY);
    }

    try {
      const [gRes, sRes, qRes] = await Promise.all([
        getDailyGospel(),
        getDailySaint(),
        getDailyQuote()
      ]);

      setGospel(gRes);
      setSaint(sRes);
      setDailyQuote(qRes);
      
      const current = {
        date: today,
        gospel: gRes,
        saint: sRes,
        quote: qRes
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(current));
      
      if (gRes) warmUpInsight(gRes);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading({ saint: false, gospel: false, quote: false });
      if (force) setIsSyncing(false);
    }
  }, [warmUpInsight]);

  useEffect(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.date === today) {
        setSaint(parsed.saint);
        setGospel(parsed.gospel);
        setDailyQuote(parsed.quote);
        setLoading({ saint: false, gospel: false, quote: false });
        if (parsed.gospel) warmUpInsight(parsed.gospel);
        return;
      }
    }
    fetchFreshData();
  }, [fetchFreshData, warmUpInsight]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setPlayingId(null);
    setAudioLoading(null);
  };

  const toggleSpeech = async (reading: LiturgyReading, id: string) => {
    if (playingId === id) { stopAudio(); return; }
    stopAudio();
    setAudioLoading(id);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const base64Audio = await generateSpeech(`${reading.title}. ${reading.text}`);
      const buffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingId(null);
      setAudioLoading(null);
      setPlayingId(id);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      setAudioLoading(null);
      stopAudio();
    }
  };

  const handleOpenInsight = async (reading: LiturgyReading, id: string) => {
    const key = `${INSIGHT_CACHE_PREFIX}${reading.reference}`;
    const cached = localStorage.getItem(key);
    if (cached) { setActiveInsight({ reading, text: cached }); return; }
    setInsightLoading(id);
    try {
      const insight = await getLiturgyInsight(reading.title, reading.reference, reading.text);
      localStorage.setItem(key, insight);
      setActiveInsight({ reading, text: insight });
    } catch (err) { 
      console.error(err); 
    } finally { 
      setInsightLoading(null); 
    }
  };

  return (
    <div className="space-y-6 md:space-y-12 page-enter pb-32 w-full max-w-full overflow-x-hidden">
      
      {/* 1. HERO LITÚRGICO */}
      <section className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl min-h-[160px] md:min-h-[250px] flex items-center p-6 md:p-10">
        {loading.gospel && !gospel ? (
          <div className="w-full flex flex-col md:flex-row items-center gap-6 animate-pulse">
             <div className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-stone-100 dark:bg-stone-800" />
             <div className="flex-1 space-y-2">
               <div className="h-6 bg-stone-100 dark:bg-stone-800 rounded w-3/4 mx-auto md:mx-0" />
               <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-1/2 mx-auto md:mx-0" />
             </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full animate-in fade-in duration-700">
            <div className="flex-shrink-0 relative">
               <div className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-gold/10 flex items-center justify-center shadow-lg border-2 border-white dark:border-stone-700">
                  <Icons.Cross className="w-6 h-6 md:w-10 md:h-10 text-gold" />
               </div>
               <button 
                  onClick={() => fetchFreshData(true)}
                  disabled={isSyncing}
                  className={`absolute -bottom-1 -right-1 p-2 bg-white dark:bg-stone-800 rounded-full shadow-md border border-stone-100 dark:border-stone-700 text-gold active:scale-90 transition-all ${isSyncing ? 'animate-spin' : ''}`}
               >
                  <Icons.History className="w-3 h-3 md:w-4 md:h-4" />
               </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-1">
              <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.3em] text-gold">{gospel?.calendar?.season}</span>
              <h2 className="text-xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                {gospel?.calendar?.dayName || 'Carregando Liturgia...'}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <span className="px-2 py-0.5 bg-stone-900 dark:bg-stone-100 text-gold dark:text-stone-900 rounded-full text-[6px] md:text-[8px] font-black uppercase tracking-widest">
                  {gospel?.calendar?.rank}
                </span>
                <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Ciclo {gospel?.calendar?.cycle} • {gospel?.calendar?.week}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. BUSCA */}
      <section className="max-w-2xl mx-auto -mt-10 md:-mt-14 relative z-20 px-4 w-full">
        <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="bg-white dark:bg-stone-900 p-2 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Deseja investigar?" 
            className="flex-1 pl-4 pr-2 py-3 md:py-4 bg-stone-50 dark:bg-stone-800 dark:text-white rounded-[1.2rem] md:rounded-[1.5rem] outline-none font-serif italic text-sm md:text-lg"
          />
          <button type="submit" className="bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 px-4 md:px-6 py-3 md:py-4 rounded-[1.1rem] md:rounded-[1.3rem] font-black uppercase tracking-widest text-[8px] md:text-[10px] shadow-lg active:scale-95 transition-all">
            <Icons.Search className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* 3. GRID */}
      <div className="grid lg:grid-cols-12 gap-6 md:gap-8 px-4 md:px-0">
        
        <main className="lg:col-span-8 space-y-6 md:space-y-8 order-2 lg:order-1">
          {loading.gospel && !gospel ? ( <CardSkeleton className="h-48" /> ) : (
            <article className="bg-white dark:bg-stone-900 p-6 md:p-10 rounded-[1.8rem] md:rounded-[2.5rem] shadow-lg border border-stone-100 dark:border-stone-800 relative animate-in fade-in duration-700">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg text-sacred"><Icons.Book className="w-4 h-4" /></div>
                   <p className="text-sm md:text-lg font-serif font-bold text-stone-900 dark:text-stone-100">{gospel?.reference}</p>
                 </div>
                 <div className="flex gap-1.5">
                   <button onClick={() => handleOpenInsight({ title: 'Evangelho', reference: gospel!.reference, text: gospel!.text }, 'gospel')} className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded-full text-gold active:scale-90 transition-all">
                      {insightLoading === 'gospel' ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-3.5 h-3.5" />}
                   </button>
                   <button onClick={() => toggleSpeech({ title: 'Evangelho', reference: gospel!.reference, text: gospel!.text }, 'gospel')} className={`p-2.5 rounded-full transition-all active:scale-90 ${playingId === 'gospel' ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-gold'}`}>
                      {audioLoading === 'gospel' ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-3.5 h-3.5" />}
                   </button>
                 </div>
               </div>
               <p className="text-lg md:text-3xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug break-words">"{gospel?.text}"</p>
               <div className="mt-6 p-5 bg-stone-50/50 dark:bg-stone-800/50 rounded-xl border-l-4 border-gold">
                  <p className="text-xs md:text-base font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{gospel?.reflection}</p>
               </div>
            </article>
          )}
        </main>

        <aside className="lg:col-span-4 space-y-6 md:space-y-8 order-1 lg:order-2">
          {loading.saint && !saint ? ( <CardSkeleton className="h-64" /> ) : (
            <section className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-lg text-center flex flex-col items-center animate-in fade-in duration-700">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-stone-800 shadow-xl overflow-hidden mb-3">
                   <SacredImage src={saint?.image || ''} alt={saint?.name || ''} className="w-full h-full" />
                </div>
                <h3 className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{saint?.name}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest text-gold mt-0.5">{saint?.patronage}</p>
                <div className={`mt-3 space-y-2 transition-all duration-700 overflow-hidden ${isSaintExpanded ? 'max-h-[400px] opacity-100' : 'max-h-12 opacity-60'}`}>
                   <p className="text-xs md:text-sm font-serif italic text-stone-500 dark:text-stone-400 break-words">{saint?.biography}</p>
                </div>
                <button onClick={() => setIsSaintExpanded(!isSaintExpanded)} className="mt-3 text-[8px] font-black uppercase tracking-widest text-gold active:scale-95">{isSaintExpanded ? 'Recolher' : 'Biografia'}</button>
            </section>
          )}

          {loading.quote && !dailyQuote ? ( <CardSkeleton className="h-28" /> ) : (
            <section className="bg-stone-900 p-6 rounded-[1.8rem] md:rounded-[2.5rem] text-white shadow-xl text-center relative overflow-hidden">
               <div className="relative z-10 space-y-2">
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-gold">Sententia</span>
                  <p className="text-base md:text-lg font-serif italic leading-snug break-words">"{dailyQuote?.quote}"</p>
                  <cite className="block text-[7px] font-black uppercase tracking-widest text-stone-500">— {dailyQuote?.author}</cite>
               </div>
            </section>
          )}
        </aside>
      </div>

      {activeInsight && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setActiveInsight(null)}>
           <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-xl rounded-[2rem] p-6 md:p-10 shadow-3xl border-t-8 border-gold relative overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setActiveInsight(null)} className="absolute top-4 right-4 p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-sacred hover:text-white transition-all z-10">
                <Icons.Cross className="w-4 h-4 rotate-45" />
              </button>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                <header>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gold">Luz da Tradição</span>
                  <h3 className="text-lg md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{activeInsight.reading.title}</h3>
                </header>
                <div className="text-sm md:text-lg font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">{activeInsight.text}</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
