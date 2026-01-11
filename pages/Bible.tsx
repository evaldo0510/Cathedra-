
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Icons } from '../constants';
import { fetchRealBibleText, generateSpeech, fetchComparisonVerses } from '../services/gemini';
import { fetchExternalBibleText } from '../services/bibleApi';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback, LATIN_BOOK_NAMES } from '../services/bibleLocal';
import { Verse, Language } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [secondaryVerses, setSecondaryVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSecondary, setLoadingSecondary] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [secondaryVersion, setSecondaryVersion] = useState<BibleVersion>(BIBLE_VERSIONS[2]); 
  
  const [isParallelMode, setIsParallelMode] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<'primary' | 'secondary'>('primary');
  
  const [bookSearch, setBookSearch] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);

  // States for selection, audio and comparison
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [playingVerseId, setPlayingVerseId] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonVerse, setComparisonVerse] = useState<Verse | null>(null);
  const [comparisonData, setComparisonData] = useState<Record<string, string>>({});
  const [loadingComparison, setLoadingComparison] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const chapterCount = useMemo(() => getChapterCount(selectedBook), [selectedBook]);
  const chapterRibbonRef = useRef<HTMLDivElement>(null);

  const allBooksList = useMemo(() => {
    const list: string[] = [];
    Object.values(CANON).forEach(testament => {
      Object.values(testament as any).forEach(books => {
        list.push(...(books as string[]));
      });
    });
    return list;
  }, []);

  const prevChapterLabel = useMemo(() => {
    if (selectedChapter > 1) return `${selectedBook} ${selectedChapter - 1}`;
    const idx = allBooksList.indexOf(selectedBook);
    if (idx > 0) {
      const prevBook = allBooksList[idx - 1];
      return `${prevBook} ${getChapterCount(prevBook)}`;
    }
    return null;
  }, [selectedBook, selectedChapter, allBooksList]);

  const nextChapterLabel = useMemo(() => {
    if (selectedChapter < chapterCount) return `${selectedBook} ${selectedChapter + 1}`;
    const idx = allBooksList.indexOf(selectedBook);
    if (idx < allBooksList.length - 1) {
      return `${allBooksList[idx + 1]} 1`;
    }
    return null;
  }, [selectedBook, selectedChapter, chapterCount, allBooksList]);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setPlayingVerseId(null);
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const handlePlayVerse = async (v: Verse, id: string) => {
    if (playingVerseId === id) {
      stopAudio();
      return;
    }
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
        source.onended = () => {
          setPlayingVerseId(null);
          audioSourceRef.current = null;
        };
        audioSourceRef.current = source;
        source.start(0);
      } else {
        setPlayingVerseId(null);
      }
    } catch (err) {
      setPlayingVerseId(null);
    }
  };

  const handleCompareVerse = async (v: Verse) => {
    setComparisonVerse(v);
    setShowComparisonModal(true);
    setLoadingComparison(true);
    setComparisonData({});
    try {
      const versionsToCompare = ['B. de Jerusalém', 'Bíblia da CNBB', 'Ave Maria', 'Vulgata Clementina', 'Nova Vulgata'];
      const data = await fetchComparisonVerses(v.book, v.chapter, v.verse, versionsToCompare, lang);
      setComparisonData(data);
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleNextChapter = useCallback(() => {
    if (selectedChapter < chapterCount) setSelectedChapter(selectedChapter + 1);
    else {
      const idx = allBooksList.indexOf(selectedBook);
      if (idx < allBooksList.length - 1) {
        setSelectedBook(allBooksList[idx + 1]);
        setSelectedChapter(1);
      }
    }
    setSelectedVerseKey(null);
  }, [selectedChapter, chapterCount, selectedBook, allBooksList]);

  const handlePrevChapter = useCallback(() => {
    if (selectedChapter > 1) setSelectedChapter(selectedChapter - 1);
    else {
      const idx = allBooksList.indexOf(selectedBook);
      if (idx > 0) {
        const prevBook = allBooksList[idx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(getChapterCount(prevBook));
      }
    }
    setSelectedVerseKey(null);
  }, [selectedChapter, selectedBook, allBooksList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') handleNextChapter();
      if (e.key === 'ArrowLeft') handlePrevChapter();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextChapter, handlePrevChapter]);

  const fetchVersesForVersion = async (version: BibleVersion, currentLang: Language) => {
    try {
      const apiData = await fetchExternalBibleText(selectedBook, selectedChapter, version.slug);
      if (apiData && apiData.length > 0) return apiData;
      const aiData = await fetchRealBibleText(selectedBook, selectedChapter, version.name, currentLang);
      if (aiData && aiData.length > 0) return aiData;
      return fetchLocalFallback(selectedBook, selectedChapter);
    } catch (err) {
      return fetchLocalFallback(selectedBook, selectedChapter);
    }
  };

  const loadMainContent = useCallback(async () => {
    setLoading(true);
    stopAudio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const data = await fetchVersesForVersion(selectedVersion, lang);
    setVerses(data);
    setLoading(false);
  }, [selectedBook, selectedChapter, selectedVersion, lang, stopAudio]);

  const loadSecondaryContent = useCallback(async () => {
    if (!isParallelMode) return;
    setLoadingSecondary(true);
    const data = await fetchVersesForVersion(secondaryVersion, lang);
    setSecondaryVerses(data);
    setLoadingSecondary(false);
  }, [selectedBook, selectedChapter, secondaryVersion, lang, isParallelMode]);

  useEffect(() => { loadMainContent(); }, [loadMainContent]);
  useEffect(() => { loadSecondaryContent(); }, [loadSecondaryContent]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((winScroll / height) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (chapterRibbonRef.current) {
      const activeBtn = chapterRibbonRef.current.querySelector(`[data-ch="${selectedChapter}"]`) as HTMLElement;
      if (activeBtn) {
        chapterRibbonRef.current.scrollTo({
          left: activeBtn.offsetLeft - (chapterRibbonRef.current.offsetWidth / 2) + (activeBtn.offsetWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedChapter]);

  const openVersionSelector = (target: 'primary' | 'secondary') => {
    setSelectingTarget(target);
    setShowVersionSelector(true);
  };

  const handleVerseClick = (key: string) => {
    setSelectedVerseKey(prev => prev === key ? null : key);
  };

  const isVulgataMode = selectedVersion.isLatin || lang === 'la';

  return (
    <div className={`max-w-7xl mx-auto pb-48 space-y-8 page-enter relative px-2 md:px-4 transition-all duration-1000 ${isVulgataMode ? 'vulgata-theme' : ''}`}>
      
      <div className="fixed top-0 left-0 w-full h-1.5 z-[200] bg-stone-100 dark:bg-stone-950 overflow-hidden">
        <div className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)] transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* NAVEGADOR RÁPIDO FLUTUANTE */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[160] flex items-center gap-1 bg-[#1a1917]/90 backdrop-blur-2xl px-2 py-2 rounded-full border border-white/10 shadow-3xl lg:hidden">
          <button onClick={handlePrevChapter} className="p-3 text-gold/60 hover:text-gold active:scale-90 transition-all"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button onClick={() => setShowBookSelector(true)} className="px-4 py-2 text-[10px] font-black uppercase text-white tracking-widest flex flex-col items-center">
            <span className="opacity-50 text-[7px] leading-none mb-0.5">Mudar Livro</span>
            {selectedBook}
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button onClick={handleNextChapter} className="p-3 text-gold/60 hover:text-gold active:scale-90 transition-all"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
      </div>

      {/* CONTROLES DO SCRIPTORIUM */}
      <nav className="sticky top-4 z-[140] bg-[#1a1917]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-3xl overflow-hidden ring-1 ring-white/10">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <div className="flex items-center bg-stone-900 rounded-2xl border border-white/10 p-1">
                  <button onClick={() => setShowBookSelector(true)} className="flex items-center gap-3 px-4 md:px-6 py-2 hover:bg-white/5 rounded-xl transition-all group">
                    <Icons.Book className="w-4 h-4 text-gold" />
                    <span className="font-serif font-bold text-sm md:text-base text-white group-hover:text-gold">
                      {isVulgataMode ? LATIN_BOOK_NAMES[selectedBook] || selectedBook : selectedBook}
                    </span>
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={() => setShowChapterSelector(true)} className="flex items-center gap-2 px-4 md:px-6 py-2 hover:bg-white/5 rounded-xl transition-all group">
                    <span className="text-[10px] font-black uppercase text-stone-500">Cap.</span>
                    <span className="font-serif font-bold text-lg text-gold">{selectedChapter}</span>
                    <Icons.ArrowDown className="w-3 h-3 text-stone-500 group-hover:text-gold" />
                  </button>
              </div>

              <div className="flex gap-2">
                  <button onClick={() => openVersionSelector('primary')} className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${isParallelMode ? 'bg-stone-800/50 border-gold/40 text-gold' : 'bg-stone-800/30 border-white/5 text-stone-400'}`}>
                    <span className="opacity-50">V1:</span> {selectedVersion.name}
                  </button>
                  {isParallelMode && (
                    <button onClick={() => openVersionSelector('secondary')} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-sacred/20 border border-sacred/40 text-white text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95">
                      <span className="opacity-50">V2:</span> {secondaryVersion.name}
                    </button>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsParallelMode(!isParallelMode)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border ${isParallelMode ? 'bg-gold text-stone-900 border-gold' : 'bg-stone-800/50 border-white/5 text-stone-400 hover:text-white'}`}>
                  <Icons.Layout className="w-4 h-4" />
                  {isParallelMode ? 'Modo Solo' : 'Modo Sinótico'}
              </button>
              <div className="flex bg-stone-900/50 p-1 rounded-2xl border border-white/5">
                  <button onClick={handlePrevChapter} className="p-3 text-stone-500 hover:text-gold transition-colors"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
                  <div className="w-px h-6 bg-white/5 self-center" />
                  <button onClick={handleNextChapter} className="p-3 text-stone-500 hover:text-gold transition-colors"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/20 border-t border-white/5 px-4 py-3">
           <div ref={chapterRibbonRef} className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-2">
              {Array.from({ length: chapterCount }).map((_, i) => {
                const ch = i + 1;
                const isSelected = selectedChapter === ch;
                return (
                  <button key={ch} data-ch={ch} onClick={() => setSelectedChapter(ch)} className={`flex-shrink-0 min-w-[48px] h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative group/btn ${isSelected ? 'bg-gold text-stone-900 shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-110 z-10' : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10'}`}>
                    {isSelected && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                    <span className="font-serif font-black text-base">{ch}</span>
                    {!isSelected && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold/50 rounded-full group-hover/btn:w-2 transition-all duration-300" />}
                  </button>
                );
              })}
           </div>
        </div>
      </nav>

      {/* ÁREA DE TEXTO */}
      <main className="relative">
        <div className={`grid gap-4 md:gap-8 transition-all duration-700 ${isParallelMode ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          <section className={`bg-white dark:bg-[#1a1917] p-6 md:p-16 rounded-[3rem] shadow-3xl border border-stone-100 dark:border-white/5 relative overflow-hidden ${loading ? 'animate-pulse' : ''}`}>
             <header className="mb-12 border-b border-stone-100 dark:border-white/5 pb-8 flex justify-between items-center">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">{selectedVersion.name}</span>
                   <h2 className="text-3xl md:text-5xl font-serif font-bold dark:text-stone-100 mt-1">{isVulgataMode ? LATIN_BOOK_NAMES[selectedBook] || selectedBook : selectedBook} {selectedChapter}</h2>
                </div>
                <Icons.Cross className="w-10 h-10 text-stone-200 dark:text-stone-800 opacity-20" />
             </header>
             <div className="space-y-10">
                {verses.map((v, i) => {
                  const verseId = `v1_${v.book}_${v.chapter}_${v.verse}`;
                  const isCurrentPlaying = playingVerseId === verseId;
                  const isSelected = selectedVerseKey === verseId;
                  return (
                    <div key={i} onClick={() => handleVerseClick(verseId)} className={`group relative border-b border-stone-50 dark:border-white/5 pb-8 last:border-0 cursor-pointer transition-all duration-300 ${isSelected ? 'bg-stone-50/50 dark:bg-white/5 rounded-3xl p-4 md:-mx-8 md:px-8' : ''}`}>
                       <div className="flex gap-4 md:gap-6 items-start">
                          <div className="flex flex-col items-center gap-2 mt-1">
                            <span className={`text-[10px] font-serif font-black transition-colors ${isSelected ? 'text-gold' : 'text-stone-300 dark:text-stone-700'}`}>{v.verse}</span>
                            <button onClick={(e) => { e.stopPropagation(); handlePlayVerse(v, verseId); }} className={`p-2 rounded-full transition-all active:scale-90 ${isCurrentPlaying ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-gold opacity-0 group-hover:opacity-100'}`} title="Ouvir versículo">
                              {isCurrentPlaying ? <Icons.Stop className="w-3 h-3" /> : <Icons.Audio className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="flex-1 space-y-4">
                             <p className={`font-serif leading-relaxed transition-all duration-500 ${isSelected ? 'text-stone-900 dark:text-white' : 'text-stone-800 dark:text-stone-200'} ${isParallelMode ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'} ${isVulgataMode ? 'italic' : ''}`}>{v.text}</p>
                             <div className={`flex items-center gap-3 transition-all duration-500 ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto'}`}>
                               <ActionButtons itemId={verseId} type="verse" title={`${v.book} ${v.chapter}:${v.verse}`} content={v.text} />
                               <button onClick={(e) => { e.stopPropagation(); handleCompareVerse(v); }} className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-400 hover:text-gold transition-colors flex items-center gap-2">
                                  <Icons.Layout className="w-4 h-4" />
                                  <span className="text-[9px] font-black uppercase">Comparar</span>
                               </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </section>

          {isParallelMode && (
            <section className={`bg-[#fdfcf8] dark:bg-[#121211] p-6 md:p-16 rounded-[3rem] shadow-3xl border border-sacred/10 relative overflow-hidden animate-in slide-in-from-right-8 duration-700 ${loadingSecondary ? 'animate-pulse' : ''}`}>
               <header className="mb-12 border-b border-sacred/10 pb-8 flex justify-between items-center">
                  <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-sacred opacity-80">{secondaryVersion.name}</span>
                     <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-300 mt-1">Comparação</h2>
                  </div>
                  <Icons.Layout className="w-10 h-10 text-sacred opacity-10" />
               </header>
               <div className="space-y-10">
                  {secondaryVerses.map((v, i) => {
                    const verseId = `v2_${v.book}_${v.chapter}_${v.verse}`;
                    const isCurrentPlaying = playingVerseId === verseId;
                    const isSelected = selectedVerseKey === verseId;
                    return (
                      <div key={i} onClick={() => handleVerseClick(verseId)} className={`group relative border-b border-sacred/5 pb-8 last:border-0 cursor-pointer transition-all duration-300 ${isSelected ? 'bg-sacred/5 rounded-3xl p-4 md:-mx-8 md:px-8' : ''}`}>
                         <div className="flex gap-4 md:gap-6 items-start">
                            <div className="flex flex-col items-center gap-2 mt-1">
                               <span className={`text-[10px] font-serif font-black transition-colors ${isSelected ? 'text-sacred' : 'text-sacred/30'}`}>{v.verse}</span>
                               <button onClick={(e) => { e.stopPropagation(); handlePlayVerse(v, verseId); }} className={`p-2 rounded-full transition-all active:scale-90 ${isCurrentPlaying ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-gold opacity-0 group-hover:opacity-100'}`}>
                                 {isCurrentPlaying ? <Icons.Stop className="w-3 h-3" /> : <Icons.Audio className="w-3 h-3" />}
                               </button>
                            </div>
                            <div className="flex-1 space-y-4">
                              <p className="font-serif leading-relaxed text-xl md:text-2xl italic transition-all duration-500">{v.text}</p>
                              <div className={`flex items-center gap-3 transition-all duration-500 ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto'}`}>
                                <ActionButtons itemId={verseId} type="verse" title={`[V2] ${v.book} ${v.chapter}:${v.verse}`} content={v.text} />
                                <button onClick={(e) => { e.stopPropagation(); handleCompareVerse(v); }} className="p-2.5 bg-sacred/5 rounded-xl text-sacred/40 hover:text-sacred transition-colors flex items-center gap-2">
                                  <Icons.Layout className="w-4 h-4" />
                                  <span className="text-[9px] font-black uppercase">Comparar</span>
                                </button>
                              </div>
                            </div>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </section>
          )}
        </div>

        <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-6">
           <button onClick={handlePrevChapter} className="group bg-stone-100 dark:bg-stone-900 p-1 rounded-[3rem] transition-transform hover:scale-105 active:scale-95 shadow-lg">
              <div className="bg-white dark:bg-stone-800 px-10 py-6 rounded-[2.8rem] flex flex-col items-center gap-2 border border-stone-100 dark:border-white/5 min-w-[240px]">
                 <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Caput Prius</span>
                 <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-200">{prevChapterLabel || 'Início'}</h3>
              </div>
           </button>
           <button onClick={handleNextChapter} className="group bg-gold p-1 rounded-[3rem] shadow-2xl transition-transform hover:scale-110 active:scale-95">
              <div className="bg-[#1a1917] dark:bg-stone-900 px-16 py-8 rounded-[2.8rem] flex flex-col items-center gap-2 min-w-[320px]">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold animate-pulse">Sequens Caput</span>
                 <h3 className="text-2xl font-serif font-bold text-white">{nextChapterLabel || 'Fim'}</h3>
              </div>
           </button>
        </div>
      </main>

      {/* COMPARATIO VERSUUM MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onClick={() => setShowComparisonModal(false)}>
          <div className="bg-[#0c0a09] w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
            <header className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-stone-900/50 gap-6">
               <div className="space-y-1 text-center md:text-left">
                 <h2 className="text-3xl md:text-5xl font-serif font-bold text-gold tracking-tight">Comparatio Versuum</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">{comparisonVerse?.book} {comparisonVerse?.chapter}:{comparisonVerse?.verse}</p>
               </div>
               <button onClick={() => setShowComparisonModal(false)} className="p-4 hover:bg-white/5 rounded-full text-stone-500 transition-colors"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar space-y-12">
               {loadingComparison ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-8">
                     <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                     <p className="text-2xl font-serif italic text-stone-400">Harmonizando as Tradições...</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {Object.entries(comparisonData).map(([vName, vText], idx) => (
                       <article key={idx} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:border-gold/30 transition-all group">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gold">{vName}</span>
                            <Icons.Book className="w-4 h-4 text-white/10 group-hover:text-gold/40 transition-colors" />
                          </div>
                          <p className="text-xl md:text-2xl font-serif italic text-stone-300 leading-relaxed group-hover:text-white transition-colors">
                            "{vText}"
                          </p>
                       </article>
                     ))}
                  </div>
               )}
            </div>

            <footer className="p-8 bg-black/40 border-t border-white/5 text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.8em] text-white/20">Análise Exegética via Cathedra AI</p>
            </footer>
          </div>
        </div>
      )}

      {/* SELETOR DE LIVROS CATEGORIZADO */}
      {showBookSelector && (
         <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8" onClick={() => setShowBookSelector(false)}>
            <div className="bg-[#0c0a09] w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-stone-900/50 gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-gold tracking-tight">Scriptuarium</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Navegação Canônica</p>
                  </div>
                  <div className="relative flex-1 max-w-xl">
                     <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold/40 w-6 h-6" />
                     <input type="text" placeholder="Buscar por livro ou gênero..." value={bookSearch} autoFocus onChange={e => setBookSearch(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] outline-none text-white focus:border-gold transition-all font-serif italic text-xl" />
                  </div>
                  <button onClick={() => setShowBookSelector(false)} className="p-4 hover:bg-white/5 rounded-full text-stone-500 transition-colors"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
               </header>
               <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar space-y-16">
                  {Object.entries(CANON).map(([testament, categories]) => (
                    <section key={testament} className="space-y-10">
                       <div className="flex items-center gap-6">
                          <h3 className="text-2xl md:text-4xl font-serif font-bold text-gold/50">{testament}</h3>
                          <div className="h-px flex-1 bg-white/5" />
                       </div>
                       <div className="grid gap-12">
                          {Object.entries(categories as any).map(([category, books]) => {
                            const filteredBooks = (books as string[]).filter(b => b.toLowerCase().includes(bookSearch.toLowerCase()) || category.toLowerCase().includes(bookSearch.toLowerCase()));
                            if (filteredBooks.length === 0) return null;
                            return (
                              <div key={category} className="space-y-6">
                                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-sacred flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-sacred" />
                                   {category}
                                 </h4>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {filteredBooks.map(b => (
                                      <button key={b} onClick={() => { setSelectedBook(b); setSelectedChapter(1); setShowBookSelector(false); }} className={`p-5 rounded-2xl font-serif font-bold text-base md:text-lg text-left border transition-all relative overflow-hidden group ${selectedBook === b ? 'bg-gold text-stone-900 border-gold shadow-lg scale-105' : 'bg-stone-900/50 border-white/5 text-stone-400 hover:border-gold/40 hover:text-white'}`}>
                                        <span className="relative z-10">{b}</span>
                                        {selectedBook === b && <Icons.Star className="absolute top-2 right-2 w-3 h-3 fill-current" />}
                                      </button>
                                    ))}
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </section>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* SELETOR DE CAPÍTULOS MODAL */}
      {showChapterSelector && (
         <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8" onClick={() => setShowChapterSelector(false)}>
            <div className="bg-[#0c0a09] w-full max-w-4xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-12 border-b border-white/5 bg-stone-900/50 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold opacity-50">Escolher Caput</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">{selectedBook}</h2>
                  </div>
                  <button onClick={() => setShowChapterSelector(false)} className="p-4 hover:bg-white/5 rounded-full text-stone-500 transition-colors"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
               </header>
               <div className="p-12 overflow-y-auto custom-scrollbar grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {Array.from({ length: chapterCount }).map((_, i) => (
                    <button key={i} onClick={() => { setSelectedChapter(i + 1); setShowChapterSelector(false); }} className={`aspect-square rounded-2xl font-serif font-bold text-xl flex items-center justify-center transition-all border ${selectedChapter === i + 1 ? 'bg-gold text-stone-900 border-gold shadow-xl scale-110' : 'bg-stone-900/50 border-white/5 text-stone-400 hover:border-gold/40'}`}>
                      {i + 1}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* SELETOR DE VERSÕES MODAL */}
      {showVersionSelector && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowVersionSelector(false)}>
           <div className="bg-stone-900 w-full max-w-2xl rounded-[3rem] border border-white/10 overflow-hidden animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                 <div>
                    <h3 className="text-2xl font-serif font-bold text-gold">Escolher Versão</h3>
                    <p className="text-[9px] font-black uppercase text-stone-500 mt-1">Selecionando para {selectingTarget === 'primary' ? 'Coluna A' : 'Coluna B'}</p>
                 </div>
                 <button onClick={() => setShowVersionSelector(false)} className="p-2 text-stone-500 hover:text-white"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
              </header>
              <div className="p-6 grid gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {BIBLE_VERSIONS.map(v => (
                   <button key={v.id} onClick={() => { if (selectingTarget === 'primary') setSelectedVersion(v); else setSecondaryVersion(v); setShowVersionSelector(false); }} className={`p-6 rounded-2xl text-left border transition-all flex items-center justify-between group ${(selectingTarget === 'primary' ? selectedVersion.id : secondaryVersion.id) === v.id ? 'bg-gold text-stone-900 border-gold' : 'bg-white/5 border-white/5 text-stone-400 hover:border-gold/30 hover:text-white'}`}>
                      <div className="space-y-1">
                         <p className="font-serif font-bold text-lg">{v.name}</p>
                         <p className="text-[10px] opacity-60 uppercase tracking-widest">{v.description}</p>
                      </div>
                      {v.isIA ? <Icons.Feather className="w-4 h-4 text-gold group-hover:text-stone-900" /> : <Icons.Globe className="w-4 h-4 opacity-20" />}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <style>{`
        .vulgata-theme { background-color: #fdfcf8 !important; }
        .vulgata-theme h2 { color: #8b0000 !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Bible;
