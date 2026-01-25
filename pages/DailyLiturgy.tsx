
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
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(1.2);
  const [viewMode, setViewMode] = useState<'reading' | 'missal'>('reading');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLiturgy = async (selectedDate: string) => {
    setData(null);
    setLoading(true);
    stopAudio();
    try {
      const { content, sources: rawSources } = await fetchLiturgyByDate(selectedDate, lang);
      setData(content);
      setSources(rawSources);
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

  const getLiturgicalColorClass = (color?: string) => {
    const map: Record<string, string> = {
      red: 'border-red-600', green: 'border-emerald-600',
      purple: 'border-purple-600', white: 'border-gold',
      rose: 'border-pink-600'
    };
    return map[color?.toLowerCase() || 'white'] || 'border-gold';
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-pulse">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-400 font-serif italic text-xl">Sincronizando com a Sé Apostólica...</p>
      </div>
    );
  }

  const calendar = data?.gospel?.calendar;

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-40 animate-in fade-in duration-700 px-2 md:px-0">
      <nav className="sticky top-2 md:top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-xl rounded-full md:rounded-[2.5rem] border border-stone-200 dark:border-white/10 shadow-2xl p-2 md:p-3 flex items-center justify-between">
         <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'reading' ? 'missal' : 'reading')} 
              className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'missal' ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}
            >
              {viewMode === 'missal' ? 'Missal' : 'Leitura'}
            </button>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="px-3 md:px-4 py-2 bg-stone-100 dark:bg-stone-900 border-none rounded-full text-[10px] md:text-xs font-serif outline-none" 
            />
         </div>

         <div className="flex items-center gap-3 px-4 flex-1 max-w-[150px]">
            <input 
              type="range" min="0.8" max="2.5" step="0.1" value={fontSize} 
              onChange={e => setFontSize(parseFloat(e.target.value))}
              className="w-full h-1 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-gold"
            />
         </div>

         <button onClick={playAudio} className={`p-3 md:p-4 rounded-full shadow-lg transition-all ${isPlaying ? 'bg-sacred text-white' : 'bg-gold text-stone-900'}`}>
            {isPlaying ? <Icons.Stop className="w-4 h-4 md:w-5 md:h-5" /> : <Icons.Audio className="w-4 h-4 md:w-5 md:h-5" />}
         </button>
      </nav>

      <header className={`bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-xl border-t-[10px] md:border-t-[16px] ${getLiturgicalColorClass(calendar?.color)} text-center md:text-left`}>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred mb-2 block">{calendar?.rank}</span>
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">{calendar?.dayName}</h2>
        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-stone-400 font-serif italic text-lg md:text-xl">
           <span>{calendar?.season}</span>
           <span className="opacity-30">|</span>
           <span>Ciclo {calendar?.cycle}</span>
        </div>
      </header>

      <article 
        className="parchment dark:bg-stone-900/50 p-6 md:p-20 rounded-[3rem] md:rounded-[5rem] shadow-inner border border-stone-100 dark:border-stone-800 relative overflow-hidden space-y-12 md:space-y-20"
        style={{ fontSize: `${fontSize}rem`, lineHeight: '1.8' }}
      >
        <Icons.Cross className="absolute top-10 right-10 w-20 h-20 opacity-[0.03] pointer-events-none" />

        {viewMode === 'missal' && (
          <section className="space-y-6">
            <span className="block text-[0.6em] font-black uppercase text-sacred italic border-b border-sacred/10 pb-2">Ritos Iniciais</span>
            <p className="font-serif">"Em nome do Pai, e do Filho, e do Espírito Santo. Amém."</p>
          </section>
        )}

        <div className="space-y-6">
           <h4 className="text-[0.6em] font-black uppercase tracking-widest text-sacred">Oração Coleta</h4>
           <p className="font-serif italic text-stone-700 dark:text-stone-300">"{data?.collect}"</p>
        </div>

        <section className="space-y-8">
           <header className="flex justify-between items-end border-b border-sacred/10 pb-4">
              <div>
                 <span className="text-[0.5em] font-black uppercase text-stone-400 block mb-1">Leitura I</span>
                 <h4 className="text-[0.8em] font-serif font-bold text-stone-900 dark:text-white leading-tight">{data?.firstReading.reference}</h4>
              </div>
              <ActionButtons itemId={`lit1_${date}`} type="liturgy" title="I Leitura" content={data?.firstReading.text} />
           </header>
           <p className="font-serif text-stone-800 dark:text-stone-200">{data?.firstReading.text}</p>
        </section>

        <section className="bg-stone-50 dark:bg-stone-950 p-8 md:p-14 rounded-[3rem] border-l-8 border-sacred shadow-xl">
           <span className="text-[0.5em] font-black uppercase text-sacred block mb-6 text-center">Salmo Responsorial</span>
           <div className="text-center space-y-8">
              <p className="text-2xl md:text-3xl font-serif italic text-sacred font-bold leading-tight">R/. {data?.psalm.title}</p>
              <div className="h-px w-12 bg-sacred/20 mx-auto" />
              <p className="font-serif whitespace-pre-wrap italic">{data?.psalm.text}</p>
           </div>
        </section>

        <section className="space-y-10 relative">
           <div className="absolute -left-10 top-0 bottom-0 w-1 bg-sacred/10 hidden md:block" />
           <header className="flex justify-between items-end border-b border-sacred/10 pb-4">
              <div>
                 <span className="text-[0.5em] font-black uppercase text-sacred block mb-1">Evangelho</span>
                 <h4 className="text-[0.8em] font-serif font-bold text-stone-900 dark:text-white leading-tight">{data?.gospel.reference}</h4>
              </div>
              <ActionButtons itemId={`litg_${date}`} type="liturgy" title="Evangelho" content={data?.gospel.text} />
           </header>
           <p className="font-serif font-bold text-stone-900 dark:text-stone-100 first-letter:text-8xl first-letter:text-sacred first-letter:float-left first-letter:mr-4 first-letter:mt-2">
             {data?.gospel.text}
           </p>
        </section>

        <section className="bg-stone-900 p-8 md:p-20 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group">
           <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-gold text-stone-900 rounded-3xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                    <Icons.Feather className="w-8 h-8" />
                 </div>
                 <h4 className="text-3xl font-serif font-bold text-gold">Homilia do Dia</h4>
              </div>
              <div className="prose prose-invert max-w-none font-serif text-xl md:text-2xl leading-relaxed italic text-white/90">
                {data?.gospel.homily || data?.gospel.reflection}
              </div>
           </div>
        </section>

        {/* Fontes da Verdade (Grounding Section) */}
        {sources.length > 0 && (
          <footer className="pt-10 border-t border-stone-100 dark:border-stone-800 space-y-4">
             <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Icons.Globe className="w-3 h-3" /> Fontes Verificadas
             </h5>
             <div className="flex flex-wrap gap-2">
                {sources.map((src, idx) => (
                   <a 
                    key={idx} 
                    href={src.web?.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-full text-[9px] font-bold text-stone-500 hover:text-gold transition-colors truncate max-w-[200px]"
                   >
                     {src.web?.title || 'Referência Externa'}
                   </a>
                ))}
             </div>
          </footer>
        )}
      </article>

      <footer className="text-center opacity-30 pt-20">
         <p className="text-[10px] font-black uppercase tracking-[1em]">Verbum Domini • Deo Gratias</p>
      </footer>
    </div>
  );
};

export default DailyLiturgy;
