
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Icons } from '../constants';
import { fetchRealBibleText, generateSpeech } from '../services/gemini';
import { fetchExternalBibleText } from '../services/bibleApi';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback, LATIN_BOOK_NAMES } from '../services/bibleLocal';
import { Verse, Language } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'reading' | 'library'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [secondaryVerses, setSecondaryVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]); // Ave Maria default
  const [secondaryVersion, setSecondaryVersion] = useState<BibleVersion>(BIBLE_VERSIONS[3]); 
  
  const [isParallelMode, setIsParallelMode] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<'primary' | 'secondary'>('primary');
  
  const [bookSearch, setBookSearch] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const lastScrollY = useRef(0);
  const chapterRibbonRef = useRef<HTMLDivElement>(null);

  const [lastChapters, setLastChapters] = useState<Record<string, number>>({});
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [playingVerseId, setPlayingVerseId] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const chapterCount = useMemo(() => getChapterCount(selectedBook), [selectedBook]);

  const allBooksList = useMemo(() => {
    const list: string[] = [];
    Object.values(CANON).forEach(testament => {
      Object.values(testament as any).forEach(books => {
        list.push(...(books as string[]));
      });
    });
    return list;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_last_chapters');
    if (saved) setLastChapters(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (chapterRibbonRef.current) {
      const activeBtn = chapterRibbonRef.current.querySelector(`[data-chapter="${selectedChapter}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedChapter, viewMode]);

  const updateLastChapter = (book: string, chapter: number) => {
    const next = { ...lastChapters, [book]: chapter };
    setLastChapters(next);
    localStorage.setItem('cathedra_last_chapters', JSON.stringify(next));
  };

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setPlayingVerseId(null);
  }, []);

  const fetchVersesSafe = async (book: string, chapter: number, version: BibleVersion) => {
    try {
      const cacheKey = `bible_v5_${book}_${chapter}_${version.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);

      // Tenta API externa primeiro (para Vulgata/DRB)
      const apiData = await fetchExternalBibleText(book, chapter, version.slug);
      if (apiData && apiData.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(apiData));
        return apiData;
      }

      // Tenta Gemini para Ave Maria/Jerusalém (IA versions)
      const aiData = await fetchRealBibleText(book, chapter, version.name, version.lang as any);
      if (aiData && aiData.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(aiData));
        return aiData;
      }

      return fetchLocalFallback(book, chapter);
    } catch (err) {
      return fetchLocalFallback(book, chapter);
    }
  };

  const loadContent = useCallback(async () => {
    if (viewMode !== 'reading') return;
    
    setLoading(true);
    setVerses([]);
    stopAudio();
    
    try {
      const mainPromise = fetchVersesSafe(selectedBook, selectedChapter, selectedVersion);
      const secondaryPromise = isParallelMode 
        ? fetchVersesSafe(selectedBook, selectedChapter, secondaryVersion)
        : Promise.resolve([]);

      const [mainRes, secondaryRes] = await Promise.all([mainPromise, secondaryPromise]);
      
      setVerses(mainRes);
      setSecondaryVerses(secondaryRes);
      updateLastChapter(selectedBook, selectedChapter);
    } catch (e) {
      setVerses(fetchLocalFallback(selectedBook, selectedChapter));
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, selectedVersion, secondaryVersion, viewMode, isParallelMode, stopAudio]);

  useEffect(() => { loadContent(); }, [loadContent]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const winScroll = currentScrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? (winScroll / height) * 100 : 0);
      setIsScrollingUp(currentScrollY < lastScrollY.current || currentScrollY < 100);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNextChapter = () => {
    if (selectedChapter < chapterCount) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      const idx = allBooksList.indexOf(selectedBook);
      if (idx < allBooksList.length - 1) {
        setSelectedBook(allBooksList[idx + 1]);
        setSelectedChapter(1);
      }
    }
    setSelectedVerseKey(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      const idx = allBooksList.indexOf(selectedBook);
      if (idx > 0) {
        const prevBook = allBooksList[idx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(getChapterCount(prevBook));
      }
    }
    setSelectedVerseKey(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmChapter = (ch: number) => {
    setSelectedChapter(ch);
    setViewMode('reading');
    setShowChapterSelector(false);
    setShowBookSelector(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayVerse = async (v: Verse, id: string) => {
    if (playingVerseId === id) { stopAudio(); return; }
    stopAudio();
    setPlayingVerseId(id);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const base64Data = await generateSpeech(v.text);
      if (base64Data) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Data), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => { setPlayingVerseId(null); audioSourceRef.current = null; };
        audioSourceRef.current = source;
        source.start(0);
      } else { setPlayingVerseId(null); }
    } catch (err) { setPlayingVerseId(null); }
  };

  const LibraryView = () => (
    <div className="space-y-16 animate-in fade-in duration-700 pt-10 px-4 md:px-0">
      <header className="text-center space-y-6 max-w-4xl mx-auto">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl">Selecione um manuscrito para meditação profunda.</p>
        
        <div className="relative group max-w-xl mx-auto mt-10">
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/40" />
          <input 
            type="text" 
            placeholder="Buscar livro..."
            value={bookSearch}
            onChange={e => setBookSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-xl text-stone-800 dark:text-white font-serif italic text-xl outline-none focus:border-gold transition-all"
          />
        </div>
      </header>

      <div className="space-y-24">
        {Object.entries(CANON).map(([testament, categories]) => {
          const hasMatches = Object.values(categories as any).some((books: any) => 
            books.some((b: string) => b.toLowerCase().includes(bookSearch.toLowerCase()))
          );
          if (bookSearch && !hasMatches) return null;

          return (
            <section key={testament} className="space-y-12">
              <div className="flex items-center gap-6">
                <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
                <div className="h-px flex-1 bg-gold/20" />
              </div>
              <div className="grid gap-16">
                {Object.entries(categories as any).map(([category, books]) => {
                  const filteredBooks = (books as string[]).filter(b => b.toLowerCase().includes(bookSearch.toLowerCase()));
                  if (filteredBooks.length === 0) return null;

                  return (
                    <div key={category} className="space-y-8">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-sacred flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-sacred shadow-[0_0_10px_#8b0000]" />
                        {category}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                        {filteredBooks.map(book => (
                          <button 
                            key={book}
                            onClick={() => { setSelectedBook(book); setShowChapterSelector(true); }}
                            className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl hover:border-gold hover:scale-105 transition-all text-left group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[9px] font-black uppercase text-stone-300 group-hover:text-gold block mb-2">{lastChapters[book] ? `Cap. ${lastChapters[book]}` : 'Ler Agora'}</span>
                            <h5 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight relative z-10">{book}</h5>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`max-w-7xl mx-auto pb-48 space-y-4 page-enter relative px-2 md:px-0 transition-all duration-1000`}>
      
      {viewMode === 'reading' && (
        <nav className={`sticky top-4 z-[200] bg-[#1a1917]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-4xl ring-1 ring-white/10 transition-all duration-500 ${isScrollingUp ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0 pointer-events-none'}`}>
          <div className="p-3 md:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setViewMode('library')} className="p-4 bg-white/5 hover:bg-gold hover:text-stone-900 rounded-2xl transition-all text-gold group shadow-inner">
                  <Icons.ArrowDown className="w-5 h-5 rotate-90" />
                </button>
                <div className="flex items-center bg-stone-900/80 rounded-2xl border border-white/10 p-1 shadow-inner">
                  <button onClick={() => setShowBookSelector(true)} className="px-6 py-2 hover:bg-white/5 rounded-xl transition-all text-white font-serif font-bold">{selectedBook}</button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={() => setShowChapterSelector(true)} className="px-6 py-2 hover:bg-white/5 rounded-xl transition-all text-gold font-serif font-bold text-xl">{selectedChapter}</button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setShowVersionSelector(true)} className="px-6 py-3 rounded-2xl bg-stone-800/50 border border-white/5 text-gold text-[9px] font-black uppercase tracking-widest">{selectedVersion.name}</button>
                <button onClick={() => setIsParallelMode(!isParallelMode)} className={`p-4 rounded-2xl transition-all ${isParallelMode ? 'bg-gold text-stone-900' : 'bg-white/5 text-stone-400'}`}>
                  <Icons.Layout className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={chapterRibbonRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {Array.from({ length: chapterCount }).map((_, i) => {
                const ch = i + 1;
                const isSelected = selectedChapter === ch;
                return (
                  <button key={ch} data-chapter={ch} onClick={() => setSelectedChapter(ch)} className={`flex-shrink-0 min-w-[45px] h-11 rounded-xl font-serif font-bold text-sm transition-all ${isSelected ? 'bg-gold text-stone-900 scale-110 shadow-lg' : 'bg-white/5 text-stone-500 hover:text-white'}`}>
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-1 bg-stone-800 w-full rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
          </div>
        </nav>
      )}

      <main>
        {viewMode === 'library' ? <LibraryView /> : (
          <div className="space-y-12 mt-8 px-4 md:px-0">
            <section className={`bg-white dark:bg-[#1a1917] p-8 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-white/5 relative overflow-hidden`}>
               <header className="mb-16 border-b border-stone-100 dark:border-white/5 pb-10 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">{selectedVersion.name} • Volumen</span>
                    <h2 className="text-4xl md:text-7xl font-serif font-bold dark:text-stone-100 tracking-tight">{selectedBook} {selectedChapter}</h2>
                  </div>
                  {loading && <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />}
               </header>

               <div className="space-y-12 min-h-[50vh]">
                  {loading && verses.length === 0 ? (
                    <div className="space-y-10">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-stone-50 dark:bg-stone-800 rounded-3xl animate-pulse" />)}
                    </div>
                  ) : verses.map((v, i) => {
                    const id = `v1_${v.verse}`;
                    const isSelected = selectedVerseKey === id;
                    return (
                      <div key={i} onClick={() => setSelectedVerseKey(isSelected ? null : id)} className={`group relative transition-all duration-300 pb-10 border-b border-stone-50 dark:border-white/5 last:border-0 ${isSelected ? 'bg-gold/5 -mx-10 px-10 rounded-3xl' : 'cursor-pointer hover:pl-2'}`}>
                        <div className="flex gap-6 items-start">
                          <span className={`text-xs font-serif font-black mt-2 transition-colors ${isSelected ? 'text-gold' : 'text-stone-300'}`}>{v.verse}</span>
                          <div className="flex-1 space-y-6">
                            <p className={`font-serif leading-relaxed text-2xl md:text-4xl transition-all ${isSelected ? 'text-stone-900 dark:text-white font-medium' : 'text-stone-800 dark:text-stone-300'}`}>
                              {v.text}
                            </p>
                            {isSelected && (
                              <div className="flex gap-4 animate-in slide-in-from-top-2">
                                <button onClick={(e) => { e.stopPropagation(); handlePlayVerse(v, id); }} className={`px-8 py-4 rounded-full flex items-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all ${playingVerseId === id ? 'bg-sacred text-white' : 'bg-gold text-stone-900'}`}>
                                  {playingVerseId === id ? <Icons.Stop className="w-4 h-4" /> : <Icons.Audio className="w-4 h-4" />}
                                  {playingVerseId === id ? 'Silenciar' : 'Escutar'}
                                </button>
                                <ActionButtons itemId={`v_${v.book}_${v.chapter}_${v.verse}`} type="verse" title={`${v.book} ${v.chapter}:${v.verse}`} content={v.text} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </section>

            <div className="mt-20 flex flex-col md:flex-row justify-center gap-6">
              <button onClick={handlePrevChapter} className="flex-1 max-w-sm px-10 py-10 bg-stone-100 dark:bg-stone-900 rounded-[3rem] text-left group hover:border-gold border border-transparent transition-all">
                <span className="text-[10px] font-black uppercase text-stone-400 mb-2 block">Capítulo Anterior</span>
                <p className="font-serif font-bold text-2xl text-stone-800 dark:text-stone-200">Retornar</p>
              </button>
              <button onClick={handleNextChapter} className="flex-1 max-w-sm px-12 py-10 bg-gold rounded-[3rem] text-left group hover:bg-yellow-400 transition-all shadow-2xl">
                <span className="text-[10px] font-black uppercase text-stone-900/60 mb-2 block">Sequência Sagrada</span>
                <p className="font-serif font-bold text-3xl text-stone-900">Avançar</p>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* SELETORES MODAIS */}
      {showChapterSelector && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4" onClick={() => setShowChapterSelector(false)}>
           <div className="bg-[#0c0a09] w-full max-w-4xl max-h-[85vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-12 border-b border-white/5 bg-stone-900/50 flex justify-between items-center">
                 <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold/50">Capitula</span>
                   <h2 className="text-4xl md:text-6xl font-serif font-bold text-white">{selectedBook}</h2>
                 </div>
                 <button onClick={() => setShowChapterSelector(false)} className="p-4 bg-white/5 rounded-full text-stone-500"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
              </header>
              <div className="p-12 overflow-y-auto custom-scrollbar grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                 {Array.from({ length: chapterCount }).map((_, i) => (
                   <button key={i} onClick={() => handleConfirmChapter(i + 1)} className="aspect-square rounded-2xl font-serif font-bold text-xl flex items-center justify-center transition-all bg-stone-900/50 border border-white/5 text-stone-400 hover:bg-gold hover:text-stone-900 hover:scale-110">
                     {i + 1}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showBookSelector && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8" onClick={() => setShowBookSelector(false)}>
           <div className="bg-[#0c0a09] w-full max-w-7xl h-[90vh] rounded-[5rem] shadow-4xl border border-white/10 overflow-hidden flex flex-col animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-stone-900/50">
                 <h2 className="text-4xl md:text-6xl font-serif font-bold text-gold tracking-tight">Scriptuarium</h2>
                 <input 
                   type="text" 
                   placeholder="Buscar manuscrito..." 
                   value={bookSearch} 
                   autoFocus
                   onChange={e => setBookSearch(e.target.value)} 
                   className="flex-1 max-w-2xl px-10 py-6 bg-white/5 border border-white/10 rounded-[3rem] outline-none text-white text-2xl font-serif italic focus:border-gold transition-all"
                 />
                 <button onClick={() => setShowBookSelector(false)} className="p-4 bg-white/5 rounded-full text-stone-500"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-16">
                 {Object.entries(CANON).map(([testament, categories]) => (
                   <section key={testament} className="space-y-10">
                      <h3 className="text-3xl font-serif font-bold text-gold/30">{testament}</h3>
                      <div className="grid gap-12">
                         {Object.entries(categories as any).map(([category, books]) => (
                           <div key={category} className="space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-sacred rounded-full" /> {category}
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                 {(books as string[]).filter(b => b.toLowerCase().includes(bookSearch.toLowerCase())).map(b => (
                                   <button key={b} onClick={() => { setSelectedBook(b); setShowChapterSelector(true); }} className="p-5 bg-stone-900/50 border border-white/5 rounded-2xl text-left hover:border-gold transition-all">
                                      <span className="font-serif font-bold text-lg text-stone-300">{b}</span>
                                   </button>
                                 ))}
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showVersionSelector && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowVersionSelector(false)}>
           <div className="bg-stone-900 w-full max-w-xl rounded-[4rem] border border-white/10 overflow-hidden animate-modal-zoom shadow-4xl" onClick={e => e.stopPropagation()}>
              <header className="p-10 border-b border-white/5 bg-black/20 flex justify-between items-center">
                 <h3 className="text-3xl font-serif font-bold text-gold">Escolher Versão</h3>
                 <button onClick={() => setShowVersionSelector(false)} className="p-2 text-stone-500"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
              </header>
              <div className="p-8 grid gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {BIBLE_VERSIONS.map(v => (
                   <button key={v.id} onClick={() => { setSelectedVersion(v); setShowVersionSelector(false); }} className={`p-8 rounded-[2.5rem] text-left border transition-all flex items-center justify-between group ${selectedVersion.id === v.id ? 'bg-gold text-stone-900 border-gold shadow-xl' : 'bg-white/5 border-white/5 text-stone-400 hover:border-gold/40'}`}>
                      <div className="space-y-2">
                         <p className="font-serif font-bold text-xl">{v.name}</p>
                         <p className="text-[10px] opacity-60 uppercase tracking-widest">{v.description}</p>
                      </div>
                      {v.isIA && <Icons.Feather className="w-5 h-5 text-gold group-hover:text-stone-900" />}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Bible;
