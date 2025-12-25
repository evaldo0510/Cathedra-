
import React, { useState, useEffect, useRef, memo } from 'react';
import { Icons } from '../constants';
import { getIntelligentStudy, generateSpeech } from '../services/gemini';
import { StudyResult } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import ActionButtons from '../components/ActionButtons';

const StudyMode: React.FC<{ data?: StudyResult | null, onSearch: (topic: string) => void }> = ({ data: initialData, onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StudyResult | null>(initialData || null);
  const [history, setHistory] = useState<StudyResult[]>([]);
  const [isReading, setIsReading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cathedra_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Update history when new data arrives
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      saveToHistory(initialData);
    }
  }, [initialData]);

  const saveToHistory = (newItem: StudyResult) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.topic.toLowerCase() !== newItem.topic.toLowerCase());
      const updated = [newItem, ...filtered].slice(0, 10);
      localStorage.setItem('cathedra_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleStudy = async (topic?: string) => {
    const term = topic || query;
    if (!term.trim() || loading) return;
    setLoading(true);
    try {
      const result = await getIntelligentStudy(term);
      setData(result);
      saveToHistory(result);
      onSearch(term); // Sync with parent if needed
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
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
      setIsReading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-12 animate-in fade-in duration-700 px-4 md:px-0">
      <header className="text-center space-y-8">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tighter leading-none">
          Estudo Relacional
        </h2>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleStudy()}
            placeholder="Tema de investigação (ex: Justificação, Eucaristia...)"
            className="flex-1 px-8 py-5 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-3xl outline-none font-serif italic text-xl shadow-xl focus:border-[#d4af37] transition-all"
          />
          <button 
            onClick={() => handleStudy()}
            disabled={loading}
            className="px-10 py-5 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Pesquisar'}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* History Sidebar */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl sticky top-24">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 mb-6 flex items-center gap-3">
               <Icons.History className="w-4 h-4" /> Memorial de Estudos
             </h3>
             <div className="space-y-3">
                {history.map((h, i) => (
                  <button 
                    key={i} 
                    onClick={() => setData(h)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${data?.topic === h.topic ? 'bg-[#fcf8e8] dark:bg-stone-800 border-[#d4af37] shadow-sm' : 'hover:bg-stone-50 dark:hover:bg-stone-800 border-transparent'}`}
                  >
                    <p className="font-serif font-bold text-stone-800 dark:text-stone-100 truncate text-sm">{h.topic}</p>
                    <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-1">Investigado em {new Date().toLocaleDateString()}</p>
                  </button>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-10 opacity-20">
                    <Icons.Layout className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                  </div>
                )}
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-12">
          {loading ? (
            <div className="space-y-12 animate-pulse">
               <div className="h-80 bg-white dark:bg-stone-900 rounded-[4rem]" />
               <div className="h-40 bg-white dark:bg-stone-900 rounded-[4rem]" />
            </div>
          ) : data ? (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
              <section className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#d4af37]">Síntese Teológica</span>
                    <h3 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-2">{data.topic}</h3>
                  </div>
                  <button 
                    onClick={handleReadSummary}
                    className={`p-4 rounded-full transition-all shadow-lg ${isReading ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-[#d4af37] text-stone-900'}`}
                  >
                    <Icons.Audio className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-2xl md:text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed border-l-8 border-[#d4af37]/20 pl-8">
                  "{data.summary}"
                </p>
                
                {/* Search Grounding Sources for Study Result */}
                {data.sources && data.sources.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-stone-100 dark:border-stone-800">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-4">Fontes Bibliográficas Digitais</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.sources.map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl hover:bg-[#fcf8e8] dark:hover:bg-stone-700 transition-colors group">
                           <Icons.Globe className="w-4 h-4 text-[#d4af37]" />
                           <span className="text-xs font-serif italic text-stone-600 dark:text-stone-300 truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Bible Section */}
              <div className="grid gap-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-4">Fundamentação Bíblica</h4>
                 {data.bibleVerses.map((v, i) => (
                   <article key={i} className="p-10 rounded-[3.5rem] bg-white dark:bg-stone-900 shadow-xl border border-stone-100 dark:border-stone-800">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-[#8b0000] dark:text-[#d4af37] uppercase tracking-widest">{v.book} {v.chapter}:{v.verse}</span>
                        <ActionButtons itemId={`v_${v.book}_${v.chapter}_${v.verse}`} textToCopy={v.text} />
                      </div>
                      <p className="text-2xl font-serif italic text-stone-800 dark:text-stone-200">"{v.text}"</p>
                   </article>
                 ))}
              </div>

              {/* Catechism Section */}
              <div className="grid gap-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-4">Catecismo da Igreja</h4>
                 {data.catechismParagraphs.map((p, i) => (
                   <article key={i} className="p-10 rounded-[3.5rem] bg-stone-50 dark:bg-stone-800/50 shadow-inner border border-stone-100 dark:border-stone-700 flex flex-col md:flex-row gap-8 items-start">
                      <div className="bg-[#1a1a1a] text-[#d4af37] px-6 py-2 rounded-full text-[10px] font-black">CIC {p.number}</div>
                      <p className="text-xl font-serif text-stone-700 dark:text-stone-300 flex-1">"{p.content}"</p>
                   </article>
                 ))}
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-stone-50 dark:bg-stone-900/40 rounded-[5rem] border-2 border-dashed border-stone-100 dark:border-stone-800 shadow-inner group">
               <Icons.Layout className="w-20 h-20 text-stone-200 dark:text-stone-700 mb-8" />
               <p className="text-2xl font-serif italic text-stone-400">Inicie uma nova investigação teológica.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudyMode;
