
import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'catecismo' | 'magisterio' | 'dogmas' | 'santos'>('catecismo');
  const [isReading, setIsReading] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const handleHighlight = () => {
      setHighlights(JSON.parse(localStorage.getItem('cathedra_highlights') || '[]'));
    };
    window.addEventListener('highlight-change', handleHighlight);
    handleHighlight();
    return () => window.removeEventListener('highlight-change', handleHighlight);
  }, []);

  const handleStudy = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await getIntelligentStudy(query);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeech = async () => {
    if (isReading) {
      audioSource?.stop();
      setIsReading(false);
      return;
    }
    if (!data?.summary) return;
    setIsReading(true);
    try {
      const base64Audio = await generateSpeech(data.summary);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsReading(false);
      source.start();
      setAudioSource(source);
    } catch (err) {
      setIsReading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-stone-950 flex flex-col pb-24">
      
      {/* Search Header adaptável */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 px-6 py-8 flex flex-col gap-6 sticky top-0 z-50 shadow-sm">
        <div className="relative flex-1">
          <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleStudy()}
            placeholder="Mergulhar na Tradição..."
            className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-200 dark:border-stone-700 rounded-2xl outline-none font-serif italic text-lg"
          />
        </div>
        
        <div className="flex gap-4">
           {data && (
             <button onClick={toggleSpeech} className={`p-4 rounded-xl transition-all shadow-md ${isReading ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>
               <Icons.Audio className="w-5 h-5" />
             </button>
           )}
           <button onClick={handleStudy} disabled={loading} className="flex-1 py-4 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50">
             {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" /> : "Iniciar Estudo"}
           </button>
        </div>
      </div>

      {data && (
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Coluna Bíblica / Síntese */}
          <div className="w-full md:w-1/2 p-6 md:p-12 space-y-12">
            <header className="space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8b0000] dark:text-[#d4af37]">Síntese Teológica</span>
              <div className="bg-[#fcf8e8] dark:bg-stone-900 p-8 rounded-3xl border border-[#d4af37]/20 shadow-inner relative">
                <ActionButtons itemId={`summary_${data.topic}`} textToCopy={data.summary} className="absolute top-4 right-4" />
                <p className="italic font-serif text-xl md:text-2xl leading-relaxed text-stone-900 dark:text-stone-100">"{data.summary}"</p>
              </div>
            </header>

            <div className="space-y-8">
              {data.bibleVerses.map((v, i) => {
                const vid = `verse_${v.book}_${v.chapter}_${v.verse}`;
                return (
                  <div key={i} className={`p-6 rounded-2xl border-l-8 transition-all ${highlights.includes(vid) ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-[#d4af37] uppercase">{v.book} {v.chapter}:{v.verse}</span>
                      <ActionButtons itemId={vid} textToCopy={v.text} />
                    </div>
                    <p className="font-serif text-lg md:text-xl text-stone-900 dark:text-stone-200 italic leading-snug">"{v.text}"</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Magistério adaptada para Tabs Mobile */}
          <div className="w-full md:w-1/2 bg-[#FBF9F5] dark:bg-stone-900/50 flex flex-col p-6 md:p-12 space-y-8">
            <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
              {(['catecismo', 'magisterio', 'dogmas', 'santos'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`flex-shrink-0 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#8b0000] text-white' : 'bg-white dark:bg-stone-800 text-stone-400 border border-stone-100 dark:border-stone-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="space-y-6">
              {activeTab === 'catecismo' && data.catechismParagraphs.map((p, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 relative group">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-black text-[#8b0000] dark:text-[#d4af37] uppercase tracking-widest">CIC {p.number}</span>
                    <ActionButtons itemId={`cic_${p.number}`} textToCopy={p.content} />
                  </div>
                  <p className="text-stone-900 dark:text-stone-200 italic font-serif text-lg leading-relaxed">"{p.content}"</p>
                </div>
              ))}
              
              {activeTab === 'magisterio' && data.magisteriumDocs.map((doc, i) => (
                <div key={i} className="bg-[#1a1a1a] p-8 rounded-3xl text-white shadow-lg space-y-4">
                  <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">{doc.source}</span>
                  <h4 className="font-serif text-xl font-bold text-[#d4af37] leading-tight">{doc.title}</h4>
                  <p className="text-base text-stone-300 italic font-serif leading-relaxed opacity-95">"{doc.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMode;
