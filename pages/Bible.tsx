
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getDogmaticLinksForVerses } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
import { Verse, Dogma } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();

const Bible: React.FC<{ onDeepDive?: (topic: string) => void }> = ({ onDeepDive }) => {
  const [query, setQuery] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsReading(null);
  };

  const toggleSpeech = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    if (isReading === vid) {
      stopAudio();
      return;
    }
    stopAudio();
    setIsReading(vid);
    try {
      const textToRead = `${verse.book}, ${verse.chapter}, ${verse.verse}. ${verse.text}`;
      const base64Audio = await generateSpeech(textToRead);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReading(null);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      stopAudio();
    }
  };

  const loadChapter = async (book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setLoading(true);
    setVerses([]);
    stopAudio();
    try {
      const data = await fetchLocalChapter(selectedVersion.id, book, chapter);
      setVerses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4 md:px-0 animate-in fade-in duration-700">
      <header className="mb-8 text-center space-y-4">
        <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Scriptura</h2>
        
        <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2 justify-center">
           {BIBLE_VERSIONS.map(v => (
             <button 
               key={v.id}
               onClick={() => setSelectedVersion(v)}
               className={`flex-shrink-0 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${selectedVersion.id === v.id ? 'bg-[#8b0000] text-white border-[#8b0000]' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800'}`}
             >
               {v.name}
             </button>
           ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Seletor de Livros adaptado para Mobile Drawer-like */}
        <aside className={`lg:col-span-4 space-y-6 ${!showBookSelector && 'hidden lg:block'}`}>
           <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 h-fit">
              <div className="flex border-b border-stone-100 dark:border-stone-800 mb-6 p-1 bg-stone-50 dark:bg-stone-800 rounded-full">
                {['Antigo Testamento', 'Novo Testamento'].map(testament => (
                  <button 
                    key={testament}
                    onClick={() => setActiveTestament(testament as any)} 
                    className={`flex-1 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTestament === testament ? 'bg-white dark:bg-stone-700 text-[#8b0000] dark:text-[#d4af37] shadow-sm' : 'text-stone-300'}`}
                  >
                    {testament.split(' ')[0]}
                  </button>
                ))}
              </div>
              
              <div className="h-[500px] overflow-y-auto custom-scrollbar space-y-8">
                {Object.entries(CANON[activeTestament]).map(([category, books]) => (
                  <div key={category} className="space-y-4">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-[#d4af37] border-b border-stone-50 dark:border-stone-800 pb-2 flex items-center gap-2">
                      {category}
                    </h5>
                    <div className="flex flex-col gap-2">
                      {(books as string[]).map(book => (
                        <button 
                          key={book} 
                          onClick={() => { setSelectedBook(book); setSelectedChapter(null); }}
                          className={`text-left px-5 py-3 rounded-xl transition-all font-serif italic text-lg ${selectedBook === book ? 'bg-[#fcf8e8] dark:bg-stone-800 text-[#8b0000] dark:text-[#d4af37] font-bold border-l-4 border-[#d4af37]' : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                          {book}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </aside>

        {/* Área Principal de Leitura */}
        <main className={`lg:col-span-8 space-y-8 ${showBookSelector && 'hidden lg:block'}`}>
          {selectedBook && (
            <div className="bg-white dark:bg-stone-900 p-6 md:p-12 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
               <div className="flex items-center justify-between mb-8">
                  <button onClick={() => setShowBookSelector(true)} className="lg:hidden p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                    <Icons.Home className="w-5 h-5 text-[#d4af37]" />
                  </button>
                  <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook}</h3>
                  <div className="w-10 h-10" />
               </div>
               
               {/* Grid de Capítulos Amigável ao Mobile */}
               <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {[...Array(50)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => loadChapter(selectedBook, i + 1)}
                      className={`h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${selectedChapter === i + 1 ? 'bg-[#8b0000] text-white shadow-md scale-110' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-6">
            {loading ? (
               <div className="space-y-4 animate-pulse">{[1, 2].map(n => <div key={n} className="h-40 bg-white rounded-3xl" />)}</div>
            ) : verses.map((v, i) => (
              <article key={i} className={`p-8 rounded-3xl border-l-8 bg-white dark:bg-stone-900 shadow-md transition-all relative group ${isReading === `${v.book}_${v.chapter}_${v.verse}` ? 'border-[#8b0000] bg-[#fcf8e8] dark:bg-stone-800' : 'border-stone-100 dark:border-stone-800'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase text-[#d4af37]">{v.book} {v.chapter}:{v.verse}</span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleSpeech(v)} className="p-2 text-stone-300 hover:text-[#d4af37]"><Icons.Audio className="w-5 h-5" /></button>
                    <ActionButtons itemId={`${v.book}_${v.chapter}_${v.verse}`} textToCopy={v.text} />
                  </div>
                </div>
                <p className="text-xl md:text-3xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug">"{v.text}"</p>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Bible;
