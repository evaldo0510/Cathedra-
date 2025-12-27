
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDailyQuote, generateSpeech, getLiturgyInsight } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CACHE_KEY = 'cathedra_daily_v3.6';
const INSIGHT_CACHE_PREFIX = 'cath_ins_v3.6_';

const CardSkeleton = ({ className }: { className: string }) => (
  <div className={`bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[2rem] ${className}`} />
);

const SacredImage = memo(({ src, alt, className, priority = false }: { src: string, alt: string, className: string, priority?: boolean }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Otimização de URL Unsplash para mobile/desktop
  const optimizedSrc = src?.includes('unsplash.com') 
    ? `${src}&w=${priority ? 1200 : 600}&q=75&auto=format` 
    : src;

  return (
    <div className={`relative bg-stone-100 dark:bg-stone-900 overflow-hidden ${className}`}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
           <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-gold/10 to-transparent" style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}
      <img 
        src={error || !src ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=600&q=80" : optimizedSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`w-full h-full object-cover transition-all duration-1000 transform ${loading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 shadow-inner pointer-events-none" />
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
  const [activeInsight, setActiveInsight] = useState<{ reading: LiturgyReading, text: string | null } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Pre-load de insights para o Evangelho (Silent)
  const warmUpInsight = useCallback(async (g: Gospel) => {
    const key = `${INSIGHT_CACHE_PREFIX}${g.reference}`;
    if (localStorage.getItem(key)) return;
    try {
      const insight = await getLiturgyInsight(g.title, g.reference, g.text);
      localStorage.setItem(key, insight);
      // Se o modal estiver aberto e sem texto, atualiza ele
      setActiveInsight(prev => (prev && prev.reading.reference === g.reference) ? { ...prev, text: insight } : prev);
    } catch (e) {}
  }, []);

  const fetchFreshData = useCallback(async (force = false) => {
    const today = new Date().toLocaleDateString('pt-BR');
    if (force) setIsSyncing(true);

    try {
      // Paraleliza as chamadas mas permite que cada uma atualize a UI assim que chegar
      const [gRes, sRes, qRes] = await Promise.all([
        getDailyGospel(),
        getDailySaint(),
        getDailyQuote()
      ]);

      setGospel(gRes);
      setSaint(sRes);
      setDailyQuote(qRes);
      
      const current = { date: today, gospel: gRes, saint: sRes, quote: qRes };
      localStorage.setItem(CACHE_KEY, JSON.stringify(current));
      
      if (gRes) warmUpInsight(gRes);
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      setLoading({ saint: false, gospel: false, quote: false });
      setIsSyncing(false);
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
        // Ainda assim faz uma checagem rápida em background se houver internet
        if (navigator.onLine) fetchFreshData();
        return;
      }
    }
    fetchFreshData();
  }, []);

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

  // OPEN MODAL INSTANTLY
  const handleOpenInsight = (reading: LiturgyReading) => {
    const key = `${INSIGHT_CACHE_PREFIX}${reading.reference}`;
    const cached = localStorage.getItem(key);
    
    // Abre o modal imediatamente
    setActiveInsight({ reading, text: cached || null });

    // Se não tiver cache, busca agora
    if (!cached) {
      getLiturgyInsight(reading.title, reading.reference, reading.text)
        .then(insight => {
          localStorage.setItem(key, insight);
          setActiveInsight(prev => (prev && prev.reading.reference === reading.reference) ? { ...prev, text: insight } : prev);
        })
        .catch(() => {
          setActiveInsight(prev => (prev && prev.reading.reference === reading.reference) ? { ...prev, text: "Ocorreu um erro ao carregar a meditação." } : prev);
        });
    }
  };

  return (
    <div className="space-y-6 md:space-y-12 page-enter pb-32 w-full max-w-full overflow-x-hidden">
      
      {/* 1. HERO LITÚRGICO OTIMIZADO */}
      <section className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl min-h-[160px] md:min-h-[250px] flex items-center p-6 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        {loading.gospel && !gospel ? (
          <div className="w-full flex flex-col md:flex-row items-center gap-6 animate-pulse">
             <div className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-stone-100 dark:bg-stone-800" />
             <div className="flex-1 space-y-2">
               <div className="h-6 bg-stone-100 dark:bg-stone-800 rounded w-3/4 mx-auto md:mx-0" />
               <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-1/2 mx-auto md:mx-0" />
             </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full animate-in fade-in zoom-in-95 duration-700">
            <div className="flex-shrink-0 relative">
               <div className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-gold/10 flex items-center justify-center shadow-lg border-2 border-white dark:border-stone-700">
                  <Icons.Cross className="w-6 h-6 md:w-10 md:h-10 text-gold" />
               </div>
               <button 
                  onClick={() => fetchFreshData(true)}
                  disabled={isSyncing}
                  className={`absolute -bottom-1 -right-1 p-2 bg-white dark:bg-stone-800 rounded-full shadow-md border border-stone-100 dark:border-stone-700 text-gold active:scale-90 transition-all ${isSyncing ? 'animate-spin' : ''}`}
               >
                  <Icons.History className="w-3 h-3 md:w-4 h-4" />
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

      {/* 2. GRID PRINCIPAL */}
      <div className="grid lg:grid-cols-12 gap-6 md:gap-8 px-4 md:px-0">
        
        <main className="lg:col-span-8 space-y-6 md:space-y-8 order-2 lg:order-1">
          {loading.gospel && !gospel ? ( <CardSkeleton className="h-48" /> ) : (
            <article className="bg-white dark:bg-stone-900 p-6 md:p-10 rounded-[1.8rem] md:rounded-[2.5rem] shadow-lg border border-stone-100 dark:border-stone-800 relative animate-in fade-in duration-1000">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg text-sacred"><Icons.Book className="w-4 h-4" /></div>
                   <p className="text-sm md:text-lg font-serif font-bold text-stone-900 dark:text-stone-100">{gospel?.reference}</p>
                 </div>
                 <div className="flex gap-1.5">
                   <button onClick={() => handleOpenInsight({ title: 'Evangelho', reference: gospel!.reference, text: gospel!.text })} className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded-full text-gold active:scale-90 transition-all hover:bg-gold hover:text-white">
                      <Icons.Feather className="w-3.5 h-3.5" />
                   </button>
                   <button onClick={() => toggleSpeech({ title: 'Evangelho', reference: gospel!.reference, text: gospel!.text }, 'gospel')} className={`p-2.5 rounded-full transition-all active:scale-90 ${playingId === 'gospel' ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-gold hover:bg-gold hover:text-white'}`}>
                      {audioLoading === 'gospel' ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-3.5 h-3.5" />}
                   </button>
                 </div>
               </div>
               <p className="text-lg md:text-3xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug break-words">"{gospel?.text}"</p>
               <div className="mt-6 p-5 bg-stone-50/50 dark:bg-stone-800/50 rounded-xl border-l-4 border-gold group">
                  <p className="text-xs md:text-base font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{gospel?.reflection}</p>
               </div>
            </article>
          )}
        </main>

        <aside className="lg:col-span-4 space-y-6 md:space-y-8 order-1 lg:order-2">
          {loading.saint && !saint ? ( <CardSkeleton className="h-64" /> ) : (
            <section className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-lg text-center flex flex-col items-center animate-in fade-in duration-700">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-stone-800 shadow-xl overflow-hidden mb-3 relative group">
                   <SacredImage src={saint?.image || ''} alt={saint?.name || ''} className="w-full h-full" priority />
                   <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{saint?.name}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest text-gold mt-0.5">{saint?.patronage}</p>
                <div className={`mt-3 space-y-2 transition-all duration-700 overflow-hidden ${isSaintExpanded ? 'max-h-[400px] opacity-100' : 'max-h-12 opacity-60'}`}>
                   <p className="text-xs md:text-sm font-serif italic text-stone-500 dark:text-stone-400 break-words">{saint?.biography}</p>
                </div>
                <button onClick={() => setIsSaintExpanded(!isSaintExpanded)} className="mt-3 text-[8px] font-black uppercase tracking-widest text-gold active:scale-95 hover:underline">{isSaintExpanded ? 'Recolher' : 'Biografia Completa'}</button>
            </section>
          )}

          {loading.quote && !dailyQuote ? ( <CardSkeleton className="h-28" /> ) : (
            <section className="bg-stone-900 p-6 rounded-[1.8rem] md:rounded-[2.5rem] text-white shadow-xl text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
               <div className="relative z-10 space-y-2">
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-gold">Sententia</span>
                  <p className="text-base md:text-lg font-serif italic leading-snug break-words">"{dailyQuote?.quote}"</p>
                  <cite className="block text-[7px] font-black uppercase tracking-widest text-stone-500">— {dailyQuote?.author}</cite>
               </div>
            </section>
          )}
        </aside>
      </div>

      {/* MODAL OTIMIZADO - INSTANTÁNEO */}
      {activeInsight && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setActiveInsight(null)}>
           <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-xl rounded-[2rem] p-6 md:p-10 shadow-3xl border-t-8 border-gold relative overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <button onClick={() => setActiveInsight(null)} className="absolute top-4 right-4 p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-sacred hover:text-white transition-all z-10">
                <Icons.Cross className="w-4 h-4 rotate-45" />
              </button>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                <header>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gold">Luz da Tradição</span>
                  <h3 className="text-lg md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{activeInsight.reading.title}</h3>
                </header>

                {!activeInsight.text ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-full" />
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-5/6" />
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-4/6" />
                    <div className="h-24 bg-stone-100 dark:bg-stone-800 rounded w-full mt-4" />
                  </div>
                ) : (
                  <div className="text-sm md:text-lg font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words animate-in fade-in duration-500">
                    {activeInsight.text}
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
