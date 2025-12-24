
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

  const handleStudy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      console.error("Erro no áudio:", err);
      setIsReading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-[#FDFCF8] overflow-hidden -mt-10 -mx-12 rounded-[4rem] border border-stone-200 shadow-3xl animate-in slide-in-from-top-10 duration-1000 relative">
      
      {/* Search Header Fixo */}
      <div className="bg-white/95 backdrop-blur-md border-b border-stone-100 px-16 py-12 flex flex-col md:flex-row items-center justify-between gap-12 z-50 shadow-sm relative no-print">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#8b0000] via-[#d4af37] to-[#8b0000]" />
        
        <div className="flex-1 w-full max-w-4xl relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleStudy()}
            placeholder="Mergulhe na Veritatis Splendor..."
            className="w-full pl-16 pr-8 py-8 bg-stone-50 border border-stone-200 rounded-[2.5rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none font-serif italic text-3xl md:text-4xl shadow-inner transition-all placeholder:text-stone-300"
          />
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-[#d4af37] animate-pulse" />
        </div>
        
        <div className="flex items-center gap-8 w-full md:w-auto">
           {data && (
             <button onClick={toggleSpeech} className={`p-8 rounded-[2rem] transition-all shadow-2xl group ${isReading ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-[#fcf8e8] text-stone-600 hover:bg-[#d4af37] hover:text-white'}`}>
               <Icons.Audio className={`w-8 h-8 ${isReading ? '' : 'group-hover:scale-125 transition-transform'}`} />
             </button>
           )}
           <button onClick={() => handleStudy()} disabled={loading} className="flex-1 md:flex-none px-16 py-8 bg-[#1a1a1a] text-[#d4af37] font-black rounded-[2.5rem] flex items-center justify-center gap-6 hover:bg-[#8b0000] hover:text-white transition-all shadow-3xl uppercase tracking-[0.5em] text-xs active:scale-95 disabled:opacity-50">
             {loading ? <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <><Icons.Layout className="w-7 h-7" /> <span>Estudo Relacional</span></>}
           </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 no-print">
           <div className="w-24 h-24 border-8 border-stone-100 border-t-[#d4af37] rounded-full animate-spin shadow-xl" />
           <p className="font-serif italic text-3xl text-stone-800 animate-pulse">Cruzando Bíblia e Magistério...</p>
        </div>
      )}

      {data && !loading && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden no-print">
          <div className="w-full md:w-1/2 overflow-y-auto border-r border-stone-100 p-12 md:p-24 bg-white custom-scrollbar space-y-24">
            <header className="text-center">
              <div className="flex justify-center mb-8">
                 <div className="p-4 bg-[#fcf8e8] rounded-full border border-[#d4af37]/20">
                    <Icons.Book className="w-10 h-10 text-[#d4af37]" />
                 </div>
              </div>
              <span className="text-[12px] font-black uppercase tracking-[1em] text-[#8b0000]">Sacra Scriptura</span>
              <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tighter mt-6">A Palavra</h2>
              
              <div className={`mt-16 p-12 md:p-16 rounded-[4rem] border-l-[16px] text-left shadow-2xl relative overflow-hidden group transition-colors ${highlights.includes(`summary_${data.topic}`) ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-[#fcf8e8] border-[#d4af37]'}`}>
                 <div className="sacred-watermark opacity-[0.05]" />
                 
                 <ActionButtons 
                    itemId={`summary_${data.topic}`} 
                    textToCopy={data.summary}
                    className="absolute top-8 right-8 z-20"
                 />

                 <div className="relative z-10">
                   <p className="italic font-serif text-3xl leading-relaxed text-stone-900 mb-10 tracking-tight">"{data.summary}"</p>
                 </div>
              </div>
            </header>

            <div className="space-y-24">
              {data.bibleVerses.map((v, i) => {
                const vid = `verse_${v.book}_${v.chapter}_${v.verse}`;
                return (
                  <div key={i} className={`group p-12 -mx-12 rounded-[4rem] border-l-[16px] transition-all duration-500 relative ${highlights.includes(vid) ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'hover:bg-stone-50 border-transparent hover:border-[#d4af37]'}`}>
                    <ActionButtons 
                      itemId={vid} 
                      textToCopy={`${v.book} ${v.chapter}:${v.verse} - "${v.text}"`}
                      className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <span className="text-sm font-black text-[#d4af37] uppercase tracking-[0.5em] mb-4 block">{v.book} {v.chapter}:{v.verse}</span>
                    <p className="font-serif text-4xl md:text-5xl leading-tight text-stone-900 mt-6 italic font-bold tracking-tighter">"{v.text}"</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-[#FBF9F5] flex flex-col overflow-hidden no-print">
            <div className="flex bg-white shadow-2xl border-b border-stone-100 z-30">
              {(['catecismo', 'magisterio', 'dogmas', 'santos'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`flex-1 py-12 flex flex-col items-center gap-4 text-[11px] font-black tracking-[0.6em] transition-all relative ${activeTab === tab ? 'text-[#8b0000]' : 'text-stone-300 hover:text-stone-500'}`}
                >
                  <span className="relative z-10">{tab.toUpperCase()}</span>
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-[#8b0000] animate-in slide-in-from-bottom duration-300" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 md:p-20 custom-scrollbar space-y-12 pb-32">
              {activeTab === 'catecismo' && data.catechismParagraphs.map((p, i) => {
                const pid = `cic_${p.number}`;
                return (
                  <div key={i} className={`p-14 rounded-[4rem] shadow-2xl border-l-[20px] transition-all relative group ${highlights.includes(pid) ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-white border-[#d4af37]'}`}>
                    <ActionButtons 
                      itemId={pid} 
                      textToCopy={`CIC ${p.number}: "${p.content}"`}
                      className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="flex items-center gap-4 mb-8">
                       <Icons.Cross className="w-6 h-6 text-[#d4af37]" />
                       <h4 className="font-black text-[#8b0000] uppercase text-xs tracking-[0.5em]">Catecismo • Parágrafo {p.number}</h4>
                    </div>
                    <p className="text-stone-900 italic font-serif text-3xl leading-relaxed tracking-tight">"{p.content}"</p>
                  </div>
                );
              })}
              
              {activeTab === 'magisterio' && data.magisteriumDocs.map((doc, i) => (
                <div key={i} className="bg-[#1a1a1a] p-16 rounded-[4.5rem] text-white shadow-3xl relative overflow-hidden group">
                  <Icons.Cross className="absolute -top-16 -right-16 w-64 h-64 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
                  <ActionButtons itemId={`mag_${doc.title}`} textToCopy={doc.content} className="absolute top-8 right-8 z-20" />
                  <span className="text-[12px] font-black text-[#d4af37] uppercase tracking-[0.8em] mb-8 block">{doc.source}</span>
                  <h4 className="font-serif text-5xl font-bold mb-10 text-[#d4af37] leading-tight tracking-tighter">{doc.title}</h4>
                  <p className="text-3xl text-stone-300 italic font-serif leading-relaxed opacity-95">"{doc.content}"</p>
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
