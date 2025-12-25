
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDailyQuote, generateSpeech } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';

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
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadSaint = async () => {
    setLoading(prev => ({ ...prev, saint: true }));
    setErrors(prev => ({ ...prev, saint: false }));
    setImageError(false);
    try {
      const data = await getDailySaint();
      setSaint(data);
    } catch (e) {
      setErrors(prev => ({ ...prev, saint: true }));
    } finally {
      setLoading(prev => ({ ...prev, saint: false }));
    }
  };

  const loadGospel = async () => {
    setLoading(prev => ({ ...prev, gospel: true }));
    setErrors(prev => ({ ...prev, gospel: false }));
    try {
      const data = await getDailyGospel();
      setGospel(data);
    } catch (e) {
      setErrors(prev => ({ ...prev, gospel: true }));
    } finally {
      setLoading(prev => ({ ...prev, gospel: false }));
    }
  };

  const loadQuote = async () => {
    setLoading(prev => ({ ...prev, quote: true }));
    setErrors(prev => ({ ...prev, quote: false }));
    try {
      const data = await getDailyQuote();
      setDailyQuote(data);
    } catch (e) {
      setErrors(prev => ({ ...prev, quote: true }));
    } finally {
      setLoading(prev => ({ ...prev, quote: false }));
    }
  };

  useEffect(() => { 
    const init = async () => {
      loadSaint();
      await new Promise(r => setTimeout(r, 100));
      loadGospel();
      await new Promise(r => setTimeout(r, 100));
      loadQuote();
    };
    init();
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
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
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

  const liturgicalColor = gospel?.calendar?.color ? (LITURGY_COLORS[gospel.calendar.color] || '#d4af37') : '#d4af37';
  const saintImage = imageError || !saint?.image 
    ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=400" 
    : saint.image;

  const renderReadingBlock = (reading: LiturgyReading, id: string) => (
    <div key={id} className={`relative group/reading bg-white dark:bg-stone-900/40 p-8 md:p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-all ${isCompact ? 'p-6 rounded-[2rem]' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: liturgicalColor }} />
          <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] text-[#8b0000] dark:text-[#d4af37] ${isCompact ? 'text-[9px]' : ''}`}>
            {reading.title}
          </h4>
          <span className="text-[10px] text-stone-300 font-serif italic">({reading.reference})</span>
        </div>
        <button 
          onClick={() => toggleSpeech(reading, id)} 
          className={`p-4 rounded-full transition-all active:scale-95 ${playingId === id ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-stone-50 dark:bg-stone-800 text-[#d4af37] hover:bg-stone-100'} ${isCompact ? 'p-3' : ''}`}
        >
          {audioLoading === id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />}
        </button>
      </div>
      <p className={`font-serif italic leading-snug text-stone-900 dark:text-stone-100 tracking-tight ${isCompact ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>
        "{reading.text}"
      </p>
    </div>
  );

  return (
    <div className={`space-y-8 md:space-y-20 page-enter pb-24 px-4 md:px-0 transition-all duration-500 ${isCompact ? 'md:space-y-12' : ''}`}>
      
      {/* Botão Flutuante de Fixar App (Pin) no Header Desktop */}
      {!isCompact && (
        <div className="hidden lg:flex justify-end max-w-5xl mx-auto -mb-12">
           <button 
             onClick={onToggleCompact}
             className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full shadow-lg text-stone-400 hover:text-[#d4af37] transition-all group"
             title="Ativar Modo Foco (Modo Compacto)"
           >
              <Icons.Pin className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Fixar Vista</span>
           </button>
        </div>
      )}

      {/* Banner Litúrgico Superior */}
      {loading.gospel ? (
        <div className="max-w-5xl mx-auto h-24 bg-white/50 dark:bg-stone-900/50 rounded-[4rem] animate-pulse flex items-center px-10 gap-4">
            <div className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800" />
            <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded-full" />
        </div>
      ) : gospel?.calendar ? (
        <div className="animate-in slide-in-from-top duration-300">
          <div className={`flex flex-col md:flex-row items-center justify-center gap-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl p-5 md:p-6 rounded-[2.5rem] md:rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-2xl max-w-5xl mx-auto transition-all ${isCompact ? 'p-4 rounded-[2rem]' : ''}`}>
            <div className="flex items-center gap-4">
               <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: liturgicalColor }} />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400">
                    {gospel.calendar.season || "Tempo Comum"} • {gospel.calendar.week || "Semana Litúrgica"}
                  </span>
               </div>
            </div>
            <div className="hidden md:block h-10 w-px bg-stone-100 dark:bg-stone-800" />
            <div className="text-center md:text-left flex-1">
               <h2 className={`font-serif font-bold text-stone-900 dark:text-stone-100 leading-none transition-all ${isCompact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
                 {gospel.calendar.dayName || "Dia de Estudo"}
               </h2>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8b0000] dark:text-[#d4af37] mt-1">
                 {gospel.calendar.rank || "Féria"} • Ciclo {gospel.calendar.cycle || "B"}
               </p>
            </div>
          </div>
        </div>
      ) : null}

      {!isCompact && (
        <header className="text-center space-y-4 md:space-y-6 pt-4 animate-in fade-in duration-700">
          <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tighter leading-none select-none">
            Cathedra
          </h1>
          <p className="text-[#8b0000] dark:text-stone-400 font-serif italic text-2xl md:text-5xl opacity-80 max-w-2xl mx-auto leading-tight">
            A Verdade que Liberta.
          </p>
        </header>
      )}

      <div className={`grid lg:grid-cols-12 gap-8 md:gap-16 transition-all duration-500 ${isCompact ? 'lg:gap-8' : ''}`}>
        <div className={`${isCompact ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-12`}>
          
          {/* Busca Principal */}
          <section className={`bg-white dark:bg-stone-900 rounded-[3.5rem] md:rounded-[5rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group overflow-hidden transition-all ${isCompact ? 'p-6 rounded-[2rem] md:rounded-[3rem]' : 'p-8 md:p-14'}`}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
            <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="relative flex flex-col md:flex-row gap-6">
              <div className="relative flex-1">
                <Icons.Search className={`absolute left-6 top-1/2 -translate-y-1/2 text-[#d4af37] ${isCompact ? 'w-5 h-5' : 'w-6 h-6'}`} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar Verdades de Fé..." 
                  className={`w-full pl-16 pr-6 py-6 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-100 dark:border-stone-700 rounded-3xl md:rounded-full focus:ring-16 focus:ring-[#d4af37]/5 outline-none font-serif italic placeholder:text-stone-300 transition-all ${isCompact ? 'text-lg md:text-xl py-4' : 'text-xl md:text-3xl'}`}
                />
              </div>
              <button type="submit" className={`bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-10 py-6 rounded-3xl md:rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all ${isCompact ? 'py-4' : ''}`}>
                Explorar
              </button>
            </form>
          </section>

          {/* Liturgia Integral */}
          <section className="space-y-10">
            <div className="flex items-center gap-5 ml-4">
                <div className="p-4 bg-[#fcf8e8] dark:bg-stone-900 rounded-2xl shadow-sm border border-[#d4af37]/10">
                  <Icons.Book className="w-8 h-8 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Liturgia da Palavra</h4>
                  <p className="text-stone-900 dark:text-stone-100 font-serif italic text-lg">{gospel?.calendar?.dayName || "Hoje"}</p>
                </div>
            </div>

            {loading.gospel ? (
              <div className="space-y-8 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800" />
                ))}
              </div>
            ) : errors.gospel ? (
              <div className="bg-white dark:bg-stone-900 p-20 rounded-[4rem] text-center space-y-6">
                 <Icons.History className="w-16 h-16 text-[#d4af37] mx-auto opacity-20" />
                 <h3 className="text-2xl font-serif italic text-stone-500">Não foi possível carregar a liturgia.</h3>
                 <button onClick={loadGospel} className="px-10 py-4 bg-[#d4af37] text-stone-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Tentar Novamente</button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-1000">
                {gospel?.firstReading && renderReadingBlock(gospel.firstReading, '1a')}
                {gospel?.psalm && renderReadingBlock(gospel.psalm, 'salmo')}
                {gospel?.secondReading && renderReadingBlock(gospel.secondReading, '2a')}
                {gospel && renderReadingBlock({ title: 'Evangelho', reference: gospel.reference, text: gospel.text }, 'evangelho')}
                
                {gospel?.reflection && (
                  <div className={`mt-12 bg-[#fcf8e8] dark:bg-stone-900/60 p-10 md:p-14 rounded-[4rem] border-l-[12px] border-[#d4af37] shadow-xl relative overflow-hidden group transition-all ${isCompact ? 'p-8 rounded-[2rem]' : ''}`}>
                    <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                       <Icons.Feather className="w-48 h-48 text-[#8b0000]" />
                    </div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8b0000] dark:text-[#d4af37] mb-6 flex items-center gap-2">
                       Meditação do Dia
                    </h5>
                    <p className={`font-serif text-stone-700 dark:text-stone-300 leading-relaxed italic relative z-10 transition-all ${isCompact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
                      {gospel.reflection}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sabedoria dos Santos (Fica visível em Modo Compacto como card final) */}
            {isCompact && (
              <div className="bg-[#1a1a1a] p-10 rounded-[2.5rem] text-white min-h-[250px] flex flex-col justify-center relative overflow-hidden text-center shadow-2xl group border border-[#d4af37]/20">
                {loading.quote ? (
                   <div className="space-y-6 animate-pulse">
                      <div className="h-16 w-full bg-white/5 rounded-3xl" />
                   </div>
                ) : (
                  <>
                    <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <Icons.Feather className="w-48 h-48 text-[#d4af37]" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-[#d4af37] relative z-10 mb-8">Sabedoria dos Santos</h4>
                    <p className="text-xl md:text-2xl font-serif italic leading-snug relative z-10">"{dailyQuote?.quote || "Onde há amor e caridade, Deus aí está."}"</p>
                    <cite className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] block relative z-10 mt-6">— {dailyQuote?.author || "Ubi Caritas"}</cite>
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {!isCompact && (
          <aside className="lg:col-span-4 space-y-12 animate-in fade-in duration-1000">
            
            {/* Santo do Dia */}
            <div className="bg-white dark:bg-stone-900 p-10 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl text-center space-y-10 group relative overflow-hidden min-h-[500px] flex flex-col">
              {loading.saint ? (
                <div className="space-y-10 animate-pulse py-10">
                   <div className="w-48 h-48 rounded-full bg-stone-100 dark:bg-stone-800 mx-auto" />
                   <div className="h-8 w-2/3 bg-stone-100 dark:bg-stone-800 mx-auto rounded-full" />
                </div>
              ) : errors.saint ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                   <Icons.Users className="w-12 h-12 text-stone-200" />
                   <p className="text-stone-400 font-serif italic">Santo não carregado.</p>
                   <button onClick={loadSaint} className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">Tentar</button>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#fcf8e8]/30 to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full border-8 border-white dark:border-stone-800 shadow-2xl overflow-hidden mx-auto transform group-hover:scale-105 transition-transform duration-700 bg-stone-100 dark:bg-stone-800">
                      <img 
                          src={saintImage} 
                          className="w-full h-full object-cover" 
                          alt={saint?.name} 
                          onError={() => setImageError(true)}
                      />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-stone-900 px-6 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
                      Santo do Dia
                    </div>
                  </div>
                  <div className="space-y-3">
                      <h3 className="text-4xl font-serif font-bold dark:text-stone-200 tracking-tight">{saint?.name || "Santo Padroeiro"}</h3>
                      <p className="text-[#8b0000] dark:text-[#d4af37] text-[10px] font-black uppercase tracking-widest">{saint?.patronage || "Intercessor"}</p>
                  </div>
                  <p className={`text-stone-500 dark:text-stone-400 font-serif italic text-lg leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-4'}`}>
                    {saint?.biography || "Aguardando biografia completa."}
                  </p>
                  <button onClick={() => setIsExpanded(!isExpanded)} className="text-[11px] font-black uppercase tracking-[0.4em] text-[#8b0000] dark:text-[#d4af37] hover:scale-110 transition-transform active:scale-90">
                    {isExpanded ? 'Recolher' : 'Mergulhar na Vida'}
                  </button>
                </>
              )}
            </div>

            {/* Sabedoria */}
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
                  <p className="text-2xl md:text-3xl font-serif italic leading-snug relative z-10">"{dailyQuote?.quote || "Onde há amor e caridade, Deus aí está."}"</p>
                  <cite className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] block relative z-10 mt-6">— {dailyQuote?.author || "Ubi Caritas"}</cite>
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
