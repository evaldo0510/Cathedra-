
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDailyQuote, generateSpeech } from '../services/gemini';
import { Saint, Gospel, AppRoute, User, LiturgyReading } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';

interface DashboardProps {
  onSearch: (topic: string) => void;
  onNavigate: (route: AppRoute) => void;
  user: User | null;
}

const LITURGY_COLORS: Record<string, string> = {
  green: '#1b4d2e',
  purple: '#5e2a84',
  white: '#d4af37',
  red: '#a61c1c',
  rose: '#e07a9b',
  black: '#1a1a1a'
};

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user }) => {
  const [saint, setSaint] = useState<Saint | null>(null);
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [loading, setLoading] = useState({ saint: true, gospel: true, quote: true });
  const [errors, setErrors] = useState({ saint: false, gospel: false, quote: false });
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [activeReading, setActiveReading] = useState<'1a' | 'salmo' | '2a' | 'evangelho'>('evangelho');
  const [audioLoading, setAudioLoading] = useState(false);
  const [isReadingAudio, setIsReadingAudio] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadSaint = async () => {
    setLoading(prev => ({ ...prev, saint: true }));
    setErrors(prev => ({ ...prev, saint: false }));
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
      // Dispara em paralelo mas com um stagger muito curto (150ms) para evitar bloqueio de cota
      // mas parecer instantâneo para o usuário.
      loadSaint();
      await new Promise(r => setTimeout(r, 150));
      loadGospel();
      await new Promise(r => setTimeout(r, 150));
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
    setIsReadingAudio(false);
  };

  const toggleReadingSpeech = async (reading: LiturgyReading) => {
    if (isReadingAudio || audioLoading) {
      stopAudio();
      return;
    }
    setAudioLoading(true);
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
      source.onended = () => setIsReadingAudio(false);
      
      setAudioLoading(false);
      setIsReadingAudio(true);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      setAudioLoading(false);
      stopAudio();
    }
  };

  const currentReading = (): LiturgyReading | undefined => {
    if (!gospel) return undefined;
    switch (activeReading) {
      case '1a': return gospel.firstReading;
      case 'salmo': return gospel.psalm;
      case '2a': return gospel.secondReading;
      case 'evangelho': return { title: 'Evangelho', reference: gospel.reference, text: gospel.text };
    }
  };

  const liturgicalColor = gospel?.calendar?.color ? LITURGY_COLORS[gospel.calendar.color] : '#d4af37';

  return (
    <div className="space-y-8 md:space-y-20 page-enter pb-24 px-4 md:px-0">
      
      {/* Banner Litúrgico Superior */}
      {loading.gospel ? (
        <div className="max-w-5xl mx-auto h-24 bg-white/50 dark:bg-stone-900/50 rounded-[4rem] animate-pulse flex items-center px-10 gap-4">
            <div className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800" />
            <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded-full" />
        </div>
      ) : gospel?.calendar ? (
        <div className="animate-in slide-in-from-top duration-300">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl p-5 md:p-6 rounded-[2.5rem] md:rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-2xl max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
               <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: liturgicalColor }} />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400">
                    {gospel.calendar.season} • {gospel.calendar.week}
                  </span>
               </div>
            </div>
            <div className="hidden md:block h-10 w-px bg-stone-100 dark:bg-stone-800" />
            <div className="text-center md:text-left flex-1">
               <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">
                 {gospel.calendar.dayName}
               </h2>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8b0000] dark:text-[#d4af37] mt-1">
                 {gospel.calendar.rank} • Ciclo {gospel.calendar.cycle}
               </p>
            </div>
          </div>
        </div>
      ) : null}

      <header className="text-center space-y-4 md:space-y-6 pt-4">
        <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tighter leading-none select-none">
          Cathedra
        </h1>
        <p className="text-[#8b0000] dark:text-stone-400 font-serif italic text-2xl md:text-5xl opacity-80 max-w-2xl mx-auto leading-tight">
          Sabedoria Eterna em suas mãos.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 md:gap-16">
        <div className="lg:col-span-8 space-y-12">
          
          {/* Busca Principal */}
          <section className="bg-white dark:bg-stone-900 p-8 md:p-14 rounded-[3.5rem] md:rounded-[5rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
            <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="relative flex flex-col md:flex-row gap-6">
              <div className="relative flex-1">
                <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#d4af37]" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar Verdades de Fé..." 
                  className="w-full pl-16 pr-6 py-6 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-100 dark:border-stone-700 rounded-3xl md:rounded-full focus:ring-16 focus:ring-[#d4af37]/5 outline-none text-xl md:text-3xl font-serif italic placeholder:text-stone-300 transition-all"
                />
              </div>
              <button type="submit" className="bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-10 py-6 rounded-3xl md:rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all">
                Explorar
              </button>
            </form>
          </section>

          {/* Liturgia */}
          <section className="bg-white dark:bg-stone-900 p-8 md:p-16 rounded-[4rem] md:rounded-[6rem] border border-stone-100 dark:border-stone-800 shadow-2xl relative min-h-[500px] flex flex-col">
            {loading.gospel ? (
              <div className="space-y-12 p-8 animate-pulse">
                <div className="h-10 w-1/3 bg-stone-100 dark:bg-stone-800 rounded-full" />
                <div className="h-40 w-full bg-stone-50 dark:bg-stone-800/50 rounded-[4rem]" />
              </div>
            ) : errors.gospel ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-6">
                 <div className="w-20 h-20 rounded-full bg-[#fcf8e8] dark:bg-stone-800 flex items-center justify-center border border-[#d4af37]/20">
                   <Icons.History className="w-10 h-10 text-[#d4af37]" />
                 </div>
                 <h3 className="text-3xl font-serif italic text-stone-500">Não foi possível carregar a liturgia.</h3>
                 <button 
                  onClick={loadGospel} 
                  className="px-12 py-4 bg-[#d4af37] text-stone-900 rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95"
                 >
                   Tentar Novamente
                 </button>
              </div>
            ) : (
              <>
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-stone-50 dark:border-stone-800 pb-8">
                  <div className="flex items-center gap-5">
                      <div className="p-4 bg-[#fcf8e8] dark:bg-stone-800 rounded-2xl">
                        <Icons.Book className="w-8 h-8 text-[#d4af37]" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Liturgia da Palavra</h4>
                        <p className="text-stone-900 dark:text-stone-100 font-serif italic text-lg">{gospel?.calendar?.dayName}</p>
                      </div>
                  </div>
                  
                  <div className="flex p-1.5 bg-stone-50 dark:bg-stone-800 rounded-full gap-1 overflow-x-auto no-scrollbar shadow-inner">
                      {gospel?.firstReading && (
                        <button onClick={() => { stopAudio(); setActiveReading('1a'); }} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeReading === '1a' ? 'bg-white dark:bg-stone-700 text-[#8b0000] dark:text-[#d4af37] shadow-md' : 'text-stone-400 hover:text-stone-600'}`}>1ª Leit.</button>
                      )}
                      {gospel?.psalm && (
                        <button onClick={() => { stopAudio(); setActiveReading('salmo'); }} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeReading === 'salmo' ? 'bg-white dark:bg-stone-700 text-[#8b0000] dark:text-[#d4af37] shadow-md' : 'text-stone-400 hover:text-stone-600'}`}>Salmo</button>
                      )}
                      {gospel?.secondReading && (
                        <button onClick={() => { stopAudio(); setActiveReading('2a'); }} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeReading === '2a' ? 'bg-white dark:bg-stone-700 text-[#8b0000] dark:text-[#d4af37] shadow-md' : 'text-stone-400 hover:text-stone-600'}`}>2ª Leit.</button>
                      )}
                      <button onClick={() => { stopAudio(); setActiveReading('evangelho'); }} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeReading === 'evangelho' ? 'bg-white dark:bg-stone-700 text-[#8b0000] dark:text-[#d4af37] shadow-md' : 'text-stone-400 hover:text-stone-600'}`}>Evangelho</button>
                  </div>
                </header>
                
                <div className="min-h-[400px] flex flex-col justify-between animate-in fade-in duration-300" key={activeReading}>
                  {currentReading() ? (
                    <>
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-[#8b0000] dark:text-[#d4af37] uppercase tracking-[0.3em] bg-stone-50 dark:bg-stone-800 px-4 py-1 rounded-full">{currentReading()?.reference}</span>
                          <button 
                            onClick={() => toggleReadingSpeech(currentReading()!)} 
                            className={`p-5 rounded-full transition-all shadow-lg active:scale-95 ${isReadingAudio ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-stone-50 dark:bg-stone-800 text-[#d4af37] hover:bg-stone-100'}`}
                          >
                            {audioLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-6 h-6" />}
                          </button>
                        </div>
                        <p className="font-serif italic text-3xl md:text-5xl leading-tight text-stone-900 dark:text-stone-100 tracking-tight">
                          "{currentReading()?.text}"
                        </p>
                      </div>
                      
                      {activeReading === 'evangelho' && gospel?.reflection && (
                        <div className="mt-16 pt-12 border-t border-stone-50 dark:border-stone-800 group/reflection">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-6 text-center md:text-left flex items-center gap-2">
                             <Icons.Feather className="w-4 h-4 text-[#d4af37]" />
                             Meditação do Dia
                          </h5>
                          <p className="font-serif text-xl md:text-2xl text-stone-600 dark:text-stone-400 leading-relaxed italic border-l-4 border-[#d4af37]/20 pl-8 group-hover/reflection:border-[#d4af37]/50 transition-colors">
                            {gospel.reflection}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center opacity-30 py-20">
                      <Icons.Book className="w-20 h-20 mb-6 text-stone-300" />
                      <p className="text-2xl font-serif italic text-stone-400">Leitura não disponível para este dia.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-12">
          
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
                  <div className="w-48 h-48 rounded-full border-8 border-white dark:border-stone-800 shadow-2xl overflow-hidden mx-auto transform group-hover:scale-105 transition-transform duration-700">
                    <img 
                        src={saint?.image || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=400"} 
                        className="w-full h-full object-cover" 
                        alt={saint?.name} 
                    />
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
                <p className="text-2xl md:text-3xl font-serif italic leading-snug relative z-10">"{dailyQuote?.quote}"</p>
                <cite className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] block relative z-10 mt-6">— {dailyQuote?.author}</cite>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
