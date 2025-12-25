
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDailyQuote, generateSpeech, getLiturgyInsight } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CACHE_KEY = 'cathedra_daily_cache_v2.5';
const INSIGHT_CACHE_PREFIX = 'cath_ins_';

// Skeleton Component para Estabilidade de Layout (CLS Zero)
const CardSkeleton = ({ className }: { className: string }) => (
  <div className={`bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[3rem] ${className}`} />
);

const SacredImage = memo(({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className={`relative bg-stone-100 dark:bg-stone-800 ${className} flex items-center justify-center overflow-hidden`}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
        </div>
      )}
      <img 
        src={error || !src ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800" : src} 
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
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

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Pre-warming: Busca o insight e salva no cache local para abertura instantânea
  const warmUpInsight = useCallback(async (g: Gospel) => {
    const key = `${INSIGHT_CACHE_PREFIX}${g.reference}`;
    if (localStorage.getItem(key)) return;
    try {
      const insight = await getLiturgyInsight(g.title, g.reference, g.text);
      localStorage.setItem(key, insight);
    } catch (e) {}
  }, []);

  // Estratégia SWR: Carrega cache primeiro, revalida depois
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
      }
    }

    // Busca independente e paralela para evitar gargalos
    const fetchFreshData = async () => {
      // Gospel
      getDailyGospel().then(res => {
        setGospel(res);
        setLoading(p => ({ ...p, gospel: false }));
        warmUpInsight(res);
        updateCache('gospel', res);
      });

      // Saint
      getDailySaint().then(res => {
        setSaint(res);
        setLoading(p => ({ ...p, saint: false }));
        updateCache('saint', res);
      });

      // Quote
      getDailyQuote().then(res => {
        setDailyQuote(res);
        setLoading(p => ({ ...p, quote: false }));
        updateCache('quote', res);
      });
    };

    const updateCache = (key: string, value: any) => {
      const current = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      current.date = today;
      current[key] = value;
      localStorage.setItem(CACHE_KEY, JSON.stringify(current));
    };

    fetchFreshData();
    return () => stopAudio();
  }, [warmUpInsight]);

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
    
    if (cached) {
      setActiveInsight({ reading, text: cached });
      return;
    }

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
    <div className="space-y-12 md:space-y-20 page-enter pb-32">
      
      {/* 1. HERO LITÚRGICO: Estabilidade Visual */}
      <section className="relative overflow-hidden rounded-[3rem] md:rounded-[4rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl transition-all duration-700 min-h-[300px] flex items-center">
        {loading.gospel && !gospel ? (
          <div className="w-full h-full p-8 md:p-16 flex flex-col md:flex-row items-center gap-10">
             <div className="w-40 h-40 rounded-full bg-stone-100 dark:bg-stone-800 animate-pulse" />
             <div className="flex-1 space-y-4">
               <div className="h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl w-3/4 animate-pulse" />
               <div className="h-6 bg-stone-100 dark:bg-stone-800 rounded-2xl w-1/2 animate-pulse" />
             </div>
          </div>
        ) : (
          <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full animate-in fade-in duration-700">
            <div className="flex-shrink-0 relative">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#d4af37]/10 flex items-center justify-center shadow-xl border-8 border-stone-50 dark:border-stone-700 relative z-20 overflow-hidden">
                  <div className="absolute inset-0 bg-[#d4af37] opacity-20 animate-pulse" />
                  <Icons.Cross className="w-12 h-12 text-[#d4af37]" />
               </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37]">{gospel?.calendar?.season}</span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                {gospel?.calendar?.dayName}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <span className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-[#d4af37] dark:text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                  {gospel?.calendar?.rank}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                  Ciclo {gospel?.calendar?.cycle} • {gospel?.calendar?.week}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. BUSCA: Centralizada */}
      <section className="max-w-4xl mx-auto -mt-20 relative z-20 px-4">
        <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="bg-white dark:bg-stone-900 p-4 rounded-[2.5rem] shadow-3xl border border-stone-100 dark:border-stone-800 flex items-center gap-4">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que deseja investigar hoje?" 
            className="flex-1 pl-6 pr-6 py-6 bg-stone-50 dark:bg-stone-800 dark:text-white rounded-[2rem] outline-none font-serif italic text-xl"
          />
          <button type="submit" className="bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-10 py-6 rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-xl">
            Explorar
          </button>
        </form>
      </section>

      {/* 3. GRID PRINCIPAL */}
      <div className="grid lg:grid-cols-12 gap-8 md:gap-12 px-4 md:px-0">
        
        {/* Evangelho e Meditação */}
        <main className="lg:col-span-8 space-y-10 order-2 lg:order-1">
          {loading.gospel && !gospel ? (
            <CardSkeleton className="h-96" />
          ) : (
            <article className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl text-[#8b0000]">
                     <Icons.Book className="w-6 h-6" />
                   </div>
                   <p className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{gospel?.reference}</p>
                 </div>
                 <div className="flex gap-3">
                   <button 
                      onClick={() => handleOpenInsight({ title: 'Evangelho', reference: gospel!.reference, text: gospel!.text }, 'gospel')}
                      className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full text-[#d4af37] hover:scale-110 transition-transform"
                   >
                      {insightLoading === 'gospel' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-5 h-5" />}
                   </button>
                   <button 
                      onClick={() => toggleSpeech({ title: 'Evangelho', reference: gospel!.reference, text: gospel!.text }, 'gospel')} 
                      className={`p-4 rounded-full transition-all ${playingId === 'gospel' ? 'bg-[#8b0000] text-white' : 'bg-stone-50 dark:bg-stone-800 text-[#d4af37]'}`}
                   >
                      {audioLoading === 'gospel' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-5 h-5" />}
                   </button>
                 </div>
               </div>
               <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug tracking-tight">"{gospel?.text}"</p>
               <div className="mt-12 p-8 bg-[#fcf8e8] dark:bg-stone-800/50 rounded-[2.5rem] border-l-8 border-[#d4af37]">
                  <p className="text-lg font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{gospel?.reflection}</p>
               </div>
            </article>
          )}
        </main>

        {/* Sidebar: Santo e Sabedoria */}
        <aside className="lg:col-span-4 space-y-10 order-1 lg:order-2">
          {loading.saint && !saint ? (
            <CardSkeleton className="h-[500px]" />
          ) : (
            <section className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl text-center flex flex-col items-center group animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="relative mb-8">
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-white dark:border-stone-800 shadow-2xl overflow-hidden relative z-10">
                      <SacredImage src={saint?.image || ''} alt={saint?.name || ''} className="w-full h-full" />
                   </div>
                   <div className="absolute -inset-4 rounded-full border-2 border-dashed border-[#d4af37]/20 group-hover:rotate-180 transition-transform duration-[10s] linear infinite" />
                </div>
                <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{saint?.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] mt-2">{saint?.patronage}</p>
                <div className={`mt-6 space-y-4 transition-all duration-700 ${isSaintExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-24 opacity-60 overflow-hidden'}`}>
                   <p className="text-lg font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed">{saint?.biography}</p>
                   {saint?.quote && <p className="p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl border-l-4 border-[#d4af37] text-stone-700 dark:text-stone-300 italic font-serif">"{saint.quote}"</p>}
                </div>
                <button onClick={() => setIsSaintExpanded(!isSaintExpanded)} className="mt-8 text-[11px] font-black uppercase tracking-widest text-[#d4af37]">{isSaintExpanded ? 'Recolher' : 'Ler Biografia'}</button>
            </section>
          )}

          {loading.quote && !dailyQuote ? (
             <CardSkeleton className="h-48" />
          ) : (
            <section className="bg-[#1a1a1a] p-10 rounded-[3rem] text-white shadow-3xl text-center relative overflow-hidden animate-in fade-in duration-1000">
               <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/20 to-transparent" />
               <Icons.Feather className="absolute -bottom-6 -right-6 w-32 h-32 text-[#d4af37]/10" />
               <div className="relative z-10 space-y-6">
                  <span className="text-[9px] font-black uppercase tracking-[0.6em] text-[#d4af37]">Sententia Diei</span>
                  <p className="text-2xl font-serif italic leading-snug">"{dailyQuote?.quote}"</p>
                  <cite className="block text-[10px] font-black uppercase tracking-widest text-stone-500">— {dailyQuote?.author}</cite>
               </div>
            </section>
          )}
        </aside>
      </div>

      {/* Insight Modal */}
      {activeInsight && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setActiveInsight(null)}>
           <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-4xl rounded-[4rem] p-10 md:p-16 shadow-3xl border-t-[16px] border-[#d4af37] relative overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setActiveInsight(null)} className="absolute top-8 right-8 p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-[#8b0000] hover:text-white transition-all">
                <Icons.Cross className="w-6 h-6 rotate-45" />
              </button>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
                <header className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Luz da Tradição</span>
                  <h3 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{activeInsight.reading.title}</h3>
                </header>
                <div className="text-lg md:text-2xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{activeInsight.text}</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
