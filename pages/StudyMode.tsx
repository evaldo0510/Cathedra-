
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

type StudyTab = 'scripture' | 'catechism' | 'magisterium' | 'saints';

const StudyMode: React.FC<StudyModeProps> = ({ data: initialData, onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StudyResult | null>(initialData || null);
  const [activeTab, setActiveTab] = useState<StudyTab>('scripture');
  const [isReading, setIsReading] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [history, setHistory] = useState<StudyResult[]>([]);

  useEffect(() => {
    if (initialData) setData(initialData);
    setHistory(JSON.parse(localStorage.getItem('cathedra_history') || '[]'));
    setHighlights(JSON.parse(localStorage.getItem('cathedra_highlights') || '[]'));
  }, [initialData]);

  const handleStudy = async (topic?: string) => {
    const searchTerm = topic || query;
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const result = await getIntelligentStudy(searchTerm);
      setData(result);
      setHistory(JSON.parse(localStorage.getItem('cathedra_history') || '[]'));
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

  const handleShare = async () => {
    if (!data) return;
    const shareText = `🏛️ *Estudo Teológico Cathedra*\n\n*Tema:* ${data.topic}\n\n*Síntese:* ${data.summary}\n\nExplore mais na Cathedra Digital.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cathedra Study', text: shareText, url: window.location.href });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Texto de estudo copiado!");
    }
  };

  const TABS: { id: StudyTab; label: string; icon: any }[] = [
    { id: 'scripture', label: 'Escritura', icon: Icons.Book },
    { id: 'catechism', label: 'Catecismo', icon: Icons.Cross },
    { id: 'magisterium', label: 'Magistério', icon: Icons.Globe },
    { id: 'saints', label: 'Santos', icon: Icons.Users },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-stone-950 flex flex-col pb-32 animate-in fade-in duration-700">
      
      {/* Search Header */}
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-100 dark:border-stone-800 px-6 py-8 md:py-12 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#d4af37]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStudy()}
              placeholder="Pesquisa Teológica Avançada..."
              className="w-full pl-16 pr-6 py-5 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-200 dark:border-stone-700 rounded-3xl outline-none font-serif italic text-xl md:text-2xl focus:ring-4 focus:ring-[#d4af37]/5 transition-all"
            />
          </div>
          <button 
            onClick={() => handleStudy()} 
            disabled={loading} 
            className="px-10 py-5 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 font-black rounded-3xl uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Explorar"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 grid lg:grid-cols-12 gap-12 pt-12">
        
        {/* Sidebar: History & Highlights */}
        <aside className="lg:col-span-3 space-y-8 hidden lg:block">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 mb-6 flex items-center gap-3">
              <Icons.History className="w-4 h-4" /> Memorial
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
              {history.map((h, i) => (
                <button 
                  key={i} 
                  onClick={() => setData(h)}
                  className="w-full text-left p-4 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-100 dark:hover:border-stone-700 group"
                >
                  <p className="font-serif font-bold text-stone-800 dark:text-stone-200 group-hover:text-[#d4af37] transition-colors truncate">{h.topic}</p>
                </button>
              ))}
              {history.length === 0 && <p className="text-xs text-stone-300 italic">Nenhum estudo anterior.</p>}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-12">
          {!data && !loading && (
            <div className="text-center py-32 opacity-30">
              <Icons.Layout className="w-32 h-32 mx-auto mb-8 text-stone-200" />
              <h2 className="text-3xl font-serif italic text-stone-400">Pronto para a Disputatio.</h2>
            </div>
          )}

          {data && (
            <>
              <section className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group animate-in slide-in-from-bottom-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#d4af37]">Síntese Teológica</span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-2 tracking-tight">{data.topic}</h1>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleShare} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-[#d4af37] transition-all shadow-sm">
                      <Icons.Globe className="w-6 h-6" />
                    </button>
                    <button onClick={toggleSpeech} className={`p-4 rounded-full transition-all shadow-lg ${isReading ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-[#d4af37] text-stone-900'}`}>
                      <Icons.Audio className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <p className="font-serif italic text-2xl md:text-4xl leading-relaxed text-stone-800 dark:text-stone-200 border-l-8 border-[#d4af37]/20 pl-8">
                  "{data.summary}"
                </p>
              </section>

              <nav className="flex flex-wrap gap-4 border-b border-stone-100 dark:border-stone-800 pb-6">
                {TABS.map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 shadow-xl scale-105' : 'bg-white dark:bg-stone-800 text-stone-400'}`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </div>
                  </button>
                ))}
              </nav>

              <div className="grid gap-8 animate-in fade-in duration-500">
                {activeTab === 'scripture' && data.bibleVerses.map((v, i) => (
                  <article key={i} className={`p-10 rounded-[3rem] bg-white dark:bg-stone-900 border-l-[12px] shadow-xl relative group ${highlights.includes(`v_${v.book}_${v.chapter}_${v.verse}`) ? 'border-[#d4af37]' : 'border-stone-100 dark:border-stone-800'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black text-[#8b0000] dark:text-[#d4af37] uppercase tracking-widest">{v.book} {v.chapter}:{v.verse}</span>
                      <ActionButtons itemId={`v_${v.book}_${v.chapter}_${v.verse}`} textToCopy={v.text} />
                    </div>
                    <p className="font-serif text-2xl md:text-3xl text-stone-800 dark:text-stone-200 italic leading-snug">"{v.text}"</p>
                  </article>
                ))}

                {activeTab === 'catechism' && data.catechismParagraphs.map((p, i) => (
                  <article key={i} className={`p-10 rounded-[3rem] bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-xl relative group ${highlights.includes(`cic_${p.number}`) ? 'ring-4 ring-[#d4af37]/20 border-[#d4af37]' : ''}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black text-[#8b0000] dark:text-[#d4af37] uppercase tracking-widest">CIC {p.number}</span>
                      <ActionButtons itemId={`cic_${p.number}`} textToCopy={p.content} />
                    </div>
                    <p className="font-serif text-xl md:text-2xl text-stone-700 dark:text-stone-300 italic leading-relaxed">"{p.content}"</p>
                  </article>
                ))}
                
                {activeTab === 'magisterium' && data.magisteriumDocs.map((doc, i) => (
                  <article key={i} className="bg-[#1a1a1a] p-12 rounded-[4rem] text-white shadow-2xl space-y-6">
                    <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">{doc.source}</span>
                    <h4 className="font-serif text-3xl font-bold">{doc.title}</h4>
                    <p className="text-xl text-stone-400 italic font-serif leading-relaxed">"{doc.content}"</p>
                  </article>
                ))}

                {activeTab === 'saints' && data.saintsQuotes.map((q, i) => (
                  <article key={i} className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] shadow-xl border border-stone-50 dark:border-stone-800 flex flex-col justify-between">
                    <div className="space-y-6">
                      <Icons.Feather className="w-8 h-8 text-[#d4af37]/40" />
                      <p className="font-serif text-xl md:text-2xl italic text-stone-800 dark:text-stone-200 leading-relaxed">"{q.quote}"</p>
                    </div>
                    <cite className="mt-10 pt-6 border-t border-stone-50 dark:border-stone-800 text-[10px] font-black uppercase tracking-widest text-[#8b0000] dark:text-[#d4af37]">— {q.saint}</cite>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudyMode;
