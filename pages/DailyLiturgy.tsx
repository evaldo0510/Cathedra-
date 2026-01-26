
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
  const [rendering, setRendering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(1.1);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLiturgy = useCallback(async (selectedDate: string) => {
    setRendering(true);
    setLoading(true);
    stopAudio();
    
    try {
      const { content } = await fetchLiturgyByDate(selectedDate, lang);
      setData(content);
      // Pequeno delay para garantir transição suave no DOM
      setTimeout(() => {
        setRendering(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (e) { 
      console.error(e); 
      setRendering(false);
    } finally { 
      setLoading(false); 
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
      const fullText = `Liturgia. Primeira Leitura: ${data.firstReading.text}. Salmo: ${data.psalm.text}. Evangelho: ${data.gospel.text}`;
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64 = await generateSpeech(fullText);
      if (base64) {
        const buffer = await decodeAudioData(decodeBase64(base64), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        audioSourceRef.current = source;
        source.start(0);
      }
    } catch (err) { setIsPlaying(false); }
  };

  const navigateDate = (days: number) => {
    const current = new Date(date + 'T12:00:00');
    current.setDate(current.getDate() + days);
    setDate(current.toISOString().split('T')[0]);
  };

  const theme = useMemo(() => {
    const color = data?.gospel?.calendar?.color || 'white';
    const map: Record<string, { border: string, text: string, bg: string, rubric: string, accent: string }> = {
      red: { border: 'border-red-600', text: 'text-red-700', bg: 'bg-red-50/40', rubric: 'text-red-600', accent: 'bg-red-600' },
      green: { border: 'border-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50/40', rubric: 'text-emerald-600', accent: 'bg-emerald-600' },
      purple: { border: 'border-purple-600', text: 'text-purple-700', bg: 'bg-purple-50/40', rubric: 'text-purple-600', accent: 'bg-purple-600' },
      white: { border: 'border-gold', text: 'text-stone-700', bg: 'bg-stone-50/40', rubric: 'text-gold', accent: 'bg-gold' },
      rose: { border: 'border-pink-600', text: 'text-pink-700', bg: 'bg-pink-50/40', rubric: 'text-pink-600', accent: 'bg-pink-600' }
    };
    return map[color.toLowerCase()] || map.white;
  }, [data]);

  const calendar = data?.gospel?.calendar;

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-40 px-4 animate-in fade-in duration-700">
      {/* NAVEGAÇÃO DE TOPO (STICKY) */}
      <nav className="sticky top-4 z-[200] bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl rounded-full border border-stone-200 dark:border-white/10 shadow-2xl p-2 flex items-center justify-between mx-auto max-w-2xl">
        <button 
          onClick={() => navigateDate(-1)} 
          className="p-3 md:p-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-gold rounded-full hover:bg-gold hover:text-stone-900 transition-all active:scale-95 shadow-md group"
        >
          <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex-1 flex flex-col items-center px-4">
          <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-950/50 px-5 py-2 rounded-full border border-stone-100 dark:border-stone-800">
             <Icons.History className="w-4 h-4 text-gold/40" />
             <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="bg-transparent border-none text-xs md:text-sm font-serif font-black text-stone-800 dark:text-gold outline-none text-center cursor-pointer" 
            />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-stone-400 mt-1">Hodie • Hoje</span>
        </div>

        <button 
          onClick={() => navigateDate(1)} 
          className="p-3 md:p-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full hover:bg-gold hover:text-stone-900 transition-all active:scale-95 shadow-md group"
        >
          <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {loading || rendering ? (
        <div className="py-60 text-center space-y-12 animate-pulse">
          <div className="w-24 h-24 border-8 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-3xl font-serif italic text-stone-400">Preparando a Mesa da Palavra...</p>
        </div>
      ) : data && (
        <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">
          {/* CABEÇALHO LITÚRGICO */}
          <header className={`bg-white dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] border-t-[20px] ${theme.border} shadow-2xl text-center relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-[10s]">
              <Icons.Cross className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex justify-center items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${theme.accent} shadow-lg`} />
                 <span className={`text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] ${theme.rubric}`}>
                   {calendar?.rank || "Feria"}
                 </span>
              </div>
              <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">
                {calendar?.dayName}
              </h2>
              <p className="text-stone-400 text-xl font-serif italic border-y border-stone-50 dark:border-stone-800 py-4 inline-block px-10">
                {calendar?.season}
              </p>
            </div>
          </header>

          {/* ÁREA DE LEITURA (PARCHMENT) */}
          <article className="parchment dark:bg-stone-900/40 p-10 md:p-24 rounded-[3.5rem] md:rounded-[5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-24" style={{ fontSize: `${fontSize}rem` }}>
            {/* PRIMEIRA LEITURA */}
            <section className="space-y-8">
               <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-6">
                 <div className="flex flex-col">
                   <h3 className={`text-[12px] font-black uppercase tracking-[0.4em] ${theme.rubric}`}>Lectio Prima</h3>
                   <span className="text-[10px] text-stone-400 italic font-serif">Primeira Leitura</span>
                 </div>
                 <div className="flex gap-2">
                    <ActionButtons itemId={`lit1_${date}`} type="liturgy" title="Leitura I" content={data.firstReading.text} />
                 </div>
               </div>
               <h4 className="font-serif font-bold text-3xl md:text-4xl text-stone-900 dark:text-gold">{data.firstReading.reference}</h4>
               <p className="font-serif text-stone-800 dark:text-stone-200 text-justify leading-relaxed tracking-tight first-letter:text-5xl first-letter:text-sacred first-letter:mr-2 first-letter:float-left">
                 {data.firstReading.text}
               </p>
            </section>

            {/* SALMO */}
            <section className={`${theme.bg} p-12 md:p-20 rounded-[3.5rem] border-l-[16px] ${theme.border} space-y-10 shadow-inner group`}>
               <div className="text-center space-y-2">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] ${theme.rubric}`}>Psalmus</h3>
                  <span className="text-[9px] text-stone-400 italic block">Salmo Responsorial</span>
               </div>
               <div className="space-y-6 text-center">
                  <p className="font-serif italic font-bold text-3xl md:text-5xl leading-tight text-stone-900 dark:text-stone-100 group-hover:scale-[1.02] transition-transform duration-500">
                    R/. {data.psalm.title}
                  </p>
                  <div className="h-px w-20 bg-stone-200 dark:bg-stone-700 mx-auto" />
                  <p className="font-serif text-stone-700 dark:text-stone-300 whitespace-pre-wrap italic text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto">
                    {data.psalm.text}
                  </p>
               </div>
            </section>

            {/* SEGUNDA LEITURA (SE HOUVER) */}
            {data.secondReading && (
               <section className="space-y-8">
                  <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-6">
                    <div className="flex flex-col">
                      <h3 className={`text-[12px] font-black uppercase tracking-[0.4em] ${theme.rubric}`}>Lectio Secunda</h3>
                      <span className="text-[10px] text-stone-400 italic font-serif">Segunda Leitura</span>
                    </div>
                    <ActionButtons itemId={`lit2_${date}`} type="liturgy" title="Leitura II" content={data.secondReading.text} />
                  </div>
                  <h4 className="font-serif font-bold text-3xl md:text-4xl text-stone-900 dark:text-gold">{data.secondReading.reference}</h4>
                  <p className="font-serif text-stone-800 dark:text-stone-200 text-justify leading-relaxed tracking-tight">
                    {data.secondReading.text}
                  </p>
               </section>
            )}

            {/* EVANGELHO */}
            <section className="space-y-8 relative">
               <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-6">
                 <div className="flex flex-col">
                   <h3 className={`text-[12px] font-black uppercase tracking-[0.4em] ${theme.rubric}`}>Evangelium</h3>
                   <span className="text-[10px] text-stone-400 italic font-serif">Santo Evangelho</span>
                 </div>
                 <ActionButtons itemId={`litg_${date}`} type="liturgy" title="Evangelho" content={data.gospel.text} />
               </div>
               <h4 className="font-serif font-bold text-3xl md:text-4xl text-stone-900 dark:text-gold">{data.gospel.reference}</h4>
               <div className="bg-white/50 dark:bg-stone-800/30 p-10 md:p-14 rounded-[3rem] border border-stone-100 dark:border-stone-700/50 shadow-xl">
                  <p className="font-serif text-stone-900 dark:text-stone-100 font-bold text-justify text-2xl md:text-3xl leading-relaxed">
                    {data.gospel.text}
                  </p>
               </div>
               
               <div className="pt-10 flex items-center justify-center gap-6">
                  <div className="h-px flex-1 bg-gold/10" />
                  <Icons.Cross className="w-10 h-10 text-gold/30" />
                  <div className="h-px flex-1 bg-gold/10" />
               </div>
            </section>
          </article>

          {/* NAVEGAÇÃO DE RODAPÉ (ESTILO BÍBLIA) */}
          <div className="flex flex-col md:flex-row justify-center gap-8 py-20 px-4">
             <button 
                onClick={() => navigateDate(-1)}
                className="px-12 md:px-16 py-8 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] tracking-[0.5em] transition-all hover:border-gold shadow-2xl flex items-center justify-center gap-6 group"
              >
                <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:-translate-x-3 transition-transform" /> 
                Dia Anterior
              </button>
              <button 
                onClick={() => navigateDate(1)}
                className="px-20 md:px-32 py-8 bg-stone-900 text-gold rounded-full md:rounded-[3rem] font-black uppercase text-[10px] tracking-[0.5em] shadow-[0_30px_60px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-6 group"
              >
                Dia Seguinte 
                <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:translate-x-3 transition-transform" />
              </button>
          </div>
        </div>
      )}

      {/* BOTÃO DE ÁUDIO FLUTUANTE */}
      <button 
        onClick={playAudio} 
        disabled={loading || rendering}
        className={`fixed bottom-24 right-6 md:right-12 p-6 md:p-8 rounded-full shadow-4xl transition-all z-[150] active:scale-95 border-4 border-white dark:border-stone-900 disabled:opacity-0 ${isPlaying ? 'bg-sacred text-white animate-pulse scale-110' : 'bg-gold text-stone-900'}`}
      >
        {isPlaying ? <Icons.Stop className="w-6 h-6 md:w-8 md:h-8" /> : <Icons.Audio className="w-6 h-6 md:w-8 md:h-8" />}
      </button>

      <footer className="text-center opacity-20 pt-10 pb-20">
         <p className="text-[11px] font-black uppercase tracking-[1em]">Lecionarium Romanum</p>
      </footer>
    </div>
  );
};

export default DailyLiturgy;
