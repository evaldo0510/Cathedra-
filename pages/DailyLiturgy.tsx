
import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import { Icons } from '../constants';
import { fetchLiturgyByDate, generateSpeech } from '../services/gemini';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { DailyLiturgyContent } from '../types';

const DailyLiturgy: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyLiturgyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(1.1);
  const [activeTab, setActiveTab] = useState<'readings' | 'reflection'>('readings');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLiturgy = useCallback(async (selectedDate: string) => {
    setRendering(true);
    setLoading(true);
    setError(false);
    stopAudio();
    
    try {
      const result = await fetchLiturgyByDate(selectedDate, lang);
      if (result && result.content) {
        setData(result.content);
      } else {
        setError(true);
      }
    } catch (e) { 
      console.error("Erro ao carregar liturgia:", e);
      setError(true);
    } finally { 
      setLoading(false); 
      setRendering(false);
    }
  }, [lang]);

  useEffect(() => { 
    loadLiturgy(date); 
  }, [date, loadLiturgy]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (isPlaying) { stopAudio(); return; }
    if (!data) return;
    setIsPlaying(true);
    try {
      const textToRead = activeTab === 'readings' 
        ? `Primeira Leitura. ${data.firstReading?.text || ''}. Salmo Responsorial. ${data.psalm?.text || ''}. Evangelho. ${data.gospel?.text || ''}`
        : `Reflexão teológica para o dia de hoje. ${data.gospel?.reflection || data.gospel?.homily || 'Reflexão não disponível.'}`;
      
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64 = await generateSpeech(textToRead);
      if (base64) {
        const buffer = await decodeAudioData(decodeBase64(base64), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        audioSourceRef.current = source;
        source.start(0);
      } else {
        setIsPlaying(false);
      }
    } catch (err) { setIsPlaying(false); }
  };

  const navigateDate = (days: number) => {
    const current = new Date(date + 'T12:00:00');
    current.setDate(current.getDate() + days);
    const nextDate = current.toISOString().split('T')[0];
    setDate(nextDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const theme = useMemo(() => {
    const color = data?.gospel?.calendar?.color || 'white';
    const map: Record<string, { border: string, text: string, bg: string, rubric: string, accent: string, glow: string }> = {
      red: { border: 'border-red-600', text: 'text-red-700', bg: 'bg-red-50/40', rubric: 'text-red-600', accent: 'bg-red-600', glow: 'shadow-red-600/10' },
      green: { border: 'border-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50/40', rubric: 'text-emerald-600', accent: 'bg-emerald-600', glow: 'shadow-emerald-600/10' },
      purple: { border: 'border-purple-600', text: 'text-purple-700', bg: 'bg-purple-50/40', rubric: 'text-purple-600', accent: 'bg-purple-600', glow: 'shadow-purple-600/10' },
      white: { border: 'border-gold', text: 'text-stone-700', bg: 'bg-stone-50/40', rubric: 'text-gold', accent: 'bg-gold', glow: 'shadow-gold/10' },
      rose: { border: 'border-pink-600', text: 'text-pink-700', bg: 'bg-pink-50/40', rubric: 'text-pink-600', accent: 'bg-pink-600', glow: 'shadow-pink-600/10' }
    };
    return map[color.toLowerCase()] || map.white;
  }, [data]);

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(date + 'T12:00:00');
      return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return date;
    }
  }, [date, lang]);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-40 px-4 animate-in fade-in duration-700 relative">
      {/* NAVEGAÇÃO LATERAL (ESTILO BÍBLIA) */}
      <div className="fixed inset-y-0 left-0 z-[100] flex items-center px-4 md:px-8 pointer-events-none hidden lg:flex">
         <button 
            onClick={() => navigateDate(-1)}
            className="p-6 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-full text-stone-400 hover:text-gold pointer-events-auto transition-all shadow-2xl border border-white/10 hover:scale-110 active:scale-90"
            aria-label="Dia Anterior"
         >
            <Icons.ArrowDown className="w-8 h-8 rotate-90" />
         </button>
      </div>

      <div className="fixed inset-y-0 right-0 z-[100] flex items-center px-4 md:px-8 pointer-events-none hidden lg:flex">
         <button 
            onClick={() => navigateDate(1)}
            className="p-6 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-full text-stone-400 hover:text-gold pointer-events-auto transition-all shadow-2xl border border-white/10 hover:scale-110 active:scale-90"
            aria-label="Próximo Dia"
         >
            <Icons.ArrowDown className="w-8 h-8 -rotate-90" />
         </button>
      </div>

      {/* BARRA DE CONTROLE SUPERIOR */}
      <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-full border border-stone-200 dark:border-white/10 shadow-2xl p-2 flex items-center justify-between mx-auto w-full max-w-3xl">
        <button 
          onClick={() => navigateDate(-1)} 
          className="p-3 md:px-6 md:py-3 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold rounded-full transition-all flex items-center gap-2 group"
        >
          <Icons.ArrowDown className="w-4 h-4 rotate-90 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden md:block text-[10px] font-black uppercase">Anterior</span>
        </button>

        <div className="flex flex-col items-center">
           <input 
             type="date" 
             value={date} 
             onChange={e => setDate(e.target.value)} 
             className="absolute opacity-0 w-24 h-8 cursor-pointer"
           />
           <p className="text-xs md:text-sm font-serif font-black text-stone-800 dark:text-gold tracking-tight leading-none">
             {formattedDate}
           </p>
           <span className="text-[7px] font-black uppercase text-stone-400 mt-1 opacity-60">Alterar Data</span>
        </div>

        <button 
          onClick={() => navigateDate(1)} 
          className="p-3 md:px-6 md:py-3 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full hover:scale-105 transition-all flex items-center gap-2 group"
        >
          <span className="hidden md:block text-[10px] font-black uppercase">Próximo</span>
          <Icons.ArrowDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {/* CARREGAMENTO / CONTEÚDO */}
      {loading || rendering ? (
        <div className="py-40 text-center space-y-12">
          <div className="relative inline-block">
             <div className="w-20 h-20 border-8 border-gold/10 border-t-gold rounded-full animate-spin mx-auto" />
             <Icons.Cross className="absolute inset-0 m-auto w-6 h-6 text-sacred animate-pulse" />
          </div>
          <p className="text-2xl font-serif italic text-stone-400">Preparando o Alimento do Dia...</p>
        </div>
      ) : data && (
        <div className="space-y-12 animate-in fade-in duration-1000">
          {/* TABS DE MODO */}
          <div className="flex justify-center">
             <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-full border border-stone-200 dark:border-stone-700 shadow-inner">
                <button 
                  onClick={() => setActiveTab('readings')}
                  className={`px-10 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'readings' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  Leituras
                </button>
                <button 
                  onClick={() => setActiveTab('reflection')}
                  className={`px-10 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'reflection' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  Reflexão IA
                </button>
             </div>
          </div>

          {/* CABEÇALHO DO DIA */}
          <header className={`bg-white dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] border-t-[16px] ${theme.border} shadow-2xl text-center relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-[10s]">
              <Icons.Cross className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-4">
              <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] ${theme.rubric}`}>
                {data.gospel?.calendar?.rank || "Féria"} • {data.gospel?.calendar?.season || "Tempo Comum"}
              </span>
              <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-[0.9]">
                {data.gospel?.calendar?.dayName || "Dia Litúrgico"}
              </h2>
            </div>
          </header>

          {activeTab === 'readings' ? (
            <article className="parchment dark:bg-stone-900/40 p-10 md:p-24 rounded-[4rem] md:rounded-[5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-24" style={{ fontSize: `${fontSize}rem` }}>
              {/* PRIMEIRA LEITURA */}
              <section className="space-y-8">
                 <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-6">
                   <div className="flex flex-col">
                     <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] ${theme.rubric}`}>Lectio Prima</h3>
                     <span className="text-[9px] text-stone-400 italic font-serif">Primeira Leitura</span>
                   </div>
                   <ActionButtons itemId={`lit1_${date}`} type="liturgy" title="Leitura I" content={data.firstReading?.text} />
                 </div>
                 <h4 className="font-serif font-bold text-3xl text-stone-900 dark:text-gold tracking-tight">{data.firstReading?.reference}</h4>
                 <p className="font-serif text-stone-800 dark:text-stone-200 text-justify leading-relaxed tracking-tight first-letter:text-5xl first-letter:text-sacred first-letter:mr-2 first-letter:float-left first-letter:leading-none">
                   {data.firstReading?.text}
                 </p>
              </section>

              {/* SALMO */}
              <section className={`${theme.bg} p-10 md:p-16 rounded-[3.5rem] border-l-[12px] ${theme.border} space-y-8 shadow-inner`}>
                 <div className="text-center space-y-1">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.6em] ${theme.rubric}`}>Psalmus</h3>
                    <div className="h-px w-12 bg-stone-200 dark:bg-stone-700 mx-auto" />
                 </div>
                 <div className="space-y-6 text-center">
                    <p className="font-serif italic font-bold text-2xl md:text-4xl text-stone-900 dark:text-stone-100">
                      R/. {data.psalm?.title}
                    </p>
                    <p className="font-serif text-stone-700 dark:text-stone-300 italic text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap">
                      {data.psalm?.text}
                    </p>
                 </div>
              </section>

              {/* EVANGELHO */}
              <section className="space-y-8 relative">
                 <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-6">
                   <div className="flex flex-col">
                     <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] ${theme.rubric}`}>Evangelium</h3>
                     <span className="text-[9px] text-stone-400 italic font-serif">Santo Evangelho</span>
                   </div>
                   <ActionButtons itemId={`litg_${date}`} type="liturgy" title="Evangelho" content={data.gospel?.text} />
                 </div>
                 <h4 className="font-serif font-bold text-4xl text-stone-900 dark:text-gold tracking-tight text-center">{data.gospel?.reference}</h4>
                 <div className="bg-stone-50 dark:bg-stone-800/40 p-8 md:p-12 rounded-[3rem] border border-stone-200 dark:border-stone-700/50">
                    <p className="font-serif text-stone-900 dark:text-stone-100 font-bold text-justify text-2xl md:text-3xl leading-relaxed">
                      {data.gospel?.text}
                    </p>
                 </div>
              </section>
            </article>
          ) : (
            <article className="animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] shadow-4xl border border-gold/10 space-y-12 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-2 ${theme.accent}`} />
                  <header className="space-y-4">
                     <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gold">Symphonia Fidei • Reflexão IA</span>
                     <h3 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">O Mistério da Palavra</h3>
                  </header>
                  <div className="prose prose-2xl dark:prose-invert max-w-none">
                     <p className="font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed text-justify text-2xl md:text-3xl whitespace-pre-wrap">
                        {data.gospel?.reflection || data.gospel?.homily || "A liturgia deste dia nos convida à conversão profunda e ao encontro pessoal com o Cristo Ressuscitado."}
                     </p>
                  </div>
                  <div className="pt-10 flex justify-center">
                     <button onClick={() => window.dispatchEvent(new CustomEvent('cathedra-open-ai-study', { detail: { topic: `Reflexão teológica sobre ${data.gospel?.reference}` } }))} className="px-8 py-3 bg-stone-50 dark:bg-stone-800 text-[10px] font-black uppercase tracking-widest text-gold rounded-full hover:bg-gold hover:text-stone-900 transition-all border border-gold/20">Aprofundar Estudo</button>
                  </div>
               </div>
            </article>
          )}

          {/* BOTÕES DE NAVEGAÇÃO DE RODAPÉ (ESTILO BÍBLIA) */}
          <div className="flex flex-col md:flex-row justify-center gap-6 py-20 px-4 md:px-0">
            <button 
              onClick={() => navigateDate(-1)}
              className="px-10 py-6 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] transition-all hover:border-gold shadow-2xl flex items-center justify-center gap-4 group"
            >
              <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:-translate-x-2 transition-transform" /> Dia Anterior
            </button>
            <button 
              onClick={() => navigateDate(1)}
              className="px-16 py-6 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group"
            >
              Próximo Dia <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE DE ÁUDIO */}
      {!loading && !rendering && data && (
        <div className="fixed bottom-32 right-8 z-[300]">
           <button 
              onClick={playAudio} 
              className={`p-6 md:p-8 rounded-full shadow-4xl transition-all active:scale-95 border-4 border-white dark:border-stone-900 ${isPlaying ? 'bg-sacred text-white animate-pulse' : 'bg-gold text-stone-900'}`}
            >
              {isPlaying ? <Icons.Stop className="w-6 h-6 md:w-8 md:h-8" /> : <Icons.Audio className="w-6 h-6 md:w-8 md:h-8" />}
            </button>
        </div>
      )}
    </div>
  );
};

export default DailyLiturgy;
