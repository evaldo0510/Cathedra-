
import React, { useState, useEffect, useCallback, useContext, useRef, memo, useMemo } from 'react';
import { Icons } from '../constants';
import { getCatholicCanon, getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchExternalBibleText } from '../services/bibleApi';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { offlineStorage } from '../services/offlineStorage';
import { fetchBibleChapterIA, generateSpeech } from '../services/gemini';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();

const VerseItem = memo(({ v, isActive, onSelect, bookName, chapter }: { 
  v: Verse, 
  isActive: boolean, 
  onSelect: (n: number) => void,
  bookName: string,
  chapter: number
}) => (
  <div 
    id={`v-${v.verse}`}
    data-verse={v.verse}
    onClick={() => onSelect(v.verse)}
    style={{ 
      contentVisibility: 'auto', 
      containIntrinsicSize: '0 60px' 
    } as React.CSSProperties}
    className={`group relative py-5 md:py-8 px-5 md:px-10 rounded-[1.8rem] md:rounded-[3rem] transition-all duration-500 cursor-pointer border-l-[5px] md:border-l-[10px] mb-3 md:mb-4 ${
      isActive 
        ? 'bg-gold/15 border-gold shadow-xl scale-[1.01] md:scale-[1.02] z-10 ring-4 ring-gold/5' 
        : 'border-transparent hover:bg-stone-50 dark:hover:bg-white/5'
    }`}
  >
    <div className="flex justify-between items-start gap-3 md:gap-4">
      <div className="flex-1">
        <sup className={`text-[0.7em] font-black mr-2 md:mr-4 select-none transition-all ${isActive ? 'text-sacred scale-125' : 'text-stone-300'}`}>
          {v.verse}
        </sup>
        <span className={`font-serif tracking-tight leading-[1.7] md:leading-[1.8] text-justify inline-block ${isActive ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
          {v.text}
        </span>
      </div>

      {isActive && (
        <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-2 duration-300">
           <ActionButtons 
            itemId={`v_${bookName}_${chapter}_${v.verse}`} 
            type="verse" 
            title={`${bookName} ${chapter}:${v.verse}`} 
            content={v.text} 
            className="bg-white/90 dark:bg-stone-800/90 p-1 rounded-2xl shadow-xl backdrop-blur-sm scale-90 md:scale-100"
           />
        </div>
      )}
    </div>
  </div>
));

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [refSearch, setRefSearch] = useState('');
  
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [offlineBooks, setOfflineBooks] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState(1.15);

  const [isPlaying, setIsPlaying] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (viewMode !== 'reading' || loading || rendering) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return;
      const visible = entries.find(e => e.isIntersecting);
      if (visible) {
        const vNum = parseInt(visible.target.getAttribute('data-verse') || '1');
        setActiveVerse(vNum);
      }
    }, { rootMargin: '-45% 0% -45% 0%', threshold: 0 });

    const elements = document.querySelectorAll('[data-verse]');
    elements.forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [viewMode, loading, rendering, verses.length]);

  const refreshOfflineStatus = useCallback(async () => {
    const books = await offlineStorage.getDownloadedBooks();
    setOfflineBooks(books);
  }, []);

  useEffect(() => { refreshOfflineStatus(); }, [refreshOfflineStatus]);

  const scrollToVerse = (vNum: number) => {
    if (vNum < 1 || vNum > verses.length) return;
    isScrollingRef.current = true;
    setActiveVerse(vNum);
    const el = document.getElementById(`v-${vNum}`);
    if (el) {
      const offset = window.innerWidth < 768 ? 140 : 220;
      const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  };

  const loadContent = useCallback(async (bookName: string, chapter: number, targetVerse?: number) => {
    stopAudio();
    setVerses([]); 
    setLoading(true);
    setRendering(true);
    
    try {
      let data: Verse[] = [];
      const localPersisted = await offlineStorage.getBibleVerses(bookName, chapter);
      
      if (localPersisted && localPersisted.length > 0) {
        data = localPersisted;
      } else if (isOnline) {
        const apiData = await fetchExternalBibleText(bookName, chapter, 'almeida');
        if (apiData) {
           data = apiData;
           await offlineStorage.saveBibleVerses(bookName, chapter, apiData);
           refreshOfflineStatus();
        } else {
           data = await fetchBibleChapterIA(bookName, chapter, lang);
           if (data.length > 0) {
             await offlineStorage.saveBibleVerses(bookName, chapter, data);
             refreshOfflineStatus();
           }
        }
      }

      if (data.length === 0) {
        data = getBibleVersesLocal(bookName, chapter);
      }

      setVerses(data);
      setTimeout(() => {
        setRendering(false);
        if (targetVerse) scrollToVerse(targetVerse);
        else { setActiveVerse(1); window.scrollTo({ top: 0, behavior: 'auto' }); }
      }, 100);
    } catch (e) {
      setLoading(false);
      setRendering(false);
    } finally {
      setLoading(false);
    }
  }, [isOnline, lang, refreshOfflineStatus]);

  const handleReferenceJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refSearch.trim()) return;
    const regex = /^(.+?)\s+(\d+)(?::(\d+))?$/;
    const match = refSearch.trim().match(regex);
    if (match) {
      const bookQuery = match[1].toLowerCase();
      const chapterNum = parseInt(match[2]);
      const verseNum = match[3] ? parseInt(match[3]) : 1;
      const foundBook = CATHOLIC_BIBLE_BOOKS.find(b => b.name.toLowerCase().includes(bookQuery));
      if (foundBook) {
        setSelectedBook(foundBook);
        setSelectedChapter(chapterNum);
        setViewMode('reading');
        loadContent(foundBook.name, chapterNum, verseNum);
        setRefSearch('');
      }
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSpeech = async () => {
    if (isPlaying) { stopAudio(); return; }
    if (verses.length === 0) return;
    setIsPlaying(true);
    try {
      const textToRead = `${selectedBook.name}, capítulo ${selectedChapter}. ` + verses.map(v => v.text).join(" ");
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64Audio = await generateSpeech(textToRead);
      if (base64Audio) {
        const audioData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        audioSourceRef.current = source;
        source.start(0);
      } else { setIsPlaying(false); }
    } catch (e) { setIsPlaying(false); }
  };

  const navigateChapter = (dir: number) => {
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      loadContent(selectedBook.name, next);
    }
  };

  const SidebarBooks = () => (
    <div className={`fixed lg:sticky top-0 left-0 z-[500] lg:z-10 w-full md:w-80 h-[100dvh] lg:h-[calc(100vh-64px)] bg-white dark:bg-[#0c0a09] border-r border-gold/20 shadow-4xl lg:shadow-none transform transition-transform duration-500 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <header className="p-6 border-b border-stone-100 dark:border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold text-gold tracking-tight">Scriptuarium</h3>
            <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Bibliotheca Sacra</p>
          </div>
          <button onClick={() => setShowSidebar(false)} className="p-3 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-sacred rounded-2xl transition-all">
            <Icons.Cross className="w-5 h-5 rotate-45" />
          </button>
        </div>
        <div className="relative">
           <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
           <input 
            type="text" placeholder="Buscar livro..." value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none text-xs font-serif italic"
           />
        </div>
      </header>
      <div className="overflow-y-auto h-[calc(100%-140px)] custom-scrollbar p-4 space-y-4">
        {CATHOLIC_BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(sidebarSearch.toLowerCase())).map(b => (
          <button key={b.id} onClick={() => { setSelectedBook(b); if (viewMode === 'reading') { loadContent(b.name, 1); } else { setViewMode('chapters'); } setShowSidebar(false); }} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedBook.id === b.id ? 'bg-gold/10 text-gold border border-gold/20' : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500'}`}>
            <span className="font-serif text-[15px]">{b.name}</span>
            {offlineBooks.has(b.name) && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden relative">
      <SidebarBooks />
      {showSidebar && <div className="fixed inset-0 z-[490] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setShowSidebar(false)} />}
      
      <div className="flex-1 min-w-0 bg-[#fdfcf8] dark:bg-[#0c0a09]">
        <div className="max-w-7xl mx-auto px-2 md:px-12">
          {viewMode === 'library' && (
            <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-32 pt-4">
              <header className="text-center space-y-6 md:space-y-10 pt-4 md:pt-6">
                <div className="flex justify-center">
                   <div className="p-6 md:p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] md:rounded-[3rem] shadow-sacred border border-gold/30">
                      <Icons.Book className="w-10 h-10 md:w-16 md:h-16 text-sacred" />
                   </div>
                </div>
                <div className="space-y-2 md:space-y-4 px-4">
                  <h2 className="text-4xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter leading-none">Scriptuarium</h2>
                  <p className="text-stone-400 italic text-lg md:text-3xl font-serif px-6">"O Verbo Eterno guardado no coração."</p>
                </div>
                
                <div className="max-w-2xl mx-auto space-y-3 md:space-y-4 px-4">
                   <form onSubmit={handleReferenceJump} className="relative group">
                      <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-gold transition-colors" />
                      <input 
                        type="text" placeholder="João 3:16..." value={refSearch}
                        onChange={e => setRefSearch(e.target.value)}
                        className="w-full pl-14 pr-20 py-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] outline-none focus:ring-8 focus:ring-gold/5 focus:border-gold transition-all text-base font-serif italic shadow-xl dark:text-white"
                      />
                      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-stone-900 text-gold rounded-xl font-black uppercase text-[8px] tracking-widest shadow-lg">Saltar</button>
                   </form>
                   <button onClick={() => setShowSidebar(true)} className="w-full px-8 py-5 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-stone-400 rounded-[2rem] font-black uppercase tracking-widest text-[9px] hover:text-gold transition-all flex items-center justify-center gap-4 shadow-sm">
                    <Icons.Menu className="w-4 h-4" /> Explorar Índice Completo
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-4">
                 {CATHOLIC_BIBLE_BOOKS.slice(0, 11).map((b, i) => (
                   <button key={i} onClick={() => { setSelectedBook(b); setViewMode('chapters'); window.scrollTo(0,0); }} className="p-5 md:p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] md:rounded-[2.5rem] shadow-lg text-left group hover:border-gold hover:-translate-y-1 transition-all">
                      <span className="text-[7px] font-black uppercase tracking-widest text-stone-300 block mb-2">{b.category}</span>
                      <h4 className="text-lg md:text-2xl font-serif font-bold group-hover:text-gold transition-colors leading-tight">{b.name}</h4>
                      <p className="text-[9px] text-stone-400 mt-1 md:mt-2">{b.chapters} Capítulos</p>
                   </button>
                 ))}
                 <button onClick={() => setShowSidebar(true)} className="p-5 md:p-8 bg-stone-50 dark:bg-stone-800/40 border border-dashed border-stone-200 dark:border-stone-700 rounded-[2rem] flex flex-col items-center justify-center text-stone-400 hover:text-gold transition-all group">
                    <Icons.Book className="w-8 h-8 mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Ver Todos</span>
                 </button>
              </div>
            </div>
          )}

          {viewMode === 'chapters' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-32 px-2 pt-6">
               <div className="flex items-center justify-between px-2">
                  <button onClick={() => setViewMode('library')} className="flex items-center gap-2 text-gold text-[9px] font-black uppercase tracking-widest hover:translate-x-[-4px] transition-all">
                      <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Biblioteca
                  </button>
               </div>
               <header className="text-center space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gold">{selectedBook.category}</span>
                  <h2 className="text-4xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{selectedBook.name}</h2>
               </header>
               <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-3 max-w-5xl mx-auto px-2">
                  {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                    <button key={i} onClick={() => { setSelectedChapter(i + 1); setViewMode('reading'); loadContent(selectedBook.name, i + 1); }} className={`aspect-square rounded-[1.2rem] md:rounded-[2.5rem] flex items-center justify-center font-serif text-xl md:text-3xl font-bold transition-all shadow-xl active:scale-90 ${selectedChapter === (i+1) ? 'bg-gold text-stone-900 scale-105 z-10' : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-gold'}`}>
                      {i + 1}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {viewMode === 'reading' && (
            <div className="min-h-screen animate-in fade-in duration-1000 relative">
              
              {/* GOTEIRAS DE NAVEGAÇÃO LATERAIS - MOBILE OPTIMIZED */}
              <div className="fixed inset-y-0 left-0 w-4 md:w-24 z-[100] flex items-center group/prev pointer-events-none">
                 <button 
                  onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} 
                  className="h-full w-full pointer-events-auto flex items-center justify-center opacity-0 group-hover/prev:opacity-100 transition-opacity bg-gradient-to-r from-gold/10 to-transparent group/btn"
                 >
                    <Icons.ArrowDown className="w-6 h-6 md:w-10 md:h-10 rotate-90 text-gold/50" />
                 </button>
              </div>

              <div className="fixed inset-y-0 right-0 w-4 md:w-24 z-[100] flex items-center group/next pointer-events-none">
                 <button 
                  onClick={() => scrollToVerse(activeVerse + 1)} disabled={activeVerse >= verses.length} 
                  className="h-full w-full pointer-events-auto flex items-center justify-center opacity-0 group-hover/next:opacity-100 transition-opacity bg-gradient-to-l from-gold/10 to-transparent group/btn"
                 >
                    <Icons.ArrowDown className="w-6 h-6 md:w-10 md:h-10 -rotate-90 text-gold/50" />
                 </button>
              </div>

              <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl rounded-full border border-stone-200 dark:border-white/10 shadow-2xl p-1.5 md:p-3 flex items-center justify-between mx-1 md:mx-0 mb-8">
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowSidebar(true)} className="p-3 md:p-4 bg-stone-900 text-gold rounded-full shadow-lg">
                      <Icons.Menu className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-full p-0.5 md:p-1 border border-stone-200 dark:border-stone-800 max-w-[120px] md:max-w-none">
                      <button onClick={() => setViewMode('library')} className="px-3 md:px-6 py-1.5 text-stone-900 dark:text-white font-serif font-bold text-[10px] md:text-lg truncate">{selectedBook.name}</button>
                      <div className="w-px h-4 md:h-6 bg-stone-200 dark:bg-stone-700" />
                      <span className="text-gold font-serif font-bold text-base md:text-2xl px-2 md:px-4">{selectedChapter}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 md:gap-6 px-1 md:px-10 border-x border-stone-100 dark:border-white/5">
                    <button onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} className="p-1 md:p-2 text-stone-300 disabled:opacity-10 transition-colors">
                      <Icons.ArrowDown className="w-4 h-4 md:w-6 md:h-6 rotate-180" />
                    </button>
                    <div className="flex flex-col items-center min-w-[20px] md:min-w-[40px]">
                      <span className="text-[6px] md:text-[9px] font-black uppercase text-stone-400">§</span>
                      <span className="text-xs md:text-2xl font-serif font-bold text-gold tabular-nums">{activeVerse}</span>
                    </div>
                    <button onClick={() => scrollToVerse(activeVerse + 1)} disabled={activeVerse >= verses.length} className="p-1 md:p-2 text-stone-300 disabled:opacity-10 transition-colors">
                      <Icons.ArrowDown className="w-4 h-4 md:w-6 md:h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-1 md:gap-4 pr-1 md:pr-2">
                    <button onClick={handleSpeech} className={`p-2.5 md:p-4 rounded-full shadow-md transition-all ${isPlaying ? 'bg-sacred text-white animate-pulse' : 'bg-gold text-stone-900'}`}>
                      {isPlaying ? <Icons.Stop className="w-4 h-4 md:w-5 md:h-5" /> : <Icons.Audio className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                </div>
              </nav>

              <header className="bg-white dark:bg-stone-900 p-8 md:p-24 rounded-[3rem] md:rounded-[5rem] shadow-xl border-t-[8px] md:border-t-[24px] border-gold text-center relative overflow-hidden mx-1 md:mx-4">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Icons.Cross className="w-48 h-48 md:w-96 md:h-96" /></div>
                <div className="relative z-10 space-y-2 md:space-y-6">
                    <span className="text-[8px] md:text-[14px] font-black uppercase tracking-[0.5em] md:tracking-[1em] text-gold">{selectedBook.category}</span>
                    <h2 className="text-3xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">{selectedBook.name} {selectedChapter}</h2>
                    <div className="h-px w-16 md:w-40 bg-gold/20 mx-auto mt-4 md:mt-10" />
                </div>
              </header>

              <div className="max-w-5xl mx-auto px-1 md:px-0 pt-6 md:pt-16">
                <article className="p-4 md:p-24 rounded-[2rem] md:rounded-[6rem] relative min-h-[50vh] overflow-hidden bg-white dark:bg-stone-950 shadow-inner border border-stone-50 dark:border-stone-900" style={{ fontSize: `${fontSize}rem` }}>
                   {loading || rendering ? (
                      <div className="py-32 md:py-60 text-center space-y-6 md:space-y-12 animate-pulse">
                        <div className="w-12 h-12 md:w-24 md:h-24 border-6 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xl md:text-3xl font-serif italic text-stone-400">Consultando Escrituras...</p>
                      </div>
                   ) : (
                     <div className="space-y-2 md:space-y-4 max-w-3xl mx-auto">
                        {verses.map((v) => (
                          <VerseItem key={`${selectedBook.name}-${selectedChapter}-${v.verse}`} v={v} isActive={activeVerse === v.verse} onSelect={scrollToVerse} bookName={selectedBook.name} chapter={selectedChapter} />
                        ))}
                        
                        <div className="pt-16 flex justify-center gap-3">
                           <button onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} className="px-5 py-3 bg-stone-50 dark:bg-stone-900 text-stone-400 rounded-xl text-[8px] font-black uppercase tracking-widest border border-stone-100 dark:border-stone-800">Anterior</button>
                           <button onClick={() => scrollToVerse(activeVerse + 1)} disabled={activeVerse >= verses.length} className="px-6 py-3 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg">Próximo</button>
                        </div>
                     </div>
                   )}
                   <div className="mt-16 md:mt-32 pt-12 border-t border-stone-50 dark:border-white/5 flex justify-center opacity-10 pb-8 md:pb-16"><Icons.Cross className="w-12 h-12 md:w-24 md:h-24" /></div>
                </article>
              </div>

              <div className="flex flex-col md:flex-row justify-center gap-4 py-16 md:py-40 px-4">
                <button disabled={selectedChapter <= 1} onClick={() => navigateChapter(-1)} className="px-10 py-6 md:py-8 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[3rem] font-black uppercase text-[8px] md:text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 group">
                  <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Anterior
                </button>
                <button disabled={selectedChapter >= selectedBook.chapters} onClick={() => navigateChapter(1)} className="px-12 py-6 md:py-8 bg-gold text-stone-900 rounded-full md:rounded-[3rem] font-black uppercase text-[8px] md:text-[10px] tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                  Próximo <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>

              {/* BARRA FLUTUANTE MOBILE */}
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] md:hidden flex items-center gap-2 bg-stone-900/90 backdrop-blur-xl border border-gold/30 rounded-full p-1 shadow-4xl">
                 <button onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} className="p-3 text-gold disabled:opacity-20"><Icons.ArrowDown className="w-5 h-5 rotate-180" /></button>
                 <div className="px-3 border-x border-gold/10"><span className="text-white font-serif font-bold text-lg tabular-nums">§ {activeVerse}</span></div>
                 <button onClick={() => scrollToVerse(activeVerse + 1)} disabled={activeVerse >= verses.length} className="p-3 text-gold disabled:opacity-20"><Icons.ArrowDown className="w-5 h-5" /></button>
              </div>

            </div>
          )}
        </div>
      </div>
      
      {viewMode === 'reading' && (
        <div className="fixed bottom-24 right-4 md:bottom-32 md:right-8 z-[300] flex flex-col gap-2">
           <button onClick={() => setFontSize(f => Math.min(f + 0.1, 2.5))} className="p-3.5 md:p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-2xl shadow-4xl border border-stone-100 dark:border-stone-700 text-stone-500 hover:text-gold transition-all">
             <span className="text-lg md:text-xl font-bold">A+</span>
           </button>
           <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} className="p-3.5 md:p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-2xl shadow-4xl border border-stone-100 dark:border-stone-700 text-stone-500 hover:text-gold transition-all">
             <span className="text-sm md:text-lg font-bold">A-</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default Bible;
