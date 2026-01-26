
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(1.3);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLiturgy = async (selectedDate: string) => {
    setData(null);
    setLoading(true);
    stopAudio();
    try {
      const { content } = await fetchLiturgyByDate(selectedDate, lang);
      setData(content);
    } catch (e) {
      console.error("Erro no lecionário:", e);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => { loadLiturgy(date); }, [date, lang]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (isPlaying) { stopAudio(); return; }
    setIsPlaying(true);
    try {
      if (!data) return;
      const fullText = `Liturgia de hoje. Primeira Leitura: ${data.firstReading.text}. Salmo: ${data.psalm.text}. Evangelho: ${data.gospel.text}`;
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    const map: Record<string, { border: string, text: string, bg: string, accent: string, rubric: string }> = {
      red: { border: 'border-red-600', text: 'text-red-700', bg: 'bg-red-50/40', accent: 'bg-red-600', rubric: 'text-red-600' },
      green: { border: 'border-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50/40', accent: 'bg-emerald-600', rubric: 'text-emerald-600' },
      purple: { border: 'border-purple-600', text: 'text-purple-700', bg: 'bg-purple-50/40', accent: 'bg-purple-600', rubric: 'text-purple-600' },
      white: { border: 'border-gold', text: 'text-stone-700', bg: 'bg-stone-50/40', accent: 'bg-gold', rubric: 'text-gold' },
      rose: { border: 'border-pink-600', text: 'text-pink-700', bg: 'bg-pink-50/40', accent: 'bg-pink-600', rubric: 'text-pink-600' }
    };
    return map[color.toLowerCase()] || map.white;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-pulse">
        <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-400 font-serif italic text-2xl">Preparando o Altar da Palavra...</p>
      </div>
    );
  }

  const calendar = data?.gospel?.calendar;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-48 animate-in fade-in duration-700 px-4 md:px-0">
      {/* TOOLBAR SUPERIOR - REFINADA COM CONTROLE DE FONTE */}
      <nav className="sticky top-2 md:top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-xl rounded-full md:rounded-[3rem] border border-stone-200 dark:border-white/10 shadow-2xl p-2 md:p-3 flex items-center justify-between">
         <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => navigateDate(-1)} className="p-3 md:p-4 bg-stone-50 dark:bg-stone-800 hover:bg-gold hover:text-stone-900 rounded-full transition-all text-stone-400" aria-label="Dia anterior">
               <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 rotate-90" />
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-full p-1 border border-stone-200 dark:border-stone-800 overflow-hidden">
               <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="bg-transparent border-none py-1.5 md:py-2 px-2 md:px-4 text-[10px] md:text-base font-serif font-bold outline-none text-center cursor-pointer dark:text-white" 
               />
            </div>
            <button onClick={() => navigateDate(1)} className="p-3 md:p-4 bg-stone-50 dark:bg-stone-800 hover:bg-gold hover:text-stone-900 rounded-full transition-all text-stone-400" aria-label="Dia seguinte">
               <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 -rotate-90" />
            </button>
         </div>

         {/* CONTROLE DE FONTE RESPONSIVO */}
         <div className="flex items-center gap-2 md:gap-6 px-2 md:px-10 border-x border-stone-100 dark:border-white/5">
            <div className="flex items-center gap-1 md:gap-2">
               <span className="text-[10px] md:text-xs font-black text-stone-400">A</span>
               <input 
                 type="range" min="1" max="2.5" step="0.1" value={fontSize} 
                 onChange={e => setFontSize(parseFloat(e.target.value))}
                 className="w-12 md:w-32 h-1 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-gold"
                 aria-label="Ajustar tamanho da fonte"
               />
               <span className="text-sm md:text-lg font-black text-stone-400">A</span>
            </div>
         </div>

         <button onClick={playAudio} className={`p-3 md:p-5 rounded-full shadow-lg transition-all ${isPlaying ? 'bg-sacred text-white' : 'bg-gold text-stone-900'}`}>
            {isPlaying ? <Icons.Stop className="w-4 h-4 md:w-5 md:h-5" /> : <Icons.Audio className="w-4 h-4 md:w-5 md:h-5" />}
         </button>
      </nav>

      {/* HEADER LITÚRGICO */}
      <header className={`bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] md:rounded-[5rem] shadow-xl border-t-[16px] md:border-t-[24px] ${theme.border} text-center md:text-left relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-16 opacity-[0.05] pointer-events-none">
           <Icons.Cross className="w-80 h-80" />
        </div>
        <div className="relative z-10 space-y-6">
          <span className={`text-[12px] md:text-[14px] font-black uppercase tracking-[0.8em] ${theme.rubric} mb-2 block`}>{calendar?.rank || "Feria"}</span>
          <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{calendar?.dayName}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-stone-400 font-serif italic text-2xl md:text-3xl mt-6">
             <span>{calendar?.season}</span>
             <span className="opacity-30">|</span>
             <span>Ciclo {calendar?.cycle}</span>
             <span className="opacity-30">|</span>
             <span className="text-gold font-bold">{new Date(date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      {/* TEXTO SAGRADO */}
      <article 
        className="parchment dark:bg-stone-900/50 p-10 md:p-32 rounded-[4rem] md:rounded-[6rem] shadow-inner border border-stone-100 dark:border-stone-800 relative overflow-hidden space-y-24 md:space-y-32"
        style={{ fontSize: `${fontSize}rem`, lineHeight: '1.9' }}
      >
        <Icons.Cross className="absolute top-20 right-20 w-48 h-48 opacity-[0.01] pointer-events-none" />

        {/* COLETA */}
        {data?.collect && (
          <section className="space-y-10 text-center max-w-4xl mx-auto">
             <div className="flex flex-col items-center gap-6">
                <span className={`text-[0.6em] font-black uppercase tracking-[0.6em] ${theme.rubric}`}>Oratio Collecta</span>
                <div className="h-px w-32 bg-stone-200 dark:bg-stone-800" />
             </div>
             <p className="font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed px-8 py-4 text-justify">
               "{data.collect}"
             </p>
          </section>
        )}

        {/* LEITURA I */}
        <section className="space-y-12">
           <header className="flex justify-between items-end border-b-2 border-stone-100 dark:border-stone-800 pb-10">
              <div>
                 <span className={`text-[0.6em] font-black uppercase tracking-widest ${theme.rubric} block mb-2`}>Lectio Prima</span>
                 <h4 className="text-[1.1em] font-serif font-bold text-stone-900 dark:text-white leading-tight">{data?.firstReading.reference}</h4>
              </div>
              <ActionButtons itemId={`lit1_${date}`} type="liturgy" title="I Leitura" content={data?.firstReading.text} />
           </header>
           <p className="font-serif text-stone-800 dark:text-stone-200 tracking-tight text-justify first-letter:text-9xl first-letter:float-left first-letter:mr-8 first-letter:font-bold first-letter:text-sacred">
             {data?.firstReading.text}
           </p>
        </section>

        {/* SALMO */}
        <section className={`${theme.bg} p-12 md:p-24 rounded-[4rem] md:rounded-[6rem] border-l-[24px] md:border-l-[32px] ${theme.border} shadow-3xl mx-[-10px] md:mx-0`}>
           <h4 className={`text-[0.6em] font-black uppercase ${theme.rubric} block mb-12 text-center tracking-[0.8em]`}>Psalmus Responsorius</h4>
           <div className="text-center space-y-12">
              <p className={`text-[1.8em] font-serif italic ${theme.rubric} font-bold leading-tight`}>R/. {data?.psalm.title}</p>
              <div className="h-px w-40 bg-stone-200 dark:bg-stone-700 mx-auto" />
              <p className="font-serif text-stone-900 dark:text-stone-100 whitespace-pre-wrap italic leading-relaxed text-[1.1em]">
                {data?.psalm.text}
              </p>
           </div>
        </section>

        {/* LEITURA II (Se houver) */}
        {data?.secondReading && data.secondReading.text && (
          <section className="space-y-12">
             <header className="flex justify-between items-end border-b-2 border-stone-100 dark:border-stone-800 pb-10">
                <div>
                   <span className={`text-[0.6em] font-black uppercase tracking-widest ${theme.rubric} block mb-2`}>Lectio Secunda</span>
                   <h4 className="text-[1.1em] font-serif font-bold text-stone-900 dark:text-white leading-tight">{data.secondReading.reference}</h4>
                </div>
                <ActionButtons itemId={`lit2_${date}`} type="liturgy" title="II Leitura" content={data.secondReading.text} />
             </header>
             <p className="font-serif text-stone-800 dark:text-stone-200 tracking-tight text-justify first-letter:text-9xl first-letter:float-left first-letter:mr-8 first-letter:font-bold first-letter:text-sacred">
               {data.secondReading.text}
             </p>
          </section>
        )}

        {/* EVANGELHO */}
        <section className="space-y-16 relative pt-12">
           <div className="flex justify-center mb-16">
              <div className={`p-6 ${theme.bg} rounded-full border-4 ${theme.border} shadow-2xl`}>
                 <Icons.Cross className={`w-12 h-12 ${theme.rubric}`} />
              </div>
           </div>
           <header className="flex justify-between items-end border-b-2 border-stone-100 dark:border-stone-800 pb-10">
              <div>
                 <span className={`text-[0.7em] font-black uppercase ${theme.rubric} block mb-2 tracking-[0.6em]`}>Evangelium Sanctum</span>
                 <h4 className="text-[1.2em] font-serif font-bold text-stone-900 dark:text-white leading-tight">{data?.gospel.reference}</h4>
              </div>
              <ActionButtons itemId={`litg_${date}`} type="liturgy" title="Evangelho" content={data?.gospel.text} />
           </header>
           <p className="font-serif font-bold text-stone-900 dark:text-stone-100 first-letter:text-[6em] md:first-letter:text-[10em] first-letter:font-bold first-letter:text-sacred first-letter:float-left first-letter:mr-10 first-letter:mt-6 text-justify leading-tight tracking-tight">
             {data?.gospel.text}
           </p>
        </section>

        {/* HOMILIA / REFLEXÃO */}
        {(data?.gospel.homily || data?.gospel.reflection) && (
          <section className="bg-stone-900 p-16 md:p-32 rounded-[5rem] md:rounded-[8rem] text-white shadow-3xl relative overflow-hidden group mx-[-10px] md:mx-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.15]" />
            <div className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] bg-gold/10 blur-[150px] group-hover:scale-125 transition-transform duration-[15s]" />
            <div className="relative z-10 space-y-16">
                <div className="flex items-center gap-10">
                  <div className="p-8 bg-gold text-stone-900 rounded-[3rem] shadow-4xl rotate-3 group-hover:rotate-0 transition-all duration-1000">
                      <Icons.Feather className="w-12 h-12" />
                  </div>
                  <div>
                      <h4 className="text-[1.8em] md:text-[2.5em] font-serif font-bold text-gold tracking-tighter">Mystagogia</h4>
                      <p className="text-[0.4em] uppercase tracking-[0.6em] text-white/40 mt-2">Reflexão Espiritual</p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none font-serif text-[1.1em] md:text-[1.3em] leading-relaxed italic text-stone-200 text-justify border-l-8 border-gold/30 pl-12 md:pl-24">
                  {data?.gospel.homily || data?.gospel.reflection}
                </div>
                <div className="pt-20 flex justify-center opacity-40">
                  <Icons.Cross className="w-16 h-16" />
                </div>
            </div>
          </section>
        )}

        {/* NAVEGAÇÃO INFERIOR REFINADA */}
        <div className="flex flex-col md:flex-row justify-center gap-6 pt-24 border-t border-stone-100 dark:border-stone-800">
           <button 
             onClick={() => navigateDate(-1)}
             className="px-12 py-7 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] transition-all hover:border-gold shadow-xl flex items-center justify-center gap-6 group"
           >
             <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:translate-x-[-4px] transition-transform" /> Dia Anterior
           </button>
           
           <button 
             onClick={() => setDate(new Date().toISOString().split('T')[0])}
             className="px-12 py-7 bg-stone-50 dark:bg-stone-800 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] transition-all hover:text-gold border border-transparent hover:bg-gold/5"
           >
             Hodie (Hoje)
           </button>

           <button 
             onClick={() => navigateDate(1)}
             className="px-16 md:px-24 py-7 bg-gold text-stone-900 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] shadow-[0_25px_50px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-6 group"
           >
             Dia Seguinte <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:translate-x-[4px] transition-transform" />
           </button>
        </div>
      </article>
      
      <footer className="text-center opacity-30 pt-32 pb-24">
         <Icons.Cross className="w-12 h-12 mx-auto text-stone-400" />
         <p className="text-[14px] font-black uppercase tracking-[1.2em] mt-10">Verbum Domini • Deo Gratias</p>
      </footer>
    </div>
  );
};

export default DailyLiturgy;
