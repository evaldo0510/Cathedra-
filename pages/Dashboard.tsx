
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

const LITURGY_COLORS: Record<string, string> = {
  green: '#1b4d2e',
  purple: '#5e2a84',
  white: '#d4af37',
  red: '#a61c1c',
  rose: '#e07a9b',
  black: '#1a1a1a'
};

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user, isCompact, onToggleCompact }) => {
  const [saint, setSaint] = useState<Saint | null>(null);
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [loading, setLoading] = useState({ saint: true, gospel: true, quote: true });
  const [errors, setErrors] = useState({ saint: false, gospel: false, quote: false });
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  
  // Audio state
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Insight state
  const [insightLoading, setInsightLoading] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<{ reading: LiturgyReading, text: string } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Carregamento Paralelo para Performance Máxima
  const loadData = async () => {
    Promise.allSettled([
      getDailySaint().then(res => { setSaint(res); setLoading(p => ({ ...p, saint: false })); }).catch(() => setErrors(p => ({ ...p, saint: true }))),
      getDailyGospel().then(res => { setGospel(res); setLoading(p => ({ ...p, gospel: false })); }).catch(() => setErrors(p => ({ ...p, gospel: true }))),
      getDailyQuote().then(res => { setDailyQuote(res); setLoading(p => ({ ...p, quote: false })); }).catch(() => setErrors(p => ({ ...p, quote: true })))
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

  const handleOpenInsight = async (reading: LiturgyReading, id: string) => {
    setInsightLoading(id);
    setActiveInsight(null); // Reset modal content
    try {
      const insight = await getLiturgyInsight(reading.title, reading.reference, reading.text);
      setActiveInsight({ reading, text: insight });
    } catch (err) {
      console.error(err);
    } finally {
      setInsightLoading(null);
    }
  };

  const liturgicalColor = gospel?.calendar?.color ? (LITURGY_COLORS[gospel.calendar.color] || '#d4af37') : '#d4af37';

  const renderReadingBlock = (reading: LiturgyReading, id: string) => (
    <div key={id} className={`relative bg-white dark:bg-stone-900/40 p-8 md:p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-all ${isCompact ? 'p-6 rounded-[2rem]' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: liturgicalColor }} />
          <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] text-[#8b0000] dark:text-[#d4af37] ${isCompact ? 'text-[9px]' : ''}`}>
            {reading.title}
          </h4>
          <span className="text-[10px] text-stone-300 font-serif italic">({reading.reference})</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleOpenInsight(reading, id)} 
            className={`p-4 rounded-full transition-all active:scale-95 ${insightLoading === id ? 'animate-pulse bg-[#fcf8e8] text-[#d4af37]' : 'bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-[#d4af37]'}`}
          >
            {insightLoading === id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => toggleSpeech(reading, id)} 
            className={`p-4 rounded-full transition-all active:scale-95 ${playingId === id ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-stone-50 dark:bg-stone-800 text-[#d4af37] hover:bg-stone-100'}`}
          >
            {audioLoading === id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <p className={`font-serif italic leading-snug text-stone-900 dark:text-stone-100 tracking-tight ${isCompact ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>
        "{reading.text}"
      </p>
    </div>
  );

  return (
    <div className={`space-y-8 md:space-y-20 page-enter pb-24 px-4 md:px-0 transition-all duration-500 ${isCompact ? 'md:space-y-12' : ''}`}>
      
      {/* Insight Modal */}
      {activeInsight && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setActiveInsight(null)}>
           <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-4xl rounded-[4rem] p-10 md:p-16 shadow-3xl border-t-[16px] border-[#d4af37] relative overflow-hidden flex flex-col max-h-[85vh] scroll-smooth" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setActiveInsight(null)}
                className="absolute top-8 right-8 p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-[#8b0000] hover:text-white transition-all z-20"
              >
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

      {/* Liturgy Banner */}
      <div className="animate-in slide-in-from-top duration-300">
        <div className={`flex flex-col md:flex-row items-center justify-center gap-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl p-5 md:p-6 rounded-[2.5rem] md:rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-2xl max-w-5xl mx-auto transition-all ${isCompact ? 'p-4 rounded-[2rem]' : ''}`}>
          {loading.gospel ? (
            <div className="w-full flex items-center justify-center h-10 gap-4 animate-pulse">
              <div className="w-5 h-5 rounded-full bg-stone-200" />
              <div className="h-4 w-40 bg-stone-200 rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                 <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: liturgicalColor }} />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">
                   {gospel?.calendar?.season} • {gospel?.calendar?.week}
                 </span>
              </div>
              <div className="hidden md:block h-10 w-px bg-stone-100 dark:bg-stone-800" />
              <div className="text-center md:text-left flex-1">
                 <h2 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-xl">
                   {gospel?.calendar?.dayName}
                 </h2>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8b0000] dark:text-[#d4af37] mt-1">
                   {gospel?.calendar?.rank} • Ciclo {gospel?.calendar?.cycle}
                 </p>
              </div>
            </>
          )}
        </div>
      </div>

      {!isCompact && (
        <header className="text-center space-y-4 md:space-y-6 pt-4 animate-in fade-in duration-700">
          <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tighter leading-none">
            Cathedra
          </h1>
          <p className="text-[#8b0000] dark:text-stone-400 font-serif italic text-2xl md:text-5xl opacity-80 max-w-2xl mx-auto leading-tight">
            A Verdade que Liberta.
          </p>
        </header>
      )}

      <div className={`grid lg:grid-cols-12 gap-8 md:gap-16 ${isCompact ? 'lg:gap-8' : ''}`}>
        <div className={`${isCompact ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-12`}>
          
          <section className={`bg-white dark:bg-stone-900 rounded-[3.5rem] md:rounded-[5rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group overflow-hidden transition-all ${isCompact ? 'p-6 rounded-[2rem]' : 'p-8 md:p-14'}`}>
            <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="relative flex flex-col md:flex-row gap-6">
              <div className="relative flex-1">
                <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#d4af37] w-6 h-6" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar Verdades de Fé..." 
                  className="w-full pl-16 pr-6 py-6 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-100 dark:border-stone-700 rounded-3xl outline-none font-serif italic text-2xl shadow-inner transition-all placeholder:text-stone-300"
                />
              </div>
              <button type="submit" className="bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95">
                Explorar
              </button>
            </form>
          </section>

          <section className="space-y-10">
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400 ml-4">Liturgia da Palavra</h4>
            {loading.gospel ? (
              <div className="space-y-8 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white dark:bg-stone-900 rounded-[3rem]" />)}
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-1000">
                {gospel?.firstReading && renderReadingBlock(gospel.firstReading, '1a')}
                {gospel?.psalm && renderReadingBlock(gospel.psalm, 'salmo')}
                {gospel && renderReadingBlock({ title: 'Evangelho', reference: gospel.reference, text: gospel.text }, 'evangelho')}
                
                {gospel?.reflection && (
                  <div className={`mt-12 bg-[#fcf8e8] dark:bg-stone-900/60 p-10 md:p-14 rounded-[4rem] border-l-[12px] border-[#d4af37] shadow-xl relative overflow-hidden group`}>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8b0000] dark:text-[#d4af37] mb-6">Meditação do Dia</h5>
                    <p className="font-serif text-stone-700 dark:text-stone-300 leading-relaxed italic text-xl md:text-2xl">
                      {gospel.reflection}
                    </p>
                    {/* Search Grounding Sources for Gospel */}
                    {gospel.sources && gospel.sources.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-stone-200/30">
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-3">Fontes de Grounding</p>
                        <div className="flex flex-wrap gap-2">
                          {gospel.sources.map((s, idx) => (
                            <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-white/50 dark:bg-stone-800 px-3 py-1 rounded-full text-[#d4af37] hover:underline flex items-center gap-1">
                              <Icons.ExternalLink className="w-2 h-2" /> {s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {!isCompact && (
          <aside className="lg:col-span-4 space-y-12 animate-in fade-in duration-1000">
            
            {/* Saint of the Day with SacredImage */}
            <div className="bg-white dark:bg-stone-900 p-10 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl text-center space-y-10 group relative overflow-hidden flex flex-col">
              {loading.saint ? (
                <div className="space-y-10 animate-pulse py-10">
                   <div className="w-48 h-48 rounded-full bg-stone-100 mx-auto" />
                   <div className="h-8 w-2/3 bg-stone-100 mx-auto rounded-full" />
                </div>
              ) : errors.saint ? (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
                   <Icons.Cross className="w-16 h-16 opacity-20" />
                   <p className="font-serif italic mt-4">Santo não carregado</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full border-8 border-white dark:border-stone-800 shadow-2xl overflow-hidden mx-auto transform group-hover:scale-105 transition-transform duration-700">
                      <SacredImage src={saint?.image || ''} alt={saint?.name || 'Santo'} className="w-full h-full" />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-stone-900 px-6 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
                      Santo do Dia
                    </div>
                  </div>
                  <div className="space-y-3">
                      <h3 className="text-4xl font-serif font-bold dark:text-stone-200 tracking-tight">{saint?.name}</h3>
                      <p className="text-[#8b0000] dark:text-[#d4af37] text-[10px] font-black uppercase tracking-widest">{saint?.patronage}</p>
                  </div>
                  <p className={`text-stone-500 dark:text-stone-400 font-serif italic text-lg leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-4'}`}>
                    {saint?.biography}
                  </p>
                  
                  {/* Search Grounding Sources for Saint */}
                  {saint?.sources && saint.sources.length > 0 && (
                    <div className="pt-4 text-left">
                      <p className="text-[7px] font-black uppercase tracking-widest text-stone-400 mb-2">Verificado via:</p>
                      <div className="flex flex-wrap gap-1">
                        {saint.sources.map((s, idx) => (
                          <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] text-[#d4af37] hover:underline truncate max-w-full">
                            {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => setIsExpanded(!isExpanded)} className="text-[11px] font-black uppercase tracking-[0.4em] text-[#8b0000] dark:text-[#d4af37] hover:scale-110 transition-transform">
                    {isExpanded ? 'Recolher' : 'Mergulhar na Vida'}
                  </button>
                </>
              )}
            </div>

            {/* Wisdom Quote */}
            <div className="bg-[#1a1a1a] p-12 rounded-[4rem] text-white min-h-[300px] flex flex-col justify-center relative overflow-hidden text-center shadow-2xl group">
              {loading.quote ? (
                 <div className="space-y-6 animate-pulse">
                    <div className="h-20 w-full bg-white/5 rounded-3xl" />
                 </div>
              ) : (
                <>
                  <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                      <Icons.Feather className="w-64 h-64 text-[#d4af37]" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-[#d4af37] relative z-10 mb-8">Sabedoria dos Santos</h4>
                  <p className="text-2xl md:text-3xl font-serif italic leading-snug relative z-10">"{dailyQuote?.quote}"</p>
                  <cite className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] block relative z-10 mt-6">— {dailyQuote?.author}</cite>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
