
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getIntelligentStudy, generateSpeech } from '../services/gemini';
import { StudyResult } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import ActionButtons from '../components/ActionButtons';

interface StudyModeProps {
  data?: StudyResult | null;
  onSearch: (topic: string) => void;
}

const StudyMode: React.FC<StudyModeProps> = ({ data: initialData, onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StudyResult | null>(initialData || null);
  const [history, setHistory] = useState<StudyResult[]>([]);
  const [isReading, setIsReading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('cathedra_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (initialData) setData(initialData);
  }, [initialData]);

  const handleStudy = async (topic?: string) => {
    const term = topic || query;
    if (!term.trim()) return;
    setLoading(true);
    try {
      const result = await getIntelligentStudy(term);
      setData(result);
      // Atualizar histórico local após a busca
      const saved = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      setHistory(saved);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsReading(false);
  };

  const handleReadSummary = async () => {
    if (isReading) {
      stopAudio();
      return;
    }
    if (!data?.summary) return;
    
    setIsReading(true);
    try {
      const base64 = await generateSpeech(data.summary);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const bytes = decodeBase64(base64);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReading(false);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      console.error(err);
      setIsReading(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    const shareText = `🏛️ *Cathedra Digital - Estudo Teológico*\n\n*Tema:* ${data.topic}\n\n*Síntese:* ${data.summary}\n\nExplore mais na plataforma Cathedra.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Estudo Cathedra', text: shareText, url: window.location.href });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Copiado para a área de transferência!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-8">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tighter">Estudo Relacional</h2>
        
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleStudy()}
            placeholder="Qual verdade deseja investigar hoje?"
            className="flex-1 px-8 py-5 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-3xl outline-none font-serif italic text-xl shadow-xl focus:border-[#d4af37] transition-all"
          />
          <button 
            onClick={() => handleStudy()}
            disabled={loading}
            className="px-10 py-5 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
          >
            {loading ? 'Consultando...' : 'Pesquisar'}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Histórico e Destaques (Sidebar) */}
        <aside className="lg:col-span-3 space-y-8 hidden lg:block">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 mb-6 flex items-center gap-3">
               <Icons.History className="w-4 h-4" /> Histórico
             </h3>
             <div className="space-y-3">
                {history.map((h, i) => (
                  <button 
                    key={i} 
                    onClick={() => setData(h)}
                    className="w-full text-left p-4 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-100 dark:hover:border-stone-700 group"
                  >
                    <p className="font-serif font-bold text-stone-800 dark:text-stone-200 group-hover:text-[#8b0000] transition-colors truncate">{h.topic}</p>
                  </button>
                ))}
                {history.length === 0 && <p className="text-xs text-stone-300 italic">Nenhum estudo recente.</p>}
             </div>
          </div>
        </aside>

        {/* Resultados principais */}
        <main className="lg:col-span-9 space-y-12">
          {data ? (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
              <section className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#d4af37]">Síntese Teológica</span>
                    <h3 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-2">{data.topic}</h3>
                  </div>
                  <div className="flex gap-3">
                     <button 
                       onClick={handleReadSummary}
                       className={`p-4 rounded-full transition-all shadow-lg ${isReading ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-[#d4af37] text-stone-900'}`}
                       title="Ouvir Síntese"
                     >
                        <Icons.Audio className="w-6 h-6" />
                     </button>
                     <button 
                       onClick={handleShare}
                       className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-[#d4af37] transition-all shadow-sm"
                     >
                        <Icons.Globe className="w-6 h-6" />
                     </button>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed border-l-8 border-[#d4af37]/20 pl-8">
                  "{data.summary}"
                </p>
              </section>

              {/* Versículos */}
              <div className="grid gap-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-4">Fundamentação Bíblica</h4>
                 {data.bibleVerses.map((v, i) => (
                   <article key={i} className="p-10 rounded-[3.5rem] bg-white dark:bg-stone-900 shadow-xl border border-stone-100 dark:border-stone-800 relative group">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-[#8b0000] dark:text-[#d4af37] uppercase tracking-widest">{v.book} {v.chapter}:{v.verse}</span>
                        <ActionButtons itemId={`v_${v.book}_${v.chapter}_${v.verse}`} textToCopy={v.text} />
                      </div>
                      <p className="text-2xl font-serif italic text-stone-800 dark:text-stone-200">"{v.text}"</p>
                   </article>
                 ))}
              </div>

              {/* Catecismo */}
              <div className="grid gap-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-4">Catecismo da Igreja</h4>
                 {data.catechismParagraphs.map((p, i) => (
                   <article key={i} className="p-10 rounded-[3.5rem] bg-stone-50 dark:bg-stone-800/50 shadow-inner border border-stone-100 dark:border-stone-700 flex flex-col md:flex-row gap-8 items-start">
                      <div className="bg-[#1a1a1a] text-[#d4af37] px-6 py-2 rounded-full text-[10px] font-black">CIC {p.number}</div>
                      <p className="text-xl font-serif text-stone-700 dark:text-stone-300 flex-1">"{p.content}"</p>
                      <ActionButtons itemId={`cic_${p.number}`} textToCopy={p.content} />
                   </article>
                 ))}
              </div>
            </div>
          ) : !loading && (
            <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-stone-50 dark:bg-stone-900/40 rounded-[5rem] border-2 border-dashed border-stone-100 dark:border-stone-800">
               <Icons.Layout className="w-20 h-20 text-stone-200 dark:text-stone-700 mb-8" />
               <p className="text-2xl font-serif italic text-stone-400">Inicie uma nova investigação teológica para começar.</p>
            </div>
          )}

          {loading && (
            <div className="space-y-12 animate-pulse">
               <div className="h-80 bg-white dark:bg-stone-900 rounded-[4rem]" />
               <div className="h-40 bg-white dark:bg-stone-900 rounded-[4rem]" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudyMode;
