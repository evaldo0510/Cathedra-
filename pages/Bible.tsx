
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef, memo } from 'react';
import { Icons } from '../constants';
import { getCatholicCanon, getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchExternalBibleText } from '../services/bibleApi';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { offlineStorage } from '../services/offlineStorage';
import { fetchBibleChapterIA } from '../services/gemini';

const CANON = getCatholicCanon();

type ImmersiveBg = 'parchment' | 'sepia' | 'dark' | 'white';

// Componente de Versículo Memoizado para performance extrema
const VerseItem = memo(({ v, isActive, onSelect }: { v: Verse, isActive: boolean, onSelect: (n: number) => void }) => (
  <div 
    id={`v-${v.verse}`}
    data-verse={v.verse}
    onClick={() => onSelect(v.verse)}
    className={`group relative py-3 px-4 rounded-2xl transition-all duration-500 cursor-pointer border-l-4 ${
      isActive 
        ? 'bg-gold/15 border-gold shadow-sm ring-1 ring-gold/10 scale-[1.01]' 
        : 'border-transparent hover:bg-gold/5'
    }`}
  >
    <sup className={`text-[0.7em] font-black mr-3 select-none transition-all ${isActive ? 'text-sacred scale-125' : 'text-stone-300'}`}>{v.verse}</sup>
    <span className={`font-serif tracking-tight leading-[1.8] text-justify inline-block ${isActive ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
      {v.text}
    </span>
    {isActive && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
         <Icons.Star className="w-4 h-4 text-gold fill-current" />
      </div>
    )}
  </div>
));

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
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

  const observerRef = useRef<IntersectionObserver | null>(null);

  const refreshOfflineStatus = useCallback(async () => {
    const books = await offlineStorage.getDownloadedBooks();
    setOfflineBooks(books);
  }, []);

  useEffect(() => { refreshOfflineStatus(); }, [refreshOfflineStatus]);

  // MECANISMO DE DESCARREGAMENTO: Limpa versículos ao sair da leitura para poupar RAM
  useEffect(() => {
    if (viewMode !== 'reading') {
      setVerses([]);
    }
  }, [viewMode]);

  // Scroll Observer inteligente para destacar versículo no centro da visão
  useEffect(() => {
    if (viewMode === 'reading' && verses.length > 0) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const vNum = parseInt(entry.target.getAttribute('data-verse') || '1');
            setActiveVerse(vNum);
          }
        });
      }, { threshold: 0.5, rootMargin: '-20% 0px -60% 0px' });

      verses.forEach(v => {
        const el = document.getElementById(`v-${v.verse}`);
        if (el) observerRef.current?.observe(el);
      });
    }
    return () => observerRef.current?.disconnect();
  }, [verses, viewMode]);

  const loadContent = useCallback(async (bookName: string, chapter: number, targetVerse?: number) => {
    setVerses([]); // DESCARGA IMEDIATA
    setLoading(true);
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
      
      if (targetVerse) {
        setTimeout(() => scrollToVerse(targetVerse), 100);
      } else {
        setActiveVerse(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
    } catch (e) {
      console.error("Erro no Scriptuarium:", e);
    } finally {
      setLoading(false);
    }
  }, [isOnline, lang, refreshOfflineStatus]);

  const scrollToVerse = (vNum: number) => {
    if (vNum < 1) return;
    setActiveVerse(vNum);
    const el = document.getElementById(`v-${vNum}`);
    if (el) {
      const yOffset = -220; 
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // PARSER DE REFERÊNCIA: "João 3:16"
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const regex = /^(.+?)\s+(\d+)(?:[:\s,]+(\d+))?$/i;
    const match = searchQuery.match(regex);

    if (match) {
      const [_, bookName, chapter, verse] = match;
      const foundBook = CATHOLIC_BIBLE_BOOKS.find(b => 
        b.name.toLowerCase().includes(bookName.toLowerCase())
      );

      if (foundBook) {
        setSelectedBook(foundBook);
        setSelectedChapter(parseInt(chapter));
        setViewMode('reading');
        loadContent(foundBook.name, parseInt(chapter), verse ? parseInt(verse) : undefined);
        return;
      }
    }
    // Se não for referência, apenas filtra a biblioteca
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setViewMode('chapters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChapterClick = (chap: number) => {
    setSelectedChapter(chap);
    setViewMode('reading');
    loadContent(selectedBook.name, chap);
  };

  const navigateChapter = (dir: number) => {
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      loadContent(selectedBook.name, next);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!searchQuery || searchQuery.includes(':')) return CANON;
    const result: any = { "Busca": { "Resultados": [] } };
    const q = searchQuery.toLowerCase();
    CATHOLIC_BIBLE_BOOKS.forEach(b => {
      if (b.name.toLowerCase().includes(q)) {
        result["Busca"]["Resultados"].push(b.name);
      }
    });
    return result;
  }, [searchQuery]);

  const SidebarBooks = () => (
    <div className={`fixed inset-y-0 left-0 z-[500] w-80 bg-white dark:bg-[#0c0a09] border-r border-gold/20 shadow-4xl transform transition-transform duration-500 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
      <header className="p-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif font-bold text-gold">Canon Catholicus</h3>
          <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">73 Livros Sagrados</p>
        </div>
        <button onClick={() => setShowSidebar(false)} className="p-2 text-stone-300 hover:text-gold transition-colors">
          <Icons.Cross className="w-5 h-5 rotate-45" />
        </button>
      </header>
      <div className="overflow-y-auto h-[calc(100%-120px)] custom-scrollbar p-4 space-y-8">
        {Object.entries(CANON).map(([testament, categories]) => (
          <div key={testament} className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/40 px-4">{testament}</h4>
            {Object.entries(categories as any).map(([category, books]) => (
              <div key={category} className="space-y-1">
                <p className="text-[8px] font-bold uppercase text-stone-300 px-4 mb-2">{category}</p>
                {(books as string[]).map(bookName => {
                  const bData = CATHOLIC_BIBLE_BOOKS.find(b => b.name === bookName)!;
                  const isCurrent = selectedBook.name === bookName;
                  return (
                    <button 
                      key={bookName}
                      onClick={() => { handleBookClick(bData); setShowSidebar(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${isCurrent ? 'bg-gold text-stone-900 font-bold' : 'hover:bg-gold/5 text-stone-600 dark:text-stone-400'}`}
                    >
                      <span className="font-serif text-sm">{bookName}</span>
                      <Icons.ArrowDown className={`w-3 h-3 -rotate-90 transition-transform ${isCurrent ? 'text-stone-900' : 'text-stone-200 group-hover:text-gold'}`} />
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
           <div className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] shadow-sacred border border-gold/30 rotate-3 transition-transform hover:rotate-0">
              <Icons.Book className="w-16 h-16 text-sacred dark:text-gold" />
           </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
          <p className="text-stone-400 italic text-2xl font-serif">"O Verbo se fez carne e habitou entre nós."</p>
        </div>
        <form onSubmit={handleGlobalSearch} className="max-w-2xl mx-auto px-4 relative group">
           <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors" />
           <input 
            type="text" 
            placeholder="João 3:16 ou Gênesis..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-24 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-xl outline-none focus:border-gold transition-all text-xl font-serif italic"
           />
           <button type="submit" className="absolute right-8 top-1/2 -translate-y-1/2 px-5 py-2 bg-gold text-stone-900 rounded-full font-black uppercase text-[8px] tracking-widest shadow-lg">Abrir</button>
        </form>
      </header>

      <div className="space-y-20 px-4">
        {Object.entries(filteredBooks).map(([testament, categories]) => (
          <section key={testament} className="space-y-12">
            <div className="flex items-center gap-6">
              <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
              <div className="h-px flex-1 bg-gold/10" />
            </div>
            <div className="grid gap-16">
              {Object.entries(categories as any).map(([category, books]) => (
                <div key={category} className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred dark:text-gold/60 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-sacred" /> {category}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(books as string[]).map(bookName => {
                      const bookData = CATHOLIC_BIBLE_BOOKS.find(b => b.name === bookName)!;
                      const isOffline = offlineBooks.has(bookName);
                      return (
                        <button 
                          key={bookName}
                          onClick={() => handleBookClick(bookData)}
                          className={`p-6 rounded-[2.5rem] border shadow-lg transition-all text-left group relative overflow-hidden h-36 flex flex-col justify-between ${isOffline ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'} hover:-translate-y-2 hover:border-gold`}
                        >
                          <div className="relative z-10">
                             <h5 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight truncate">{bookName}</h5>
                             <p className="text-[9px] uppercase text-stone-400 mt-2 font-black tracking-widest">{bookData.chapters} Capítulos</p>
                          </div>
                          {isOffline && <div className="absolute -bottom-2 -right-2 opacity-10"><Icons.Download className="w-12 h-12" /></div>}
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

  const ChapterSelector = () => (
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
            const isViewing = selectedChapter === chapterNum;
            return (
              <button 
                key={i} 
                onClick={() => handleChapterClick(chapterNum)}
                className={`aspect-square rounded-[2.5rem] flex flex-col items-center justify-center font-serif transition-all shadow-xl active:scale-95 group relative overflow-hidden ${
                  isViewing 
                    ? 'bg-[#b8952e] text-white border-4 border-gold shadow-[0_0_40px_rgba(184,149,46,0.6)] scale-110 z-10' 
                    : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-white hover:border-gold hover:scale-105'
                }`}
              >
                <span className="text-3xl font-bold">{chapterNum}</span>
                {isViewing && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
              </button>
            );
          })}
       </div>
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-48 relative">
      <SidebarBooks />
      {showSidebar && <div className="fixed inset-0 z-[490] bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />}

      <nav className="sticky top-2 md:top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl rounded-full md:rounded-[3rem] border border-stone-200 dark:border-white/10 shadow-2xl p-2 md:p-3 flex items-center justify-between mx-2 md:mx-0">
         <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setShowSidebar(true)} className="p-3 md:p-4 bg-stone-900 text-gold rounded-full hover:bg-gold hover:text-stone-900 transition-all shadow-lg group">
              <Icons.Menu className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-full p-1 border border-stone-200 dark:border-stone-800 shadow-inner">
               <button onClick={() => setViewMode('library')} className="px-4 md:px-6 py-2 hover:bg-white dark:hover:bg-stone-800 rounded-full text-stone-900 dark:text-white font-serif font-bold text-xs md:text-lg transition-colors">{selectedBook.name}</button>
               <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-1 md:mx-2" />
               <form onSubmit={(e) => { e.preventDefault(); navigateChapter(0); }} className="relative flex items-center group">
                  <input 
                    type="number" 
                    value={chapterInput}
                    onChange={e => setChapterInput(e.target.value)}
                    className="w-12 md:w-20 px-1 md:px-2 py-1 bg-transparent border-none text-gold font-serif font-bold text-xl md:text-2xl text-center outline-none focus:ring-0"
                    onBlur={() => navigateChapter(0)}
                  />
                  <span className="text-[10px] font-black uppercase text-stone-300 mr-4">Cap.</span>
               </form>
            </div>
         </div>
         
         <div className="flex items-center gap-2 md:gap-6 px-4 md:px-10 border-x border-stone-100 dark:border-white/5">
            <button onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} className="p-2 md:p-3 text-stone-300 hover:text-gold disabled:opacity-10 transition-all">
              <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
            </button>
            <div className="flex flex-col items-center min-w-[40px] md:min-w-[80px]">
               <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 select-none">Versículo</span>
               <span className="text-sm md:text-xl font-serif font-bold text-gold tabular-nums transition-all">{activeVerse}</span>
            </div>
            <button onClick={() => scrollToVerse(activeVerse + 1)} disabled={activeVerse >= verses.length} className="p-2 md:p-3 text-stone-300 hover:text-gold disabled:opacity-10 transition-all">
              <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5" />
            </button>
         </div>

         <div className="flex items-center gap-2 md:gap-4 pr-2">
            <div className="hidden lg:flex items-center gap-2 bg-stone-50 dark:bg-stone-800 p-2 rounded-2xl border border-stone-100 dark:border-stone-700">
               <span className="text-[9px] font-black text-stone-400">A</span>
               <input 
                 type="range" min="0.8" max="2.5" step="0.1" value={fontSize} 
                 onChange={e => setFontSize(parseFloat(e.target.value))}
                 className="w-20 h-1 bg-stone-200 dark:bg-stone-900 rounded-lg appearance-none cursor-pointer accent-gold"
               />
               <span className="text-sm font-black text-stone-400">A</span>
            </div>
            <ActionButtons className="hidden sm:flex" itemId={`bible_${selectedBook.name}_${selectedChapter}`} type="verse" title={`${selectedBook.name} ${selectedChapter}`} content={verses.map(v => v.text).join(' ')} />
         </div>
      </nav>

      <header className="bg-white dark:bg-stone-900 p-12 md:p-24 rounded-[4rem] md:rounded-[5rem] shadow-xl border-t-[12px] md:border-t-[20px] border-gold text-center relative overflow-hidden mx-2 md:mx-0">
         <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none">
            <Icons.Cross className="w-80 h-80" />
         </div>
         <div className="relative z-10 space-y-6">
            <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] text-gold">{selectedBook.category}</span>
            <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{selectedBook.name} {selectedChapter}</h2>
            <div className="h-px w-32 bg-gold/20 mx-auto mt-10" />
         </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-0">
        <article 
          className="parchment dark:bg-stone-900/40 p-10 md:p-20 rounded-[3rem] md:rounded-[5rem] shadow-inner border border-stone-100 dark:border-stone-800 relative min-h-[60vh] overflow-hidden"
          style={{ fontSize: `${fontSize}rem` }}
        >
           {loading ? (
              <div className="py-40 text-center space-y-8 animate-pulse">
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-2xl font-serif italic text-stone-400">Escutando o Verbo...</p>
              </div>
           ) : (
             <div className="space-y-4">
                {verses.map((v) => (
                  <VerseItem 
                    key={v.verse} 
                    v={v} 
                    isActive={activeVerse === v.verse} 
                    onSelect={scrollToVerse} 
                  />
                ))}
             </div>
           )}
           <div className="mt-20 pt-16 border-t border-stone-100 dark:border-stone-800 flex justify-center opacity-10 pb-10">
              <Icons.Cross className="w-16 h-16" />
           </div>
        </article>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-6 pb-40 px-4 md:px-0">
         <button 
           disabled={selectedChapter <= 1}
           onClick={() => navigateChapter(-1)}
           className="px-12 md:px-14 py-7 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] disabled:opacity-10 transition-all hover:border-gold shadow-xl flex items-center justify-center gap-6 group"
         >
           <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:-translate-x-2 transition-transform" /> Anterior
         </button>
         <button 
           disabled={selectedChapter >= selectedBook.chapters}
           onClick={() => navigateChapter(1)}
           className="px-16 md:px-24 py-7 bg-gold text-stone-900 rounded-full md:rounded-[3rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] shadow-[0_25px_50px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-6 group"
         >
           Próximo <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:translate-x-2 transition-transform" />
         </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto page-enter overflow-x-hidden">
      {viewMode === 'library' && <LibraryView />}
      {viewMode === 'chapters' && <ChapterSelector />}
      {viewMode === 'reading' && <ReadingView />}
    </div>
  );
};

export default Bible;
