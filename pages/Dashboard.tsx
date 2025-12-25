
import React, { useState, useEffect, useRef, memo } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDailyQuote, generateSpeech, getLiturgyInsight } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';

// Componente de Imagem Sacra Resiliente
const SacredImage = memo(({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className={`relative bg-stone-100 dark:bg-stone-800 ${className} flex items-center justify-center overflow-hidden`}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center justify-center text-[#d4af37]/40 p-4 text-center">
          <Icons.Cross className="w-16 h-16 mb-2" />
          <span className="text-[8px] font-black uppercase tracking-widest">Santuário Digital</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
        />
      )}
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

const LITURGY_COLORS: Record<string, { main: string, gradient: string, glow: string }> = {
  green: { main: '#1b4d2e', gradient: 'from-[#1b4d2e]/10 to-[#1b4d2e]/5', glow: 'shadow-[0_0_30px_#1b4d2e44]' },
  purple: { main: '#5e2a84', gradient: 'from-[#5e2a84]/10 to-[#5e2a84]/5', glow: 'shadow-[0_0_30px_#5e2a8444]' },
  white: { main: '#d4af37', gradient: 'from-[#d4af37]/10 to-[#d4af37]/5', glow: 'shadow-[0_0_30px_#d4af3744]' },
  red: { main: '#a61c1c', gradient: 'from-[#a61c1c]/10 to-[#a61c1c]/5', glow: 'shadow-[0_0_30px_#a61c1c44]' },
  rose: { main: '#e07a9b', gradient: 'from-[#e07a9b]/10 to-[#e07a9b]/5', glow: 'shadow-[0_0_30px_#e07a9b44]' },
  black: { main: '#1a1a1a', gradient: 'from-[#1a1a1a]/10 to-[#1a1a1a]/5', glow: 'shadow-[0_0_30px_#1a1a1a44]' }
};

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user, isCompact, onToggleCompact }) => {
  const [saint, setSaint] = useState<Saint | null>(null);
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [loading, setLoading] = useState({ saint: true, gospel: true, quote: true });
  const [isSaintExpanded, setIsSaintExpanded] = useState(false);
  const [query, setQuery] = useState('');
  
  // Audio state
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Insight state
  const [insightLoading, setInsightLoading] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<{ reading: LiturgyReading, text: string } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadData = async () => {
    Promise.allSettled([
      getDailySaint().then(res => { setSaint(res); setLoading(p => ({ ...p, saint: false })); }),
      getDailyGospel().then(res => { setGospel(res); setLoading(p => ({ ...p, gospel: false })); }),
      getDailyQuote().then(res => { setDailyQuote(res); setLoading(p => ({ ...p, quote: false })); })
    ]);
  };

  useEffect(() => { 
    loadData();
    return () => stopAudio();
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
    if (playingId === id) {
      stopAudio();
      return;
    }
    stopAudio();
    setAudioLoading(id);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const fullText = `${reading.title}. ${reading.reference}. ${reading.text}`;
      const base64Audio = await generateSpeech(fullText);
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
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

  const handleShareQuote = () => {
    if (!dailyQuote) return;
    const text = `"${dailyQuote.quote}" — ${dailyQuote.author}\n\nEnviado via Cathedra Digital 🏛️`;
    if (navigator.share) {
      navigator.share({ title: 'Sabedoria dos Santos', text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Citação copiada para a área de transferência!");
    }
  };

  const lColors = gospel?.calendar?.color ? (LITURGY_COLORS[gospel.calendar.color] || LITURGY_COLORS.white) : LITURGY_COLORS.white;

  return (
    <div className="space-y-12 md:space-y-20 page-enter pb-32">
      
      {/* 1. HERO LITÚRGICO: O Coração do Dia */}
      <section className={`relative overflow-hidden rounded-[3rem] md:rounded-[4rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl transition-all duration-700`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${lColors.gradient} opacity-50`} />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Icons.Cross className="w-96 h-96" />
        </div>

        <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-shrink-0 relative">
             <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-xl border-8 border-stone-50 dark:border-stone-700 relative z-20 overflow-hidden`}>
                <div className={`w-full h-full animate-pulse transition-colors duration-1000 ${lColors.glow}`} style={{ backgroundColor: lColors.main }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icons.Cross className="w-12 h-12 text-white/40" />
                </div>
             </div>
             <div className={`absolute inset-0 rounded-full animate-ping opacity-20`} style={{ backgroundColor: lColors.main }} />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Tempo da Igreja</span>
              <div className="h-1 w-1 rounded-full bg-stone-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37]">{gospel?.calendar?.season}</span>
            </div>
            
            {loading.gospel ? (
              <div className="space-y-4">
                <div className="h-12 w-3/4 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse mx-auto md:mx-0" />
                <div className="h-6 w-1/2 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse mx-auto md:mx-0" />
              </div>
            ) : (
              <>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {gospel?.calendar?.dayName}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <span className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-[#d4af37] dark:text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                    {gospel?.calendar?.rank}
                  </span>
                  <span className="px-6 py-2 border border-stone-200 dark:border-stone-700 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-500">
                    Ciclo {gospel?.calendar?.cycle} • {gospel?.calendar?.week}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="hidden lg:block w-px h-32 bg-stone-100 dark:bg-stone-800" />
          
          <div className="hidden lg:flex flex-col gap-4 text-center md:text-left">
             <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Intenção de Oração</p>
             <p className="text-lg font-serif italic text-stone-500 max-w-[200px]">"Pela unidade de todos os cristãos na verdade."</p>
          </div>
        </div>
      </section>

      {/* 2. BUSCA INTELIGENTE: Integrada */}
      <section className="max-w-4xl mx-auto -mt-20 relative z-20 px-4">
        <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="bg-white dark:bg-stone-900 p-4 rounded-[2.5rem] shadow-3xl border border-stone-100 dark:border-stone-800 flex items-center gap-4">
          <div className="flex-1 relative">
            <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#d4af37] w-6 h-6" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que deseja investigar hoje? (ex: Eucaristia, Purgatório...)" 
              className="w-full pl-16 pr-6 py-6 bg-stone-50 dark:bg-stone-800 dark:text-white rounded-[2rem] outline-none font-serif italic text-xl transition-all"
            />
          </div>
          <button type="submit" className="bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-10 py-6 rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all">
            Explorar
          </button>
        </form>
      </section>

      {/* 3. CITAÇÃO DO DIA (SENTENTIA DIEI) - NOVO COMPONENTE DE ALTO IMPACTO */}
      <section className="px-4 md:px-0">
        <div className="bg-[#1a1a1a] dark:bg-[#d4af37] p-10 md:p-16 rounded-[4rem] shadow-3xl relative overflow-hidden group">
          {/* Background Decorativo */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/20 to-transparent opacity-50" />
          <Icons.Feather className="absolute -bottom-10 -right-10 w-64 h-64 text-[#d4af37]/10 dark:text-stone-900/10 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-shrink-0">
               <div className="p-8 bg-white/5 dark:bg-stone-900/10 rounded-[2.5rem] border border-white/10 dark:border-stone-900/10 shadow-inner">
                  <Icons.Feather className="w-12 h-12 text-[#d4af37] dark:text-stone-900" />
               </div>
            </div>

            <div className="flex-1 space-y-6 text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#d4af37]/60 dark:text-stone-900/60">Sententia Diei</span>
              
              {loading.quote ? (
                <div className="space-y-4">
                  <div className="h-10 w-full bg-white/5 dark:bg-stone-900/5 rounded-2xl animate-pulse" />
                  <div className="h-10 w-4/6 bg-white/5 dark:bg-stone-900/5 rounded-2xl animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <span className="absolute -top-10 -left-6 text-7xl md:text-9xl text-[#d4af37]/20 dark:text-stone-900/10 font-serif leading-none italic pointer-events-none">“</span>
                    <p className="text-2xl md:text-5xl font-serif italic text-white dark:text-stone-900 leading-tight tracking-tight relative z-10">
                      {dailyQuote?.quote}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                    <cite className="text-[12px] font-black uppercase tracking-[0.4em] text-[#d4af37] dark:text-stone-900">— {dailyQuote?.author}</cite>
                    <div className="h-px w-12 bg-white/10 dark:bg-stone-900/10" />
                    <button 
                      onClick={handleShareQuote}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 dark:text-stone-900/40 hover:text-[#d4af37] dark:hover:text-stone-900 transition-colors"
                    >
                      <Icons.Globe className="w-4 h-4" />
                      Partilhar Sabedoria
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. GRID PRINCIPAL: Santo e Evangelho */}
      <div className="grid lg:grid-cols-12 gap-8 md:gap-12 px-4 md:px-0">
        
        {/* Coluna do Evangelho e Meditação */}
        <main className="lg:col-span-8 space-y-10 order-2 lg:order-1">
          <div className="flex items-center justify-between ml-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Liturgia da Palavra</h4>
            <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800 mx-8" />
          </div>

          {loading.gospel ? (
            <div className="space-y-8 animate-pulse">
               <div className="h-80 bg-white dark:bg-stone-900 rounded-[3rem]" />
               <div className="h-64 bg-white dark:bg-stone-900 rounded-[3rem]" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Card do Evangelho */}
              <article className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 relative group transition-all hover:shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl text-[#8b0000]">
                      <Icons.Book className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Evangelho de Hoje</h5>
                      <p className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{gospel?.reference}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => toggleSpeech({ title: 'Evangelho', reference: gospel!.reference, text: gospel!.text }, 'gospel')} className={`p-4 rounded-full transition-all ${playingId === 'gospel' ? 'bg-[#8b0000] text-white' : 'bg-stone-50 dark:bg-stone-800 text-[#d4af37]'}`}>
                        {audioLoading === 'gospel' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-5 h-5" />}
                     </button>
                  </div>
                </div>

                <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug tracking-tight">
                  "{gospel?.text}"
                </p>

                {/* Grounding Sources */}
                {gospel?.sources && gospel.sources.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-stone-50 dark:border-stone-800 flex flex-wrap gap-2">
                    {gospel.sources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-[#d4af37] transition-colors">{s.title}</a>
                    ))}
                  </div>
                )}
              </article>

              {/* Card da Meditação */}
              <article className="bg-[#fcf8e8] dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] border-l-[12px] border-[#d4af37] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
                  <Icons.Feather className="w-48 h-48" />
                </div>
                <header className="mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8b0000]">Reflexão do Cathedra AI</span>
                </header>
                <div className="prose dark:prose-invert max-w-none">
                   <p className="text-xl md:text-2xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed italic whitespace-pre-wrap">
                     {gospel?.reflection}
                   </p>
                </div>
              </article>
            </div>
          )}
        </main>

        {/* Coluna Lateral: Santo e Sabedoria */}
        <aside className="lg:col-span-4 space-y-10 order-1 lg:order-2">
          <div className="flex items-center gap-4 ml-4 lg:hidden">
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Hagiografia</h4>
            <div className="h-px flex-1 bg-stone-100" />
          </div>

          {/* Card do Santo do Dia */}
          <section className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl text-center flex flex-col items-center group overflow-hidden">
            {loading.saint ? (
               <div className="space-y-10 animate-pulse w-full">
                  <div className="w-32 h-32 rounded-full bg-stone-100 mx-auto" />
                  <div className="h-8 w-2/3 bg-stone-100 mx-auto rounded-full" />
                  <div className="h-24 w-full bg-stone-50 rounded-3xl" />
               </div>
            ) : (
              <>
                <div className="relative mb-8">
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-white dark:border-stone-800 shadow-2xl overflow-hidden relative z-10">
                      <SacredImage src={saint?.image || ''} alt={saint?.name || ''} className="w-full h-full" />
                   </div>
                   <div className="absolute -inset-4 rounded-full border-2 border-dashed border-[#d4af37]/20 group-hover:rotate-180 transition-transform duration-[10s] linear infinite" />
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#d4af37] text-stone-900 px-5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg z-20">
                      Santo do Dia
                   </div>
                </div>

                <div className="space-y-4 mb-8">
                   <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{saint?.name}</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b0000]">{saint?.patronage}</p>
                </div>

                <div className={`space-y-6 transition-all duration-700 ${isSaintExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-24 opacity-60 overflow-hidden'}`}>
                   <p className="text-lg font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed">
                     {saint?.biography}
                   </p>
                   {saint?.quote && (
                     <blockquote className="p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl border-l-4 border-[#d4af37]">
                        <p className="text-stone-700 dark:text-stone-300 italic font-serif leading-snug">"{saint.quote}"</p>
                     </blockquote>
                   )}
                </div>

                <button 
                  onClick={() => setIsSaintExpanded(!isSaintExpanded)}
                  className="mt-8 text-[11px] font-black uppercase tracking-widest text-[#d4af37] hover:text-[#8b0000] transition-colors"
                >
                  {isSaintExpanded ? 'Recolher Biografia' : 'Ler Biografia Completa'}
                </button>
              </>
            )}
          </section>

          {/* Banner de Comunidade */}
          <section className="bg-stone-50 dark:bg-stone-900 p-10 rounded-[3.5rem] border border-stone-200 dark:border-stone-800 shadow-xl text-center space-y-6 group cursor-pointer hover:bg-white dark:hover:bg-stone-800 transition-all">
             <div className="w-16 h-16 bg-white dark:bg-stone-950 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                <Icons.Users className="w-8 h-8 text-[#d4af37]" />
             </div>
             <div className="space-y-2">
                <h5 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">Aula Magna</h5>
                <p className="text-xs text-stone-400 font-serif italic">Participe dos debates teológicos com outros fiéis.</p>
             </div>
             <button onClick={() => onNavigate(AppRoute.COMMUNITY)} className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8b0000] hover:text-[#d4af37] transition-colors">Acessar Fórum</button>
          </section>
        </aside>

      </div>

      {/* Insight Modal */}
      {activeInsight && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setActiveInsight(null)}>
           <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-4xl rounded-[4rem] p-10 md:p-16 shadow-3xl border-t-[16px] border-[#d4af37] relative overflow-hidden flex flex-col max-h-[85vh] scroll-smooth" onClick={e => e.stopPropagation()}>
              <button onClick={() => setActiveInsight(null)} className="absolute top-8 right-8 p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-[#8b0000] hover:text-white transition-all z-20">
                <Icons.Cross className="w-6 h-6 rotate-45" />
              </button>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
                <header className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Luz da Tradição</span>
                  <h3 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {activeInsight.reading.title}
                  </h3>
                  <p className="text-[#8b0000] dark:text-stone-400 text-[10px] font-black uppercase tracking-widest">{activeInsight.reading.reference}</p>
                </header>
                <div className="p-8 bg-stone-50 dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-inner">
                   <p className="text-xl italic font-serif text-stone-500 dark:text-stone-400 leading-relaxed">"{activeInsight.reading.text}"</p>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                   <div className="text-lg md:text-2xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                      {activeInsight.text}
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
