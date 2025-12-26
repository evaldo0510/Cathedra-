
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getVerseCommentary } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
import { Verse } from '../types';
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
  const [selectedVerseForCommentary, setSelectedVerseForCommentary] = useState<Verse | null>(null);
  const [commentary, setCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [lastRead, setLastRead] = useState<{ book: string; chapter: number } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_last_read');
    if (saved) {
      setLastRead(JSON.parse(saved));
    }
  }, []);

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

    const progress = { book, chapter };
    localStorage.setItem('cathedra_last_read', JSON.stringify(progress));
    setLastRead(progress);

    try {
      const data = await fetchLocalChapter(selectedVersion.id, book, chapter);
      setVerses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setShowBookSelector(false);
    try {
      const result = await searchVerse(query);
      if (result && result.text) {
        setVerses([result]);
        setSelectedBook(result.book);
        setSelectedChapter(result.chapter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCommentary = async (verse: Verse) => {
    setSelectedVerseForCommentary(verse);
    setLoadingCommentary(true);
    setCommentary('');
    try {
      const text = await getVerseCommentary(verse);
      setCommentary(text);
    } catch (err) {
      setCommentary("Erro ao carregar comentários.");
    } finally {
      setLoadingCommentary(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4 md:px-0 animate-in fade-in duration-700 overflow-x-hidden">
      
      {/* Modal de Comentários Otimizado */}
      {selectedVerseForCommentary && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-3xl rounded-[2.5rem] p-6 md:p-14 shadow-3xl border-t-[8px] md:border-t-[12px] border-[#8b0000] relative overflow-hidden flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setSelectedVerseForCommentary(null)}
              className="absolute top-4 md:top-8 right-4 md:right-8 p-2 md:p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-[#8b0000] hover:text-white transition-all z-10"
            >
              <Icons.Cross className="w-5 h-5 md:w-6 md:h-6 rotate-45" />
            </button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 md:space-y-8 pr-2 md:pr-4 mt-8 md:mt-0">
              <header className="space-y-2 md:space-y-4">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[#d4af37]">Luz da Tradição</span>
                <h3 className="text-2xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {selectedVerseForCommentary.book} {selectedVerseForCommentary.chapter}:{selectedVerseForCommentary.verse}
                </h3>
                <p className="text-lg md:text-xl italic font-serif text-stone-500 dark:text-stone-400">"{selectedVerseForCommentary.text}"</p>
              </header>

              <div className="prose dark:prose-invert max-w-none">
                {loadingCommentary ? (
                  <div className="space-y-4 md:space-y-6 py-6 md:py-10">
                    <div className="h-4 md:h-6 w-full bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
                    <div className="h-4 md:h-6 w-5/6 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
                    <div className="h-20 md:h-40 w-full bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
                  </div>
                ) : (
                  <div className="text-base md:text-xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                    {commentary}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8 md:mb-12 text-center space-y-6 md:space-y-10">
        <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Scriptura</h2>
        
        <div className="max-w-2xl mx-auto relative group px-2">
          <Icons.Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-[#d4af37]" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
            placeholder="Pesquise tema ou versículo..."
            className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-4 md:py-7 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[1.8rem] md:rounded-[2.5rem] outline-none font-serif italic text-lg md:text-2xl shadow-xl transition-all"
          />
        </div>

        {showBookSelector && lastRead && (
          <div className="max-w-xl mx-auto px-4 animate-in slide-in-from-top-4 duration-500">
             <button 
              onClick={() => loadChapter(lastRead.book, lastRead.chapter)}
              className="w-full flex items-center justify-between p-4 md:p-6 bg-[#fcf8e8] dark:bg-stone-900 border border-[#d4af37]/30 rounded-[1.5rem] md:rounded-[2rem] shadow-lg group active:scale-95 transition-all"
             >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-white dark:bg-stone-800 rounded-full shadow-sm">
                    <Icons.History className="w-4 h-4 md:w-5 md:h-5 text-[#8b0000] dark:text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-stone-400">Continuar Lendo</p>
                    <p className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-white">{lastRead.book} {lastRead.chapter}</p>
                  </div>
                </div>
                <Icons.Feather className="w-5 h-5 md:w-6 md:h-6 text-[#d4af37]" />
             </button>
          </div>
        )}

        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2 justify-start md:justify-center px-4">
             {BIBLE_VERSIONS.map(v => (
               <button 
                 key={v.id}
                 onClick={() => setSelectedVersion(v)}
                 className={`flex-shrink-0 px-5 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedVersion.id === v.id ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800'}`}
               >
                 {v.name}
               </button>
             ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
        <aside className={`lg:col-span-4 space-y-6 md:space-y-8 ${!showBookSelector && 'hidden lg:block'}`}>
           <div className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-stone-100 dark:border-stone-800">
              <div className="flex border-2 border-stone-50 dark:border-stone-800 mb-6 p-1 bg-stone-50 dark:bg-stone-800 rounded-full">
                {['Antigo', 'Novo'].map((testament, idx) => {
                  const label = testament === 'Antigo' ? 'Antigo Testamento' : 'Novo Testamento';
                  return (
                    <button 
                      key={testament}
                      onClick={() => setActiveTestament(label as any)} 
                      className={`flex-1 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTestament === label ? 'bg-white dark:bg-stone-700 text-[#8b0000] dark:text-[#d4af37] shadow-sm' : 'text-stone-300'}`}
                    >
                      {testament}
                    </button>
                  );
                })}
              </div>
              
              <div className="max-h-[400px] md:max-h-[550px] overflow-y-auto custom-scrollbar space-y-8 pr-2">
                {Object.entries(CANON[activeTestament]).map(([category, books]) => (
                  <div key={category} className="space-y-3">
                    <h5 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37] border-b-2 border-stone-50 dark:border-stone-800 pb-2">
                      {category}
                    </h5>
                    <div className="flex flex-col gap-1">
                      {(books as string[]).map(book => (
                        <button 
                          key={book} 
                          onClick={() => { setSelectedBook(book); setSelectedChapter(null); }}
                          className={`text-left px-4 py-3 rounded-xl transition-all font-serif italic text-lg md:text-xl ${selectedBook === book ? 'bg-[#fcf8e8] dark:bg-stone-800 text-[#8b0000] dark:text-[#d4af37] font-bold' : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
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

        <main className={`lg:col-span-8 space-y-6 md:space-y-10 ${showBookSelector && 'hidden lg:block'}`}>
          {selectedBook && (
            <div className="bg-white dark:bg-stone-900 p-6 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800">
               <div className="flex items-center justify-between mb-8">
                  <button onClick={() => setShowBookSelector(true)} className="lg:hidden p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                    <Icons.Home className="w-5 h-5 text-[#d4af37]" />
                  </button>
                  <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">{selectedBook}</h3>
                  <div className="w-10 h-10 lg:hidden" />
               </div>
               
               <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
                  {[...Array(selectedBook === 'Salmos' ? 150 : 50)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => loadChapter(selectedBook, i + 1)}
                      className={`h-10 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-base md:text-xl transition-all active:scale-90 ${selectedChapter === i + 1 ? 'bg-[#8b0000] text-white shadow-md' : 'bg-stone-50 dark:bg-stone-800 text-stone-300'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-6">
            {loading ? (
               <div className="space-y-6 animate-pulse">
                 {[1, 2, 3].map(n => <div key={n} className="h-32 md:h-48 bg-white dark:bg-stone-900 rounded-[2rem]" />)}
               </div>
            ) : verses.map((v, i) => (
              <article key={i} className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border-l-[8px] md:border-l-[12px] bg-white dark:bg-stone-900 shadow-xl transition-all relative group animate-in slide-in-from-bottom-6 ${isReading === `${v.book}_${v.chapter}_${v.verse}` ? 'border-[#8b0000] bg-[#fcf8e8] dark:bg-stone-800' : 'border-stone-100 dark:border-stone-800'}`}>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#d4af37]">{v.book} {v.chapter}:{v.verse}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openCommentary(v)} className="p-2 md:p-3 bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-[#8b0000] rounded-xl"><Icons.Feather className="w-4 h-4 md:w-5 md:h-5" /></button>
                    <button onClick={() => toggleSpeech(v)} className={`p-2 md:p-3 rounded-xl ${isReading === `${v.book}_${v.chapter}_${v.verse}` ? 'bg-[#8b0000] text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-300'}`}><Icons.Audio className="w-4 h-4 md:w-5 md:h-5" /></button>
                    <ActionButtons itemId={`${v.book}_${v.chapter}_${v.verse}`} textToCopy={v.text} />
                  </div>
                </div>
                <p className="text-xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug">"{v.text}"</p>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Bible;
