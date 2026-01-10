
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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLiturgy = async (selectedDate: string) => {
    setLoading(true);
    stopAudio();
    try {
      const result = await fetchLiturgyByDate(selectedDate, lang);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      red: 'border-red-600/30 text-red-700',
      green: 'border-emerald-600/30 text-emerald-700',
      purple: 'border-purple-600/30 text-purple-700',
      white: 'border-gold/30 text-stone-600',
      rose: 'border-pink-600/30 text-pink-700'
    };
    return map[color?.toLowerCase() || 'white'] || 'border-gold/30';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-400 font-serif italic text-xl">Recuperando o Lecionário do Dia...</p>
      </div>
    );
  }

  const calendar = data?.gospel?.calendar;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      {/* HEADER DE ESTADO LITÚRGICO */}
      <header className={`bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] shadow-xl border-t-[12px] ${getLiturgicalColorClass(calendar?.color)} flex flex-col md:flex-row items-center justify-between gap-8`}>
        <div className="space-y-2 text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sacred">{calendar?.rank}</span>
              <div className="w-1 h-1 bg-stone-300 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Ciclo {calendar?.cycle}</span>
           </div>
           <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{calendar?.dayName}</h2>
           <p className="text-stone-400 text-lg font-serif italic">{calendar?.season}</p>
        </div>
        
        <div className="flex items-center gap-4">
           <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-6 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl font-serif text-lg outline-none shadow-inner" />
           <button onClick={playFullLiturgy} className={`p-5 rounded-full shadow-2xl transition-all active:scale-95 ${isPlaying ? 'bg-sacred text-white' : 'bg-gold text-stone-900'}`}>
              {isPlaying ? <Icons.Stop className="w-6 h-6" /> : <Icons.Audio className="w-6 h-6" />}
           </button>
        </div>
      </header>

      {/* SANTO DO DIA (BANNER PÔSTER) */}
      {data?.saint && (
        <section className="relative h-[450px] rounded-[4rem] overflow-hidden group shadow-3xl">
           <SacredImage 
             src={data.saint.image} 
             alt={data.saint.name} 
             liturgicalColor={calendar?.color}
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[15s]" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
           <div className="absolute bottom-12 left-12 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Memória de Hoje</span>
              <h3 className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tighter">{data.saint.name}</h3>
           </div>
        </section>
      )}

      {/* LECTIONARIUM BODY */}
      <div className="space-y-20 parchment dark:bg-stone-900/50 p-8 md:p-16 rounded-[5rem] shadow-inner border border-stone-100 dark:border-stone-800 relative">
        <Icons.Cross className="absolute top-10 right-10 w-24 h-24 opacity-[0.03] pointer-events-none" />

        {/* 1. ORATIO COLLECTA */}
        <article className="space-y-6 text-center max-w-2xl mx-auto">
           <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Oratio Collecta</h4>
           <div className="p-8 bg-stone-50/50 dark:bg-stone-800/30 rounded-[3rem] border border-stone-100 dark:border-stone-800">
              <p className="text-2xl md:text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">
                "{data?.collect}"
              </p>
           </div>
        </article>

        {/* 2. LECTIO PRIMA */}
        <article className="space-y-8">
           <header className="flex justify-between items-center border-b border-sacred/10 pb-6">
              <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Lectio Prima</h4>
                 <p className="text-xs font-serif italic text-stone-400">{data?.firstReading.reference}</p>
              </div>
              <ActionButtons itemId={`lit_1_${date}`} type="liturgy" title="I Leitura" content={data?.firstReading.text} />
           </header>
           <p className="text-2xl md:text-4xl font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
             {data?.firstReading.text}
           </p>
        </article>

        {/* 3. GRADUALE (PSALMUS) */}
        <article className="bg-[#fcf8e8] dark:bg-stone-950 p-12 md:p-20 rounded-[4rem] border-l-[16px] border-sacred space-y-10 shadow-xl">
           <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred text-center">Graduale (Psalmus)</h4>
           <div className="space-y-8 text-center">
              <p className="text-3xl md:text-4xl font-serif italic text-sacred font-bold leading-tight">
                R/. {data?.psalm.title}
              </p>
              <div className="h-px w-24 bg-sacred/20 mx-auto" />
              <p className="text-2xl md:text-3xl font-serif text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-wrap italic">
                {data?.psalm.text}
              </p>
           </div>
        </article>

        {/* 4. EPISTOLA (SE HOUVER) */}
        {data?.secondReading && (
          <article className="space-y-8">
            <header className="flex justify-between items-center border-b border-sacred/10 pb-6">
                <div>
                   <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Epistola</h4>
                   <p className="text-xs font-serif italic text-stone-400">{data.secondReading.reference}</p>
                </div>
                <ActionButtons itemId={`lit_2_${date}`} type="liturgy" title="Epístola" content={data.secondReading.text} />
             </header>
             <p className="text-2xl md:text-4xl font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
               {data.secondReading.text}
             </p>
          </article>
        )}

        {/* 5. EVANGELIUM */}
        <article className="space-y-10 relative">
           <div className="absolute -left-12 top-0 bottom-0 w-1 bg-sacred/20 hidden md:block" />
           <header className="flex justify-between items-center border-b border-sacred/10 pb-6">
              <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Evangelium Sanctum</h4>
                 <p className="text-xs font-serif italic text-stone-400">{data?.gospel.reference}</p>
              </div>
              <ActionButtons itemId={`lit_g_${date}`} type="liturgy" title="Evangelho" content={data?.gospel.text} />
           </header>
           <p className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight first-letter:text-9xl first-letter:font-bold first-letter:text-sacred first-letter:float-left first-letter:mr-6 first-letter:mt-4">
             {data?.gospel.text}
           </p>
        </article>

        {/* 6. MYSTAGOGIA (REFLEXÃO) */}
        <section className="bg-stone-900 p-12 md:p-24 rounded-[6rem] text-white shadow-3xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
           <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gold/5 blur-[150px]" />
           <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-gold text-stone-900 rounded-3xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                    <Icons.Feather className="w-8 h-8" />
                 </div>
                 <h4 className="text-3xl font-serif font-bold text-gold">Mystagogia do Dia</h4>
              </div>
              <p className="text-2xl md:text-4xl font-serif italic text-white/90 leading-relaxed">
                {data?.gospel.homily || data?.gospel.reflection}
              </p>
           </div>
        </section>
      </div>

      <footer className="text-center opacity-30 pt-20">
         <Icons.Cross className="w-10 h-10 mx-auto" />
         <p className="text-[11px] font-black uppercase tracking-[1em] mt-6">Verbum Domini • Deo Gratias</p>
      </footer>
    </div>
  );
};

export default DailyLiturgy;
