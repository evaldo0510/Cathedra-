
import React, { useState, useEffect, useCallback, useContext, useRef, memo } from 'react';
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

type ImmersiveBg = 'parchment' | 'sepia' | 'dark' | 'white';

// Versículo Otimizado: Só renderiza botões de ação se estiver ativo
// Usa content-visibility para que o navegador economize processamento de layout
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
    className={`group relative py-6 px-8 rounded-[2.5rem] transition-all duration-500 cursor-pointer border-l-[8px] mb-4 ${
      isActive 
        ? 'bg-gold/20 border-gold shadow-2xl scale-[1.02] z-10' 
        : 'border-transparent hover:bg-stone-50 dark:hover:bg-white/5'
    }`}
  >
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1">
        <sup className={`text-[0.7em] font-black mr-4 select-none transition-all ${isActive ? 'text-sacred scale-125' : 'text-stone-300'}`}>
          {v.verse}
        </sup>
        <span className={`font-serif tracking-tight leading-[1.8] text-justify inline-block ${isActive ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
          {v.text}
        </span>
      </div>

      {/* Economia de Memória: Só renderiza componentes complexos quando necessário */}
      {isActive && (
        <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-2 duration-300">
           <ActionButtons 
            itemId={`v_${bookName}_${chapter}_${v.verse}`} 
            type="verse" 
            title={`${bookName} ${chapter}:${v.verse}`} 
            content={v.text} 
            className="bg-white/50 dark:bg-stone-800/80 p-1 rounded-2xl shadow-lg backdrop-blur-sm"
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterInput, setChapterInput] = useState<string>('1');
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [offlineBooks, setOfflineBooks] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState(1.3);

  const [isImmersive, setIsImmersive] = useState(false);
  const [immersiveBg, setImmersiveBg] = useState<ImmersiveBg>('parchment');
  const [isPlaying, setIsPlaying] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const refreshOfflineStatus = useCallback(async () => {
    const books = await offlineStorage.getDownloadedBooks();
    setOfflineBooks(books);
  }, []);

  useEffect(() => { refreshOfflineStatus(); }, [refreshOfflineStatus]);

  useEffect(() => {
    if (viewMode !== 'reading') {
      setVerses([]); // Descarrega conteúdo do DOM ao sair da leitura
      stopAudio();
    }
  }, [viewMode]);

  // Observer Otimizado para Desempenho
  useEffect(() => {
    if (viewMode === 'reading' && verses.length > 0 && !loading && !rendering) {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) {
          const vNum = parseInt(visible.target.getAttribute('data-verse') || '1');
          setActiveVerse(vNum);
        }
      }, { 
        threshold: 0.5, 
        rootMargin: '-20% 0px -40% 0px'
      });

      verses.forEach(v => {
        const el = document.getElementById(`v-${v.verse}`);
        if (el) observerRef.current?.observe(el);
      });
    }
    return () => observerRef.current?.disconnect();
  }, [verses, viewMode, loading, rendering]);

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
      const fullText = verses.map(v => v.text).join(" ");
      const textToRead = `${selectedBook.name}, capítulo ${selectedChapter}. ${fullText}`;
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

  const loadContent = useCallback(async (bookName: string, chapter: number, targetVerse?: number) => {
    stopAudio();
    setVerses([]); // Força descarregamento do capítulo anterior do DOM
    setLoading(true);
    setRendering(true);
    setChapterInput(String(chapter));
    
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
      
      // Pequeno timeout para garantir o descarregamento total antes do scroll
      setTimeout(() => {
        setRendering(false);
        if (targetVerse) {
          scrollToVerse(targetVerse);
        } else {
          setActiveVerse(1);
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      }, 50);
      
    } catch (e) {
      setLoading(false);
      setRendering(false);
    } finally {
      setLoading(false);
    }
  }, [isOnline, lang, refreshOfflineStatus]);

  const scrollToVerse = (vNum: number) => {
    const el = document.getElementById(`v-${vNum}`);
    if (el) {
      setActiveVerse(vNum);
      const y = el.getBoundingClientRect().top + window.pageYOffset - 180;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const regex = /^(.+?)\s+(\d+)(?:[:\s,]+(\d+))?$/i;
    const match = searchQuery.match(regex);
    if (match) {
      const [_, bookName, chapter, verse] = match;
      const foundBook = CATHOLIC_BIBLE_BOOKS.find(b => 
        b.name.toLowerCase().includes(bookName.toLowerCase()) || 
        b.name.toLowerCase().startsWith(bookName.toLowerCase())
      );
      if (foundBook) {
        setSelectedBook(foundBook);
        setSelectedChapter(parseInt(chapter));
        setViewMode('reading');
        loadContent(foundBook.name, parseInt(chapter), verse ? parseInt(verse) : undefined);
        setSearchQuery('');
      }
    }
  };

  const navigateChapter = (dir: number) => {
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      loadContent(selectedBook.name, next);
    }
  };

  const SidebarBooks = () => (
    <div className={`fixed inset-y-0 left-0 z-[500] w-80 bg-white dark:bg-[#0c0a09] border-r border-gold/20 shadow-4xl transform transition-transform duration-500 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
      <header className="p-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif font-bold text-gold">Cânon Católico</h3>
          <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Vulgata Clementina</p>
        </div>
        <button onClick={() => setShowSidebar(false)} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-300 hover:text-sacred transition-colors">
          <Icons.Cross className="w-5 h-5 rotate-45" />
        </button>
      </header>
      <div className="overflow-y-auto h-[calc(100%-120px)] custom-scrollbar p-4 space-y-8">
        {Object.entries(CANON).map(([testament, categories]) => (
          <div key={testament} className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/40 px-4 py-2 bg-stone-50 dark:bg-stone-800/30 rounded-lg">{testament}</h4>
            {Object.entries(categories as any).map(([category, books]) => (
              <div key={category} className="space-y-1">
                <p className="text-[8px] font-bold uppercase text-stone-300 px-4 mb-2 tracking-widest">{category}</p>
                {(books as string[]).map(bookName => {
                  const bData = CATHOLIC_BIBLE_BOOKS.find(b => b.name === bookName)!;
                  return (
                    <button 
                      key={bookName}
                      onClick={() => { setSelectedBook(bData); setViewMode('chapters'); setShowSidebar(false); window.scrollTo(0,0); }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedBook.name === bookName ? 'bg-gold text-stone-900 font-bold shadow-lg' : 'hover:bg-gold/5 text-stone-600 dark:text-stone-400'}`}
                    >
                      <span className="font-serif text-sm">{bookName}</span>
                      <Icons.ArrowDown className="w-3 h-3 -rotate-90 text-stone-200 group-hover:text-gold" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const LibraryView = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="text-center space-y-8 pt-10">
        <div className="flex justify-center">
           <div className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] shadow-sacred border border-gold/30">
              <Icons.Book className="w-16 h-16 text-sacred" />
           </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
          <p className="text-stone-400 italic text-2xl font-serif">"O Verbo Eterno guardado no coração."</p>
        </div>
        <form onSubmit={handleGlobalSearch} className="max-w-2xl mx-auto px-4 relative group">
           <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold" />
           <input 
            type="text" 
            placeholder="Ex: João 3:16 ou Salmos 23" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-24 py-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-2xl outline-none focus:border-gold transition-all text-2xl font-serif italic"
           />
           <button type="submit" className="absolute right-8 top-1/2 -translate-y-1/2 px-8 py-3 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Abrir</button>
        </form>
      </header>

      <div className="space-y-20 px-4">
        {Object.entries(CANON).map(([testament, categories]) => (
          <section key={testament} className="space-y-12">
            <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
            <div className="grid gap-16">
              {Object.entries(categories as any).map(([category, books]) => (
                <div key={category} className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-sacred" /> {category}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(books as string[]).map(bookName => {
                      const bookData = CATHOLIC_BIBLE_BOOKS.find(b => b.name === bookName)!;
                      const isOffline = offlineBooks.has(bookName);
                      return (
                        <button 
                          key={bookName}
                          onClick={() => { setSelectedBook(bookData); setViewMode('chapters'); window.scrollTo(0,0); }}
                          className={`p-6 rounded-[2.5rem] border shadow-lg transition-all text-left group relative h-40 flex flex-col justify-between ${isOffline ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'} hover:-translate-y-2 hover:border-gold`}
                        >
                          <div className="relative z-10">
                             <h5 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight truncate">{bookName}</h5>
                             <p className="text-[9px] uppercase text-stone-400 mt-2 font-black tracking-widest">{bookData.chapters} Cap.</p>
                          </div>
                          {isOffline && <div className="absolute -bottom-2 -right-2 opacity-10"><Icons.Download className="w-12 h-12 text-emerald-500" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  const ReadingView = () => (
    <div className={`min-h-screen transition-all duration-1000 ${isImmersive ? `${immersiveBg === 'dark' ? 'bg-[#0c0a09] text-stone-300' : immersiveBg === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : 'bg-white'} !p-0 !m-0 overflow-x-hidden` : ''}`}>
      <SidebarBooks />
      {showSidebar && <div className="fixed inset-0 z-[490] bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />}

      {!isImmersive && (
        <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl rounded-full md:rounded-[3rem] border border-stone-200 dark:border-white/10 shadow-2xl p-2 md:p-3 flex items-center justify-between mx-4 md:mx-0">
          <div className="flex items-center gap-1 md:gap-2">
              <button onClick={() => setShowSidebar(true)} className="p-3 md:p-4 bg-stone-900 text-gold rounded-full hover:bg-gold hover:text-stone-900 transition-all shadow-lg">
                <Icons.Menu className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-full p-1 border border-stone-200 dark:border-stone-800">
                <button onClick={() => setViewMode('library')} className="px-4 md:px-6 py-2 hover:bg-white dark:hover:bg-stone-800 rounded-full text-stone-900 dark:text-white font-serif font-bold text-xs md:text-lg">{selectedBook.name}</button>
                <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-2" />
                <div className="flex items-center">
                   <span className="text-gold font-serif font-bold text-xl md:text-2xl px-2">{selectedChapter}</span>
                   <span className="text-[10px] font-black uppercase text-stone-300 mr-4">Cap.</span>
                </div>
              </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6 px-4 md:px-10 border-x border-stone-100 dark:border-white/5">
              <button onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} className="p-2 text-stone-300 hover:text-gold disabled:opacity-10">
                <Icons.ArrowDown className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Versículo</span>
                <span className="text-sm md:text-2xl font-serif font-bold text-gold tabular-nums">{activeVerse}</span>
              </div>
              <button onClick={() => scrollToVerse(activeVerse + 1)} disabled={activeVerse >= verses.length} className="p-2 text-stone-300 hover:text-gold disabled:opacity-10">
                <Icons.ArrowDown className="w-5 h-5 md:w-6 md:h-6" />
              </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4 pr-2">
              <button 
                onClick={handleSpeech}
                className={`p-3 md:p-4 rounded-full shadow-md transition-all ${isPlaying ? 'bg-sacred text-white animate-pulse' : 'bg-gold text-stone-900'}`}
              >
                {isPlaying ? <Icons.Stop className="w-5 h-5" /> : <Icons.Audio className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsImmersive(!isImmersive)} className="hidden md:block p-3 bg-stone-50 dark:bg-stone-800 rounded-full hover:bg-gold hover:text-stone-900 transition-all shadow-md">
                <Icons.Layout className="w-5 h-5" />
              </button>
          </div>
        </nav>
      )}

      {!isImmersive && (
        <header className="bg-white dark:bg-stone-900 p-12 md:p-24 rounded-[4rem] md:rounded-[5rem] shadow-2xl border-t-[16px] md:border-t-[24px] border-gold text-center relative overflow-hidden mx-4 mt-8">
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none"><Icons.Cross className="w-96 h-96" /></div>
          <div className="relative z-10 space-y-6">
              <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] text-gold">{selectedBook.category}</span>
              <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">{selectedBook.name} {selectedChapter}</h2>
              <div className="h-px w-40 bg-gold/20 mx-auto mt-10" />
          </div>
        </header>
      )}

      <div className={`max-w-5xl mx-auto px-4 md:px-0 transition-all duration-700 ${isImmersive ? 'pt-40 pb-40 px-8' : 'pt-16'}`}>
        <article className={`p-10 md:p-24 rounded-[3rem] md:rounded-[6rem] relative min-h-[60vh] overflow-hidden ${isImmersive ? 'bg-transparent' : 'bg-white dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800 shadow-inner'}`} style={{ fontSize: `${fontSize}rem` }}>
           {loading || rendering ? (
              <div className="py-60 text-center space-y-12 animate-pulse">
                <div className="w-24 h-24 border-8 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-3xl font-serif italic text-stone-400">Atualizando Scriptuarium...</p>
              </div>
           ) : (
             <div className="space-y-6 max-w-3xl mx-auto">
                {verses.map((v) => (
                  <VerseItem 
                    key={`${selectedBook.name}-${selectedChapter}-${v.verse}`} 
                    v={v} 
                    isActive={activeVerse === v.verse} 
                    onSelect={scrollToVerse} 
                    bookName={selectedBook.name}
                    chapter={selectedChapter}
                  />
                ))}
             </div>
           )}
           <div className="mt-32 pt-24 border-t border-stone-100 dark:border-white/5 flex justify-center opacity-10 pb-16"><Icons.Cross className="w-24 h-24" /></div>
        </article>
      </div>

      {!isImmersive && (
        <div className="flex flex-col md:flex-row justify-center gap-8 pb-60 px-4 md:px-0">
          <button 
            disabled={selectedChapter <= 1}
            onClick={() => navigateChapter(-1)}
            className="px-12 md:px-16 py-8 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] tracking-[0.5em] disabled:opacity-10 transition-all hover:border-gold shadow-2xl flex items-center justify-center gap-6 group"
          >
            <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:-translate-x-3 transition-transform" /> Anterior
          </button>
          <button 
            disabled={selectedChapter >= selectedBook.chapters}
            onClick={() => navigateChapter(1)}
            className="px-20 md:px-32 py-8 bg-gold text-stone-900 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] tracking-[0.5em] shadow-[0_30px_60px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-6 group"
          >
            Próximo <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:translate-x-3 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto page-enter overflow-x-hidden">
      {viewMode === 'library' && <LibraryView />}
      {viewMode === 'chapters' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-32 px-4 pt-10">
           <button onClick={() => setViewMode('library')} className="flex items-center gap-3 text-gold text-[11px] font-black uppercase tracking-widest hover:translate-x-[-6px] transition-transform">
              <Icons.ArrowDown className="w-5 h-5 rotate-90" /> Voltar à Biblioteca
           </button>
           <header className="text-center space-y-6">
              <span className="text-[12px] font-black uppercase tracking-[0.6em] text-gold">{selectedBook.category}</span>
              <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">{selectedBook.name}</h2>
           </header>
           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 max-w-5xl mx-auto">
              {Array.from({ length: selectedBook.chapters }).map((_, i) => {
                const chapterNum = i + 1;
                return (
                  <button 
                    key={i} 
                    onClick={() => { setSelectedChapter(chapterNum); setViewMode('reading'); loadContent(selectedBook.name, chapterNum); }}
                    className={`aspect-square rounded-[2.5rem] flex items-center justify-center font-serif transition-all shadow-xl active:scale-95 group relative overflow-hidden ${selectedChapter === chapterNum ? 'bg-[#b8952e] text-white border-4 border-gold shadow-[0_0_40px_rgba(184,149,46,0.6)] scale-110 z-10' : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-white hover:border-gold hover:scale-105'}`}
                  >
                    <span className="text-3xl font-bold">{chapterNum}</span>
                  </button>
                );
              })}
           </div>
        </div>
      )}
      {viewMode === 'reading' && <ReadingView />}
    </div>
  );
};

export default Bible;
