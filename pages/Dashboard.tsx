
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getDailySaint, getDailyGospel, getDogmas, getDailyQuote, generateSpeech } from '../services/gemini';
import { Saint, Gospel, Dogma, AppRoute, User } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import MemberBanner from '../components/MemberBanner';

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
  { title: 'Iniciação Cristã', desc: 'Fundamentos da fé para novos discípulos.', route: AppRoute.CATECHISM, icon: Icons.Cross },
  { title: 'Aprofundamento Bíblico', desc: 'Exegese e reflexão sobre a Palavra Viva.', route: AppRoute.BIBLE, icon: Icons.Book },
  { title: 'Defesa da Fé', desc: 'Apologética para os tempos atuais.', route: AppRoute.DOGMAS, icon: Icons.Feather },
];

const Dashboard: React.FC<DashboardProps> = ({ onSearch, onNavigate, user }) => {
  const [saint, setSaint] = useState<Saint | null>(null);
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [recentDogma, setRecentDogma] = useState<Dogma | null>(null);
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
      const [s, g, d, q] = await Promise.all([
        getDailySaint().catch(() => null),
        getDailyGospel().catch(() => null),
        getDogmas().catch(() => []),
        getDailyQuote().catch(() => null)
      ]);
      setSaint(s);
      setGospel(g);
      setRecentDogma(d && d.length > 0 ? d[0] : null);
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
      console.error("Erro no áudio:", err);
      stopAudio();
    }
  };

  const liturgicalColor = gospel?.calendar?.color ? LITURGY_COLORS[gospel.calendar.color] : '#d4af37';

  return (
    <div className="space-y-16 md:space-y-24 page-enter pb-32">
      {/* Banner de Membro para não logados ou Peregrinos */}
      {!user && (
        <MemberBanner onJoin={() => onNavigate(AppRoute.LOGIN)} />
      )}

      {/* Status Litúrgico Profissional */}
      {!loadingDaily && gospel?.calendar && (
        <div className="animate-in slide-in-from-top duration-1000">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-white/80 backdrop-blur-2xl p-6 rounded-[3rem] border border-stone-200 shadow-sacred max-w-4xl mx-auto group hover:border-[#d4af37]/40 transition-all duration-700">
            <div className="flex items-center gap-4">
               <div className="w-5 h-5 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: liturgicalColor }} />
               <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-500">
                    {gospel.calendar.season}
                  </span>
                  <span className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter">Proprium de Tempore</span>
               </div>
            </div>
            
            <div className="h-10 w-px bg-stone-100 hidden md:block" />

            <div className="text-center md:text-left">
               <span className="text-sm md:text-base font-serif font-bold text-stone-800">
                 {gospel.calendar.dayName}
               </span>
               <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                 {gospel.calendar.week || 'Feria'}
               </p>
            </div>

            <div className="h-10 w-px bg-stone-100 hidden md:block" />

            <div className="flex flex-col items-center md:items-start">
               <span className="px-4 py-1 bg-[#fcf8e8] text-[#8b0000] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#d4af37]/10">
                 {gospel.calendar.cycle || 'Ano Litúrgico'}
               </span>
               <span className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter mt-1">
                 {gospel.calendar.rank}
               </span>
            </div>
          </div>
        </div>
      )}

      <header className="text-center space-y-8">
        <h1 className="text-8xl md:text-[12rem] font-serif font-bold text-stone-900 tracking-tighter text-shadow-sacred leading-none select-none">
          Cathedra
        </h1>
        <p className="text-[#8b0000] font-serif italic text-3xl md:text-5xl opacity-80 tracking-wide max-w-4xl mx-auto px-4">
          Onde a Inteligência encontra a Tradição.
        </p>
      </header>

      {/* Grid Principal Refatorado */}
      <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-start">
        
        {/* Lado Esquerdo: Busca e Conteúdo Principal */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Oráculo de Busca */}
          <section className="bg-white p-10 md:p-16 rounded-[4.5rem] shadow-3xl border border-stone-50 relative group transition-all duration-1000 hover:shadow-sacred/5">
            <div 
              className="absolute top-0 left-0 w-full h-2 rounded-t-[4.5rem] opacity-40" 
              style={{ background: `linear-gradient(to r, ${liturgicalColor}, transparent, ${liturgicalColor})` }}
            />
            
            <div className="mb-10 flex items-center justify-between">
               <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-stone-300">Summa Indagatio</h3>
               <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-[#d4af37]">
                 <Icons.Search className="w-6 h-6" />
               </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="relative">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: 'Transubstanciação' ou 'Justiça Social'..." 
                className="w-full px-12 py-10 bg-stone-50/50 border border-stone-100 rounded-[3rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none text-2xl md:text-4xl font-serif italic shadow-inner transition-all placeholder:text-stone-200"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-[#d4af37] px-12 py-7 rounded-full hover:bg-[#8b0000] hover:text-white transition-all shadow-2xl font-black uppercase tracking-widest text-xs flex items-center gap-4 group/btn">
                <span>Explorar</span>
                <Icons.Feather className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
              </button>
            </form>
          </section>

          {/* Trilhas de Sabedoria */}
          <div className="grid md:grid-cols-3 gap-8">
            {TRILHAS.map(trilha => (
              <button 
                key={trilha.title}
                onClick={() => onNavigate(trilha.route)}
                className="bg-white p-12 rounded-[4rem] border border-stone-50 shadow-xl text-left hover:-translate-y-4 transition-all group relative overflow-hidden duration-700"
              >
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                   <trilha.icon className="w-32 h-32" />
                </div>
                <div className="p-5 bg-stone-50 rounded-3xl mb-8 inline-block group-hover:bg-[#fcf8e8] transition-colors shadow-sm">
                  <trilha.icon className="w-8 h-8 text-[#d4af37]" />
                </div>
                <h4 className="text-2xl font-serif font-bold text-stone-900 mb-4">{trilha.title}</h4>
                <p className="text-stone-400 text-[12px] font-serif italic leading-relaxed">{trilha.desc}</p>
                {/* Badge Grátis */}
                <span className="mt-4 inline-block text-[8px] font-black text-green-500 uppercase tracking-widest">Acesso Aberto</span>
              </button>
            ))}
          </div>

          {/* Seção Litúrgica com Gradiente Vibrante */}
          <section className="relative group">
            <div 
              className="absolute inset-0 rounded-[5rem] blur-[80px] opacity-20 transition-opacity duration-1000 group-hover:opacity-40" 
              style={{ background: `radial-gradient(circle at center, ${liturgicalColor}, transparent)` }}
            />
            <div className="bg-white p-12 md:p-20 rounded-[5rem] border border-stone-100 shadow-2xl relative overflow-hidden transition-all duration-1000">
              <div 
                className="absolute top-0 left-0 w-full h-3 shadow-lg" 
                style={{ backgroundColor: liturgicalColor }} 
              />
              
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-8">
                    <div className="p-6 bg-stone-50 rounded-[2rem] shadow-inner">
                      <Icons.Book className="w-10 h-10 text-[#d4af37]" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-stone-400">Verbum Domini</h4>
                      <p className="text-[9px] text-[#8b0000] font-black uppercase tracking-widest mt-1">Leitura Orante de Hoje</p>
                    </div>
                 </div>
                 <button 
                   onClick={toggleGospelSpeech}
                   className={`p-7 rounded-full transition-all shadow-xl active:scale-90 ${isReadingGospel || audioLoading ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-stone-50 text-stone-400 hover:text-[#d4af37] hover:bg-[#fcf8e8]'}`}
                   disabled={audioLoading}
                 >
                   {audioLoading ? (
                     <div className="w-7 h-7 border-4 border-current border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <Icons.Audio className={`w-7 h-7 ${isReadingGospel ? 'animate-bounce' : ''}`} />
                   )}
                 </button>
              </div>
              
              {loadingDaily ? (
                <div className="space-y-8 animate-pulse">
                   <div className="h-8 w-1/4 bg-stone-100 rounded-full" />
                   <div className="h-32 w-full bg-stone-50 rounded-[3rem]" />
                </div>
              ) : gospel?.text ? (
                <div className="grid md:grid-cols-12 gap-16 relative z-10">
                   <div className="md:col-span-8 space-y-10">
                      <p className="text-[#8b0000] font-black text-sm tracking-[0.4em] uppercase border-b border-stone-50 pb-4 inline-block">{gospel.reference}</p>
                      <p className={`font-serif italic text-3xl md:text-5xl leading-[1.2] transition-colors duration-1000 tracking-tight ${isReadingGospel ? 'text-[#8b0000]' : 'text-stone-800'}`}>
                        "{gospel.text}"
                      </p>
                   </div>
                   <div className="md:col-span-4 bg-stone-50/50 p-12 rounded-[4rem] border border-stone-100 backdrop-blur-md self-start group/box transition-all hover:bg-white hover:shadow-xl">
                      <div className="flex items-center gap-4 mb-8">
                        <Icons.Feather className="w-6 h-6 text-[#d4af37]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Meditatio</span>
                      </div>
                      <p className="text-stone-500 font-serif italic text-2xl leading-relaxed opacity-80 group-hover/box:opacity-100 transition-opacity">
                        {gospel.reflection}
                      </p>
                   </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* Lado Direito: Sidebar Santuário */}
        <aside className="lg:col-span-4 space-y-12">
          
          {/* Santo do Dia Refinado */}
          <div className="sacred-background parchment rounded-[5rem] overflow-hidden group flex flex-col relative border border-[#d4af37]/20 shadow-2xl transition-all duration-1000 hover:shadow-sacred/30">
            <div className="p-12 md:p-16 text-center space-y-12">
              <div className="relative mx-auto">
                <div 
                   className="absolute inset-0 bg-[#d4af37]/20 blur-[60px] rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" 
                />
                <div className="w-72 h-72 rounded-full border-[12px] border-white shadow-3xl overflow-hidden mx-auto transition-all duration-1000 group-hover:scale-110 group-hover:rotate-3 relative z-10">
                  <img 
                    src={saint?.image || 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=400'} 
                    className="w-full h-full object-cover" 
                    alt={saint?.name} 
                  />
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-[#d4af37]">Sanctorum Communio</h3>
                <h2 className="text-5xl font-serif font-bold text-stone-900 leading-tight tracking-tight">{saint?.name}</h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-8 bg-stone-100" />
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{saint?.feastDay}</p>
                  <div className="h-px w-8 bg-stone-100" />
                </div>
              </div>
              
              <p className={`text-stone-600 font-serif italic text-xl leading-relaxed px-4 transition-all duration-1000 ${isExpanded ? '' : 'line-clamp-4'}`}>
                {saint?.biography}
              </p>
              
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000] border-b-2 border-[#8b0000]/10 pb-2 hover:border-[#8b0000]/40 transition-all active:scale-95"
              >
                {isExpanded ? 'Recolher' : 'Mergulhar na Vida'}
              </button>
            </div>
          </div>

          {/* Citação Mística */}
          <div className="sacred-background parchment p-14 rounded-[4.5rem] border border-[#d4af37]/10 shadow-xl flex flex-col justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-700">
             <div className="absolute top-10 left-10 text-stone-100 select-none">
                <span className="font-serif text-[180px] leading-none opacity-10">“</span>
             </div>
             <div className="relative z-10 space-y-10">
                {loadingDaily ? (
                  <div className="space-y-6 animate-pulse">
                     <div className="h-10 bg-stone-50 rounded-full w-full" />
                     <div className="h-10 bg-stone-50 rounded-full w-3/4 mx-auto" />
                  </div>
                ) : dailyQuote ? (
                  <>
                    <p className="text-3xl md:text-4xl font-serif italic font-bold text-stone-900 leading-tight tracking-tight px-6 drop-shadow-sm">
                      {dailyQuote.quote}
                    </p>
                    <div className="flex items-center justify-center gap-6">
                       <div className="h-px w-10 bg-[#8b0000]/10" />
                       <cite className="text-[12px] font-black uppercase tracking-[0.6em] text-[#8b0000] not-italic">
                          {dailyQuote.author}
                       </cite>
                       <div className="h-px w-10 bg-[#8b0000]/10" />
                    </div>
                  </>
                ) : null}
             </div>
          </div>

          {/* Chamada para a Comunidade Aula Magna */}
          <div className="bg-[#8b0000] p-14 rounded-[5rem] text-white space-y-10 relative overflow-hidden group shadow-3xl transition-all duration-1000 hover:scale-[1.02]">
             <Icons.Users className="absolute -top-10 -right-10 w-48 h-48 text-white/10 group-hover:rotate-12 transition-transform duration-1000" />
             <div className="space-y-4 relative z-10">
                <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-[#d4af37]">Aula Magna</h4>
                <h3 className="text-5xl font-serif font-bold leading-none tracking-tight">Comunidade Viva</h3>
             </div>
             <p className="text-white/70 font-serif italic text-2xl leading-relaxed relative z-10">
               Traga suas dúvidas e debata com outros estudiosos.
             </p>
             <button 
               onClick={() => onNavigate(AppRoute.COMMUNITY)}
               className="w-full py-9 bg-white text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-[#d4af37] transition-all shadow-2xl relative z-10 active:scale-95"
             >
               Entrar na Aula Magna
             </button>
          </div>
          
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
