
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icons } from '../constants';
import { getDailyBundle, generateSpeech, DEFAULT_BUNDLE } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import SacredImage from '../components/SacredImage';

const CACHE_KEY = 'cathedra_daily_v5.0';

interface DashboardProps {
  onSearch: (topic: string) => void;
  onNavigate: (route: AppRoute) => void;
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user }) => {
  const [bundleData, setBundleData] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const today = new Date().toLocaleDateString('pt-BR');
      if (parsed.date === today) return parsed;
    }
    return { ...DEFAULT_BUNDLE, isPlaceholder: true };
  });

  const [isSaintExpanded, setIsSaintExpanded] = useState(false);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const fetchBundle = useCallback(async () => {
    setIsSyncing(true);
    try {
      const bundle = await getDailyBundle();
      if (bundle && bundle.gospel) {
        const today = new Date().toLocaleDateString('pt-BR');
        const newData = { date: today, ...bundle, isPlaceholder: false };
        setBundleData(newData);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  const toggleSpeech = async (reading: LiturgyReading, id: string) => {
    if (playingId === id) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setPlayingId(null);
      return;
    }
    
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
      setPlayingId(null);
    }
  };

  const { gospel, saint, quote, insight } = bundleData;

  const heroBackgroundImage = useMemo(() => {
    const season = gospel?.calendar?.season;
    if (season === 'Quaresma') return "https://images.unsplash.com/photo-1543158021-00212008304f?q=80";
    if (season === 'Páscoa') return "https://images.unsplash.com/photo-1516733729877-db5583a67bc8?q=80";
    return "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80"; 
  }, [gospel?.calendar?.season]);

  return (
    <div className="space-y-8 md:space-y-12 page-enter pb-32">
      {/* Banner Principal com Cor Litúrgica Ativa */}
      <section className="relative overflow-hidden rounded-[3.5rem] md:rounded-[5rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl min-h-[300px] md:min-h-[420px] flex items-center p-10 md:p-20 transition-all duration-700">
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
           <SacredImage 
            src={heroBackgroundImage} 
            alt="Fundo Litúrgico" 
            className="w-full h-full opacity-[0.2] dark:opacity-40 grayscale mix-blend-multiply dark:mix-blend-overlay"
            priority={true}
            liturgicalColor={gospel?.calendar?.color}
           />
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-stone-950 dark:via-stone-950/90 dark:to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full">
          <div className="flex-shrink-0 relative">
             <div className="w-28 h-28 md:w-48 md:h-48 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center border-[10px] border-gold/10 shadow-3xl relative overflow-hidden group">
                <Icons.Cross className={`w-12 h-12 md:w-24 md:h-24 text-gold relative z-10 ${isSyncing ? 'animate-pulse' : ''}`} />
             </div>
             {isSyncing && (
               <div className="absolute inset-0 rounded-full border-4 border-gold border-t-transparent animate-spin" />
             )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[0.6em] text-gold/80">
              {gospel?.calendar?.season || 'Liturgia'}
            </span>
            <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tighter">
              {bundleData.isPlaceholder ? 'Buscando Luz...' : gospel?.calendar?.dayName}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 pt-4">
              <span className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-gold dark:text-stone-900 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] shadow-xl">
                {gospel?.calendar?.rank || 'Feria'}
              </span>
              <button 
                onClick={() => onNavigate(AppRoute.LECTIO_DIVINA)}
                className="px-6 py-2 bg-sacred text-white rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 hover:bg-[#a61c1c] transition-all"
              >
                Iniciar Lectio Divina
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-10 md:gap-14 items-start">
        
        <main className="lg:col-span-8 space-y-12">
          
          {/* CARD DEDICADO À CITAÇÃO DO DIA (Sententia Sanctorum) */}
          {quote && (
            <article className="bg-[#1a1a1a] dark:bg-stone-800 p-10 md:p-16 rounded-[4rem] md:rounded-[4.5rem] shadow-3xl text-gold relative overflow-hidden group transition-all duration-700">
              <div className="absolute top-0 right-0 p-14 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Icons.Feather className="w-80 h-80 text-gold" />
              </div>
              <div className="relative z-10 space-y-10">
                <header className="flex items-center gap-5">
                  <div className="h-px w-12 bg-gold/30" />
                  <span className="text-[11px] font-black uppercase tracking-[0.7em] text-gold/60">Sententia Sanctorum</span>
                  <div className="h-px w-12 bg-gold/30" />
                </header>
                <div className="relative">
                  <span className="absolute -top-12 -left-8 text-[12rem] font-serif opacity-10 select-none text-gold">"</span>
                  <p className="text-3xl md:text-5xl font-serif italic leading-tight tracking-tight text-white dark:text-gold relative z-10 pr-4">
                    {quote.quote}
                  </p>
                </div>
                <footer className="flex items-center gap-6 pt-6 border-t border-white/5">
                   <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20 shadow-inner">
                     <Icons.Users className="w-6 h-6 text-gold" />
                   </div>
                   <div>
                     <cite className="block text-2xl font-serif font-bold text-gold not-italic">— {quote.author}</cite>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gold/40">Mestre da Tradição</p>
                   </div>
                </footer>
              </div>
            </article>
          )}

          {/* Card do Evangelho do Dia com Placeholder de Cor Litúrgica */}
          <article className="bg-white dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] md:rounded-[5rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group transition-all duration-500">
             <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-6">
                 <div className="p-5 bg-sacred/5 rounded-[2rem] shadow-inner">
                    <Icons.Book className="w-8 h-8 text-sacred" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-2xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">{gospel?.reference}</p>
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Evangelium Hodie</p>
                 </div>
               </div>
               <button onClick={() => toggleSpeech(gospel!, 'gospel')} className={`p-6 rounded-full transition-all shadow-2xl hover:scale-110 active:scale-95 ${playingId === 'gospel' ? 'bg-sacred text-white animate-pulse' : 'bg-stone-50 dark:bg-stone-800 text-gold hover:bg-[#fcf8e8]'}`}>
                  {audioLoading === 'gospel' ? <div className="w-7 h-7 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-7 h-7" />}
               </button>
             </div>
             
             <p className="text-3xl md:text-6xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug tracking-tight mb-16 whitespace-pre-line">
               "{gospel?.text}"
             </p>

             {gospel?.reflection && (
               <div className="p-12 md:p-16 bg-stone-50/50 dark:bg-stone-800/40 rounded-[4rem] border-l-[20px] border-gold shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-gold pointer-events-none">
                     <Icons.Feather className="w-40 h-40" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold mb-8">Puncta Meditationis (Reflexão)</h4>
                  <p className="text-xl md:text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap relative z-10">
                    {gospel?.reflection}
                  </p>
               </div>
             )}
          </article>

          {/* Insight Teológico Robusto */}
          {insight && (
            <article className="bg-[#fcf8e8] dark:bg-stone-900/50 p-12 md:p-16 rounded-[4rem] md:rounded-[4.5rem] border border-[#d4af37]/30 shadow-xl relative group">
               <div className="flex flex-col md:flex-row items-start gap-10">
                  <div className="p-5 bg-[#1a1a1a] rounded-[2rem] text-gold shadow-2xl flex-shrink-0 group-hover:rotate-12 transition-transform duration-500">
                    <Icons.Globe className="w-8 h-8" />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-[#8b0000]">Lumen Intellectus (Insight AI)</h3>
                    <p className="text-2xl md:text-4xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed tracking-tight">
                      {insight}
                    </p>
                    <div className="pt-6 border-t border-[#d4af37]/20 flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">"Investigação sintética sobre a verdade do dia."</p>
                       <Icons.Cross className="w-4 h-4 text-[#d4af37] opacity-40" />
                    </div>
                  </div>
               </div>
            </article>
          )}
        </main>

        <aside className="lg:col-span-4 space-y-12">
          
          {/* Card do Santo do Dia com Placeholder de Cor Litúrgica */}
          {saint && (
            <section className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-3xl text-center flex flex-col items-center relative group transition-all duration-500 hover:border-gold/40">
                <div className="w-36 h-36 md:w-60 md:h-60 rounded-full border-[12px] border-white dark:border-stone-800 shadow-2xl overflow-hidden mb-12 relative ring-[15px] ring-gold/5 group-hover:scale-105 transition-transform duration-700">
                   <SacredImage 
                     src={saint.image || ''} 
                     alt={saint.name} 
                     className="w-full h-full" 
                     priority={true} 
                     liturgicalColor={gospel?.calendar?.color} 
                   />
                </div>
                <div className="space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.7em] text-gold">{saint.feastDay}</span>
                  <h3 className="text-3xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tighter">{saint.name}</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred mt-2">{saint.patronage}</p>
                </div>
                
                <button 
                  onClick={() => setIsSaintExpanded(!isSaintExpanded)} 
                  className="mt-10 px-12 py-5 bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-full text-[11px] font-black uppercase tracking-[0.6em] hover:bg-[#d4af37] hover:text-stone-900 transition-all flex items-center gap-4 shadow-sm border border-stone-100 dark:border-stone-700"
                >
                  {isSaintExpanded ? 'Ocultar Memorial' : 'Ver Biografia'}
                  <Icons.ArrowDown className={`w-4 h-4 transition-transform duration-500 ${isSaintExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {isSaintExpanded && (
                  <div className="mt-12 pt-12 border-t border-stone-50 dark:border-stone-800 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <p className="text-xl md:text-2xl font-serif italic text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line text-left border-l-4 border-gold/20 pl-8">
                      {saint.biography}
                    </p>
                    {saint.quote && (
                      <blockquote className="p-10 bg-[#fcf8e8] dark:bg-stone-800/50 rounded-[3rem] border-l-[12px] border-gold text-stone-800 dark:text-stone-100 font-serif italic text-xl md:text-2xl leading-snug text-left shadow-inner">
                        "{saint.quote}"
                      </blockquote>
                    )}
                  </div>
                )}
            </section>
          )}

          {/* Banner de Acesso à Biblioteca do Aquinate */}
          <section className="bg-sacred p-12 md:p-14 rounded-[4rem] text-white shadow-3xl space-y-8 group cursor-pointer hover:bg-[#1a1a1a] transition-all duration-700 overflow-hidden relative border-t-8 border-gold/20">
            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-5">
              <div className="p-4 bg-white/10 rounded-[1.5rem] w-fit">
                <Icons.Feather className="w-8 h-8 text-gold" />
              </div>
              <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-gold/70">Summa Theologiae</h4>
              <h3 className="text-4xl font-serif font-bold leading-tight tracking-tight">Investigue a Summa com Aquinate AI</h3>
              <p className="text-white/60 font-serif italic text-xl leading-relaxed">Respostas escolásticas fundamentadas na Tradição e no Magistério.</p>
              <button 
                onClick={() => onNavigate(AppRoute.AQUINAS)}
                className="mt-6 px-10 py-5 bg-gold text-stone-900 rounded-full font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
              >
                Acessar Disputatio
              </button>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
