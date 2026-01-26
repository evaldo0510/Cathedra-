
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
  const [fontSize, setFontSize] = useState(1.1);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLiturgy = async (selectedDate: string) => {
    setData(null);
    setLoading(true);
    stopAudio();
    try {
      const { content } = await fetchLiturgyByDate(selectedDate, lang);
      setData(content);
    } catch (e) { console.error(e); }
    finally { setLoading(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
      const fullText = `Liturgia. Primeira Leitura: ${data.firstReading.text}. Salmo: ${data.psalm.text}. Evangelho: ${data.gospel.text}`;
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
    const map: Record<string, { border: string, text: string, bg: string, rubric: string }> = {
      red: { border: 'border-red-600', text: 'text-red-700', bg: 'bg-red-50/40', rubric: 'text-red-600' },
      green: { border: 'border-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50/40', rubric: 'text-emerald-600' },
      purple: { border: 'border-purple-600', text: 'text-purple-700', bg: 'bg-purple-50/40', rubric: 'text-purple-600' },
      white: { border: 'border-gold', text: 'text-stone-700', bg: 'bg-stone-50/40', rubric: 'text-gold' },
      rose: { border: 'border-pink-600', text: 'text-pink-700', bg: 'bg-pink-50/40', rubric: 'text-pink-600' }
    };
    return map[color.toLowerCase()] || map.white;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-pulse">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-400 font-serif italic">Preparando o Lecionário...</p>
      </div>
    );
  }

  const calendar = data?.gospel?.calendar;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      {/* NAVEGAÇÃO MOBILE COMPACTA */}
      <nav className="flex items-center justify-between bg-white dark:bg-stone-900 p-2 rounded-2xl border border-stone-200 dark:border-white/5 shadow-xl sticky top-2 z-[150]">
        <button onClick={() => navigateDate(-1)} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-600 dark:text-gold active:scale-90"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
        <div className="px-4 py-2 flex flex-col items-center">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent border-none text-sm font-serif font-bold text-stone-800 dark:text-gold outline-none text-center" />
        </div>
        <button onClick={() => navigateDate(1)} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-600 dark:text-gold active:scale-90"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
      </nav>

      <header className={`bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border-t-8 ${theme.border} shadow-lg text-center`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.rubric}`}>{calendar?.rank || "Feria"}</span>
        <h2 className="text-3xl font-serif font-bold mt-2 text-stone-900 dark:text-stone-100 leading-tight">{calendar?.dayName}</h2>
        <p className="text-stone-400 text-sm mt-1 font-serif italic">{calendar?.season}</p>
      </header>

      <article className="parchment dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-inner border border-stone-100 dark:border-stone-800 space-y-12" style={{ fontSize: `${fontSize}rem` }}>
        <section className="space-y-4">
           <div className="flex justify-between items-center">
             <span className={`text-[10px] font-black uppercase ${theme.rubric}`}>Leitura I</span>
             <ActionButtons itemId={`lit1_${date}`} type="liturgy" title="Leitura I" content={data?.firstReading.text} />
           </div>
           <h4 className="font-serif font-bold text-lg">{data?.firstReading.reference}</h4>
           <p className="font-serif text-stone-800 dark:text-stone-300 text-justify leading-relaxed">{data?.firstReading.text}</p>
        </section>

        {data?.psalm && (
          <section className={`${theme.bg} p-6 rounded-2xl border-l-4 ${theme.border} space-y-4`}>
             <p className={`text-center font-serif italic font-bold ${theme.rubric}`}>R/. {data.psalm.title}</p>
             <p className="font-serif text-stone-800 dark:text-stone-300 whitespace-pre-wrap italic text-sm text-center">{data.psalm.text}</p>
          </section>
        )}

        <section className="space-y-4 relative">
           <div className="flex justify-between items-center">
             <span className={`text-[10px] font-black uppercase ${theme.rubric}`}>Evangelho</span>
             <ActionButtons itemId={`litg_${date}`} type="liturgy" title="Evangelho" content={data?.gospel.text} />
           </div>
           <h4 className="font-serif font-bold text-lg">{data?.gospel.reference}</h4>
           <p className="font-serif text-stone-900 dark:text-stone-100 font-bold text-justify leading-relaxed">{data?.gospel.text}</p>
        </section>
      </article>

      <button onClick={playAudio} className={`fixed bottom-24 right-6 p-4 rounded-full shadow-2xl transition-all z-[150] ${isPlaying ? 'bg-sacred text-white animate-pulse' : 'bg-gold text-stone-900 shadow-[0_10px_30px_rgba(212,175,55,0.4)]'}`}>
        {isPlaying ? <Icons.Stop className="w-6 h-6" /> : <Icons.Audio className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default DailyLiturgy;
