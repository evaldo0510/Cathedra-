
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Icons } from '../constants';
import { fetchLiturgyByDate, generateSpeech } from '../services/gemini';
import { LangContext } from '../App';
import SacredImage from '../components/SacredImage';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { DailyLiturgyContent } from '../types';

const DailyLiturgy: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyLiturgyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(1.2); // rem
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLiturgy = async (selectedDate: string) => {
    // Descarrega dados anteriores imediatamente para poupar memória e evitar confusão visual
    setData(null);
    setLoading(true);
    stopAudio();
    try {
      const result = await fetchLiturgyByDate(selectedDate, lang);
      setData(result);
    } catch (e) {
      console.error("Erro ao carregar lecionário:", e);
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

  const playFullLiturgy = async () => {
    if (isPlaying) { stopAudio(); return; }
    setIsPlaying(true);
    try {
      if (!data) return;
      const fullText = `Liturgia de hoje. Oração Coleta: ${data.collect}. Primeira Leitura: ${data.firstReading.text}. Salmo: ${data.psalm.text}. Evangelho: ${data.gospel.text}`;
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

  const getLiturgicalColorClass = (color?: string) => {
    const map: Record<string, string> = {
      red: 'border-red-600 text-red-700',
      green: 'border-emerald-600 text-emerald-700',
      purple: 'border-purple-600 text-purple-700',
      white: 'border-gold text-stone-600',
      rose: 'border-pink-600 text-pink-700'
    };
    return map[color?.toLowerCase() || 'white'] || 'border-gold';
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-pulse">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-400 font-serif italic text-xl">Indexando o Lecionário do Dia...</p>
      </div>
    );
  }

  const calendar = data?.gospel?.calendar;

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-32 animate-in fade-in duration-700 px-2 md:px-0">
      {/* HEADER DE ESTADO LITÚRGICO - Otimizado Mobile */}
      <header className={`bg-white dark:bg-stone-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border-t-[8px] md:border-t-[12px] ${getLiturgicalColorClass(calendar?.color)} flex flex-col gap-6`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-sacred">{calendar?.rank}</span>
                <div className="w-1 h-1 bg-stone-300 rounded-full" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Ano {calendar?.cycle}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{calendar?.dayName}</h2>
            <p className="text-stone-400 text-sm md:text-lg font-serif italic">{calendar?.season}</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl font-serif text-base md:text-lg outline-none shadow-inner" 
            />
            <button onClick={playFullLiturgy} className={`p-4 md:p-5 rounded-full shadow-2xl transition-all active:scale-95 ${isPlaying ? 'bg-sacred text-white' : 'bg-gold text-stone-900'}`}>
                {isPlaying ? <Icons.Stop className="w-5 h-5 md:w-6 md:h-6" /> : <Icons.Audio className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          </div>
        </div>

        {/* Slider de Acessibilidade - Estilo Lectorium */}
        <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest hidden xs:block">Tamanho do Texto</span>
          <input 
            type="range" 
            min="0.8" 
            max="2.5" 
            step="0.1" 
            value={fontSize} 
            onChange={e => setFontSize(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-gold"
          />
          <span className="text-[10px] font-black text-gold w-8 text-right">{Math.round(fontSize * 100)}%</span>
        </div>
      </header>

      {/* SANTO DO DIA - Redimensionado para mobile */}
      {data?.saint && (
        <section className="relative h-[300px] md:h-[450px] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden group shadow-2xl">
           <SacredImage 
             src={data.saint.image} 
             alt={data.saint.name} 
             liturgicalColor={calendar?.color}
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[15s]" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
           <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 space-y-1">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-gold">Memória de Hoje</span>
              <h3 className="text-3xl md:text-6xl font-serif font-bold text-white tracking-tighter">{data.saint.name}</h3>
           </div>
        </section>
      )}

      {/* LECTIONARIUM BODY - Otimizado para leitura contínua */}
      <div 
        className="space-y-16 md:space-y-24 parchment dark:bg-stone-900/50 p-6 md:p-20 rounded-[3rem] md:rounded-[5rem] shadow-inner border border-stone-100 dark:border-stone-800 relative overflow-hidden"
        style={{ fontSize: `${fontSize}rem`, lineHeight: '1.8' }}
      >
        <Icons.Cross className="absolute top-10 right-10 w-16 h-16 md:w-24 md:h-24 opacity-[0.03] pointer-events-none" />

        {/* 1. ORATIO COLLECTA */}
        <article className="space-y-6 text-center max-w-2xl mx-auto">
           <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Oratio Collecta</h4>
           <div className="p-6 md:p-10 bg-stone-50/50 dark:bg-stone-800/30 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800">
              <p className="font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed break-words">
                "{data?.collect}"
              </p>
           </div>
        </article>

        {/* 2. LECTIO PRIMA */}
        <article className="space-y-6 md:space-y-8">
           <header className="flex justify-between items-center border-b border-sacred/10 pb-4">
              <div>
                 <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Lectio Prima</h4>
                 <p className="text-[10px] md:text-xs font-serif italic text-stone-400">{data?.firstReading.reference}</p>
              </div>
              <ActionButtons itemId={`lit_1_${date}`} type="liturgy" title="I Leitura" content={data?.firstReading.text} />
           </header>
           <p className="font-serif text-stone-800 dark:text-stone-200 leading-relaxed tracking-tight break-words">
             {data?.firstReading.text}
           </p>
        </article>

        {/* 3. GRADUALE (PSALMUS) - Visual de Destaque */}
        <article className="bg-[#fcf8e8] dark:bg-stone-950 p-8 md:p-20 rounded-[2.5rem] md:rounded-[4rem] border-l-[12px] md:border-l-[16px] border-sacred space-y-8 md:space-y-10 shadow-xl mx-[-8px] md:mx-0">
           <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-sacred text-center">Graduale (Psalmus)</h4>
           <div className="space-y-6 md:space-y-8 text-center">
              <p className="text-2xl md:text-4xl font-serif italic text-sacred font-bold leading-tight break-words">
                R/. {data?.psalm.title}
              </p>
              <div className="h-px w-16 md:w-24 bg-sacred/20 mx-auto" />
              <p className="font-serif text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-wrap italic break-words">
                {data?.psalm.text}
              </p>
           </div>
        </article>

        {/* 4. EPISTOLA */}
        {data?.secondReading && (
          <article className="space-y-6 md:space-y-8">
            <header className="flex justify-between items-center border-b border-sacred/10 pb-4">
                <div>
                   <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Epistola</h4>
                   <p className="text-[10px] md:text-xs font-serif italic text-stone-400">{data.secondReading.reference}</p>
                </div>
                <ActionButtons itemId={`lit_2_${date}`} type="liturgy" title="Epístola" content={data.secondReading.text} />
             </header>
             <p className="font-serif text-stone-800 dark:text-stone-200 leading-relaxed tracking-tight break-words">
               {data.secondReading.text}
             </p>
          </article>
        )}

        {/* 5. EVANGELIUM */}
        <article className="space-y-8 md:space-y-10 relative">
           <div className="absolute -left-6 md:-left-12 top-0 bottom-0 w-1 bg-sacred/20 hidden xs:block" />
           <header className="flex justify-between items-center border-b border-sacred/10 pb-4">
              <div>
                 <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Evangelium Sanctum</h4>
                 <p className="text-[10px] md:text-xs font-serif italic text-stone-400">{data?.gospel.reference}</p>
              </div>
              <ActionButtons itemId={`lit_g_${date}`} type="liturgy" title="Evangelho" content={data?.gospel.text} />
           </header>
           <p className="font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight first-letter:text-7xl md:first-letter:text-9xl first-letter:font-bold first-letter:text-sacred first-letter:float-left first-letter:mr-4 md:first-letter:mr-6 first-letter:mt-2 md:first-letter:mt-4 break-words">
             {data?.gospel.text}
           </p>
        </article>

        {/* 6. MYSTAGOGIA (REFLEXÃO) */}
        <section className="bg-stone-900 p-8 md:p-24 rounded-[3rem] md:rounded-[6rem] text-white shadow-3xl relative overflow-hidden group mx-[-8px] md:mx-0">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
           <div className="absolute -bottom-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-gold/5 blur-[100px] md:blur-[150px]" />
           <div className="relative z-10 space-y-6 md:space-y-10">
              <div className="flex items-center gap-4 md:gap-6">
                 <div className="p-3 md:p-4 bg-gold text-stone-900 rounded-2xl md:rounded-3xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                    <Icons.Feather className="w-6 h-6 md:w-8 md:h-8" />
                 </div>
                 <h4 className="text-2xl md:text-3xl font-serif font-bold text-gold">Mystagogia</h4>
              </div>
              <p className="text-xl md:text-4xl font-serif italic text-white/90 leading-relaxed break-words">
                {data?.gospel.homily || data?.gospel.reflection}
              </p>
           </div>
        </section>
      </div>

      <footer className="text-center opacity-30 pt-16 md:pt-20">
         <Icons.Cross className="w-8 h-8 md:w-10 md:h-10 mx-auto" />
         <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[1em] mt-6">Verbum Domini • Deo Gratias</p>
      </footer>
    </div>
  );
};

export default DailyLiturgy;
