
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDogmas, getDailyQuote, generateSpeech } from '../services/gemini';
import { Saint, Gospel, Dogma, AppRoute, User } from '../types';
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

const TRILHAS = [
  { title: 'Iniciação Cristã', desc: 'Fundamentos da fé.', route: AppRoute.CATECHISM, icon: Icons.Cross },
  { title: 'Bíblia', desc: 'Reflexão sobre a Palavra.', route: AppRoute.BIBLE, icon: Icons.Book },
  { title: 'Defesa da Fé', desc: 'Apologética atual.', route: AppRoute.DOGMAS, icon: Icons.Feather },
];

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user }) => {
  const [saint, setSaint] = useState<Saint | null>(null);
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [isReadingGospel, setIsReadingGospel] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadData = async () => {
    setLoadingDaily(true);
    try {
      const [s, g, q] = await Promise.all([
        getDailySaint().catch(() => null),
        getDailyGospel().catch(() => null),
        getDailyQuote().catch(() => null)
      ]);
      setSaint(s);
      setGospel(g);
      setDailyQuote(q);
      setLoadingDaily(false);
    } catch (err) {
      setLoadingDaily(false);
    }
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
    setIsReadingGospel(false);
    setAudioLoading(false);
  };

  const toggleGospelSpeech = async () => {
    if (isReadingGospel || audioLoading) {
      stopAudio();
      return;
    }
    if (!gospel?.text) return;
    setAudioLoading(true);
    try {
      const fullText = `Leitura do Santo Evangelho. ${gospel.reference}. ${gospel.text}`;
      const base64Audio = await generateSpeech(fullText);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReadingGospel(false);
      setAudioLoading(false);
      setIsReadingGospel(true);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      setAudioLoading(false);
      stopAudio();
    }
  };

  const liturgicalColor = gospel?.calendar?.color ? LITURGY_COLORS[gospel.calendar.color] : '#d4af37';

  return (
    <div className="space-y-8 md:space-y-20 page-enter pb-24 px-4 md:px-0">
      {/* Status Litúrgico Mobile Friendly */}
      {!loadingDaily && gospel?.calendar && (
        <div className="animate-in slide-in-from-top duration-700">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl p-5 md:p-6 rounded-3xl md:rounded-[3rem] border border-stone-200 dark:border-stone-800 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
               <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: liturgicalColor }} />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">
                    {gospel.calendar.season}
                  </span>
               </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-stone-100 dark:bg-stone-800" />
            <div className="text-center md:text-left">
               <span className="text-sm font-serif font-bold text-stone-800 dark:text-stone-200">
                 {gospel.calendar.dayName}
               </span>
            </div>
            <div className="hidden md:block h-8 w-px bg-stone-100 dark:bg-stone-800" />
            <span className="px-4 py-1 bg-[#fcf8e8] dark:bg-stone-800 text-[#8b0000] dark:text-[#d4af37] rounded-full text-[9px] font-black uppercase tracking-widest">
              {gospel.calendar.cycle} • {gospel.calendar.rank}
            </span>
          </div>
        </div>
      )}

      <header className="text-center space-y-4 md:space-y-6 pt-4">
        <h1 className="text-6xl md:text-9xl lg:text-[11rem] font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tighter leading-none">
          Cathedra
        </h1>
        <p className="text-[#8b0000] dark:text-stone-400 font-serif italic text-xl md:text-4xl opacity-80 max-w-2xl mx-auto">
          Inteligência Teológica & Tradição.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
          {/* Busca Profissional */}
          <section className="bg-white dark:bg-stone-900 p-6 md:p-12 rounded-3xl md:rounded-[4rem] shadow-xl border border-stone-100 dark:border-stone-800 relative group">
            <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="relative flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: 'Transubstanciação'..." 
                  className="w-full pl-12 pr-4 py-5 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-100 dark:border-stone-700 rounded-2xl md:rounded-[2.5rem] focus:ring-4 focus:ring-[#d4af37]/10 outline-none text-lg md:text-2xl font-serif italic"
                />
              </div>
              <button type="submit" className="bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-8 py-5 rounded-2xl md:rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95">
                Explorar
              </button>
            </form>
          </section>

          {/* Trilhas Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRILHAS.map(trilha => (
              <button 
                key={trilha.title}
                onClick={() => onNavigate(trilha.route)}
                className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-50 dark:border-stone-800 shadow-md text-left hover:scale-[1.02] transition-transform flex items-center gap-5 md:flex-col md:items-start"
              >
                <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                  <trilha.icon className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-200">{trilha.title}</h4>
                  <p className="text-stone-400 text-[10px] md:text-[11px] font-serif italic">{trilha.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Evangelho */}
          <section className="bg-white dark:bg-stone-900 p-6 md:p-16 rounded-3xl md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <Icons.Book className="w-6 h-6 text-[#d4af37]" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Evangelho</h4>
               </div>
               <button onClick={toggleGospelSpeech} className={`p-4 rounded-full transition-all ${isReadingGospel ? 'bg-[#8b0000] text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}>
                 {audioLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Audio className="w-5 h-5" />}
               </button>
            </div>
            
            {loadingDaily ? (
              <div className="space-y-4 animate-pulse"><div className="h-6 w-1/2 bg-stone-100 rounded" /><div className="h-24 w-full bg-stone-50 rounded" /></div>
            ) : gospel && (
              <div className="space-y-6">
                <span className="text-[10px] font-black text-[#8b0000] dark:text-[#d4af37] uppercase tracking-widest">{gospel.reference}</span>
                <p className={`font-serif italic text-2xl md:text-4xl leading-snug ${isReadingGospel ? 'text-[#8b0000] dark:text-[#d4af37]' : 'text-stone-800 dark:text-stone-200'}`}>
                  "{gospel.text}"
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Santuário Mobile Stack */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-8">
             <div className="w-40 h-40 rounded-full border-4 border-white dark:border-stone-800 shadow-lg overflow-hidden mx-auto">
               <img src={saint?.image || 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=400'} className="w-full h-full object-cover" alt="" />
             </div>
             <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Santo do Dia</span>
                <h3 className="text-3xl font-serif font-bold dark:text-stone-200">{saint?.name}</h3>
             </div>
             <p className={`text-stone-500 dark:text-stone-400 font-serif italic text-base leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
               {saint?.biography}
             </p>
             <button onClick={() => setIsExpanded(!isExpanded)} className="text-[10px] font-black uppercase tracking-widest text-[#8b0000] dark:text-[#d4af37]">
               {isExpanded ? 'Recolher' : 'Ler mais'}
             </button>
          </div>

          <div className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl md:rounded-[4rem] text-white space-y-6 relative overflow-hidden text-center">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Citação</h4>
             <p className="text-xl md:text-2xl font-serif italic leading-relaxed">"{dailyQuote?.quote}"</p>
             <cite className="text-[9px] font-black uppercase tracking-widest opacity-50 block">— {dailyQuote?.author}</cite>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
