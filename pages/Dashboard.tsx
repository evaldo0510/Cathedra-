
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icons } from '../constants';
import { getDailyBundle, generateSpeech } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import SacredImage from '../components/SacredImage';

const CACHE_KEY = 'cathedra_daily_v4.1';
const INSIGHT_CACHE_PREFIX = 'cath_ins_v4.1_';

const CardSkeleton = ({ className }: { className: string }) => (
  <div className={`bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[2rem] ${className}`} />
);

interface DashboardProps {
  onSearch: (topic: string) => void;
  onNavigate: (route: AppRoute) => void;
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user }) => {
  const [bundleData, setBundleData] = useState<{ gospel: Gospel | null, saint: Saint | null, quote: any | null, insight: string | null }>({
    gospel: null,
    saint: null,
    quote: null,
    insight: null
  });
  const [loading, setLoading] = useState(true);
  const [isSaintExpanded, setIsSaintExpanded] = useState(false);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<{ reading: LiturgyReading, text: string | null } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const fetchBundle = useCallback(async (force = false) => {
    if (force) setIsSyncing(true);
    
    try {
      const bundle = await getDailyBundle();
      if (bundle && bundle.gospel) {
        setBundleData({
          gospel: bundle.gospel,
          saint: bundle.saint,
          quote: bundle.quote,
          insight: bundle.insight || null
        });
        
        const today = new Date().toLocaleDateString('pt-BR');
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, ...bundle }));
        if (bundle.gospel.reference) {
          localStorage.setItem(`${INSIGHT_CACHE_PREFIX}${bundle.gospel.reference}`, bundle.insight || "");
        }
      }
    } catch (err) {
      console.error("Dashboard Bundle error:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today && parsed.gospel) {
          setBundleData({
            gospel: parsed.gospel,
            saint: parsed.saint,
            quote: parsed.quote,
            insight: parsed.insight || null
          });
          setLoading(false);
          if (navigator.onLine) fetchBundle();
          return;
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
    fetchBundle();
  }, [fetchBundle]);

  const toggleSpeech = async (reading: LiturgyReading, id: string) => {
    if (!reading || !reading.text) return;
    if (playingId === id) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setPlayingId(null);
      return;
    }
    
    setAudioLoading(id);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const base64Audio = await generateSpeech(`${reading.title || 'Leitura'}. ${reading.text}`);
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
      setPlayingId(null);
    }
  };

  const handleOpenInsight = useCallback((reading: LiturgyReading) => {
    if (!reading) return;
    const key = `${INSIGHT_CACHE_PREFIX}${reading.reference || 'global'}`;
    const cached = localStorage.getItem(key) || bundleData.insight;
    setActiveInsight({ reading, text: cached || "A meditação está sendo preparada pela Tradição..." });
  }, [bundleData.insight]);

  const { gospel, saint, quote } = bundleData;

  const heroBackgroundImage = useMemo(() => {
    const season = gospel?.calendar?.season;
    if (season === 'Quaresma') return "https://images.unsplash.com/photo-1543158021-00212008304f?q=80";
    if (season === 'Páscoa') return "https://images.unsplash.com/photo-1516733729877-db5583a67bc8?q=80";
    if (season === 'Natal') return "https://images.unsplash.com/photo-1544253323-f11993358055?q=80";
    return "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80"; 
  }, [gospel?.calendar?.season]);

  return (
    <div className="space-y-6 md:space-y-12 page-enter pb-32 w-full max-w-full overflow-x-hidden">
      
      {/* 1. HERO LITÚRGICO COM SEQUÊNCIA DE REVELAÇÃO */}
      <section className="relative overflow-hidden rounded-[2.5rem] md:rounded-[4.5rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl min-h-[220px] md:min-h-[350px] flex items-center p-8 md:p-16">
        
        {/* Background Layer: Surge primeiro */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none animate-in fade-in duration-1000">
           <SacredImage 
            src={heroBackgroundImage} 
            alt="Atmosfera Litúrgica" 
            className="w-full h-full opacity-[0.12] dark:opacity-30 grayscale mix-blend-multiply dark:mix-blend-overlay"
            priority={true}
           />
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-stone-950 dark:via-stone-950/90 dark:to-transparent" />
        </div>

        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
        
        {loading && !gospel ? (
          <div className="w-full flex flex-col md:flex-row items-center gap-8 animate-pulse relative z-10">
             <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-stone-100 dark:bg-stone-800" />
             <div className="flex-1 space-y-4 text-center md:text-left">
               <div className="h-8 md:h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl w-3/4 mx-auto md:mx-0" />
               <div className="h-5 bg-stone-100 dark:bg-stone-800 rounded-xl w-1/2 mx-auto md:mx-0" />
             </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-14 w-full">
            
            {/* Elemento 1: Ícone Sagrado (Entrada Lateral) */}
            <div className="flex-shrink-0 relative animate-in fade-in slide-in-from-left-12 duration-1000 fill-mode-both">
               <div className="w-24 h-24 md:w-44 md:h-44 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center border-8 border-gold/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gold/5 animate-pulse" />
                  <Icons.Cross className="w-10 h-10 md:w-20 md:h-20 text-gold relative z-10" />
               </div>
               <button 
                  onClick={() => fetchBundle(true)}
                  disabled={isSyncing}
                  className={`absolute -bottom-2 -right-2 p-4 bg-stone-900 dark:bg-stone-100 rounded-full shadow-2xl text-gold dark:text-stone-900 hover:scale-110 active:scale-95 transition-all z-20 ${isSyncing ? 'animate-spin' : ''}`}
               >
                  <Icons.History className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              {/* Elemento 2: Tag de Temporada (Slide Up curto) */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-gold/80">
                  {gospel?.calendar?.season}
                </span>
              </div>

              {/* Elemento 3: Título Principal (Slide Up longo) */}
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
                <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tight">
                  {gospel?.calendar?.dayName || 'Liturgia do Dia'}
                </h2>
              </div>

              {/* Elemento 4: Botões de Ação (Aparecem por último) */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-3 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700 fill-mode-both">
                <span className="px-5 py-1.5 bg-stone-900 dark:bg-stone-100 text-gold dark:text-stone-900 rounded-full text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-lg">
                  {gospel?.calendar?.rank || 'Feria'}
                </span>
                <button 
                  onClick={() => onNavigate(AppRoute.STUDY_MODE)}
                  className="px-5 py-1.5 bg-[#8b0000] text-white rounded-full text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all active:scale-95"
                >
                  Modo de Estudo IA
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. GRID PRINCIPAL */}
      <div className="grid lg:grid-cols-12 gap-6 md:gap-12 px-4 md:px-0">
        
        <main className="lg:col-span-8 space-y-6 md:space-y-12 order-2 lg:order-1">
          {loading && !gospel ? ( <CardSkeleton className="h-64" /> ) : gospel ? (
            <article className="bg-white dark:bg-stone-900 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] shadow-xl border border-stone-100 dark:border-stone-800 relative transition-all duration-500 hover:shadow-2xl">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-sacred/5 rounded-2xl">
                      <Icons.Book className="w-6 h-6 text-sacred" />
                   </div>
                   <p className="text-lg md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{gospel?.reference}</p>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => handleOpenInsight(gospel)} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl text-gold hover:bg-gold hover:text-white transition-all shadow-sm">
                      <Icons.Feather className="w-5 h-5" />
                   </button>
                   <button onClick={() => toggleSpeech(gospel, 'gospel')} className={`p-4 rounded-2xl transition-all shadow-sm ${playingId === 'gospel' ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-gold'}`}>
                      {audioLoading === 'gospel' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-5 h-5" />}
                   </button>
                 </div>
               </div>
               <p className="text-2xl md:text-5xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug break-words">"{gospel?.text}"</p>
               {gospel?.reflection && (
                 <div className="mt-10 p-8 md:p-12 bg-stone-50/50 dark:bg-stone-800/40 rounded-[2.5rem] border-l-[12px] border-gold shadow-inner group transition-all hover:bg-white dark:hover:bg-stone-800">
                    <p className="text-base md:text-2xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{gospel?.reflection}</p>
                 </div>
               )}
            </article>
          ) : null}
        </main>

        <aside className="lg:col-span-4 space-y-6 md:space-y-12 order-1 lg:order-2">
          {loading && !saint ? ( <CardSkeleton className="h-[400px]" /> ) : saint ? (
            <section className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center flex flex-col items-center animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="w-32 h-32 md:w-56 md:h-56 rounded-full border-[12px] border-white dark:border-stone-800 shadow-2xl overflow-hidden mb-8 relative group ring-[16px] ring-gold/5">
                   <SacredImage src={saint?.image || ''} alt={saint?.name || ''} className="w-full h-full" priority={false} />
                   <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-2xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{saint?.name}</h3>
                <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-gold mt-2">{saint?.patronage}</p>
                <div className={`mt-8 space-y-4 transition-all duration-700 overflow-hidden ${isSaintExpanded ? 'max-h-[800px] opacity-100' : 'max-h-24 opacity-60'}`}>
                   <p className="text-base md:text-xl font-serif italic text-stone-500 dark:text-stone-400 break-words leading-relaxed whitespace-pre-line">{saint?.biography}</p>
                </div>
                <button 
                  onClick={() => setIsSaintExpanded(!isSaintExpanded)} 
                  className="mt-8 text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-gold hover:text-sacred transition-all group flex items-center gap-3"
                >
                  {isSaintExpanded ? 'Ocultar' : 'Biografia Plena'}
                  <Icons.ArrowDown className={`w-4 h-4 transition-transform duration-700 ${isSaintExpanded ? 'rotate-180' : ''}`} />
                </button>
            </section>
          ) : null}

          {loading && !quote ? ( <CardSkeleton className="h-48" /> ) : quote ? (
            <section className="bg-stone-950 dark:bg-stone-50 p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] text-white dark:text-stone-900 shadow-2xl text-center relative overflow-hidden group hover:shadow-gold/20 transition-all border border-white/5">
               <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent pointer-events-none" />
               <div className="relative z-10 space-y-4">
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-gold/60 dark:text-sacred">Sententia Sancti</span>
                  <p className="text-xl md:text-3xl font-serif italic leading-snug break-words">"{quote?.quote}"</p>
                  <cite className="block text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 mt-4">— {quote?.author}</cite>
               </div>
            </section>
          ) : null}
        </aside>
      </div>

      {/* MODAL COM TRANSIÇÃO ACELERADA */}
      {activeInsight && (
        <div 
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop animate-fast-in" 
          onClick={() => setActiveInsight(null)}
        >
           <div 
            className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-2xl rounded-[3.5rem] md:rounded-[5rem] p-10 md:p-16 shadow-3xl border-t-[12px] border-gold relative overflow-hidden flex flex-col max-h-[88vh] animate-modal-zoom" 
            onClick={e => e.stopPropagation()}
           >
              <button 
                onClick={() => setActiveInsight(null)} 
                className="absolute top-8 right-8 p-4 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-sacred hover:text-white transition-all z-10 active:scale-90 shadow-lg"
              >
                <Icons.Cross className="w-6 h-6 rotate-45" />
              </button>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 space-y-8">
                <header className="space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gold">Lumen Gentium</span>
                  <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tight">
                    {activeInsight.reading.title}
                  </h3>
                </header>

                <div className="text-lg md:text-3xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words animate-in fade-in duration-700">
                  {activeInsight.text}
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
