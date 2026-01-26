
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
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

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<'local' | 'api' | 'ia' | 'static'>('static');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterInput, setChapterInput] = useState<string>('1');
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [offlineBooks, setOfflineBooks] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState(1.3);

  // States for Immersive Mode
  const [isImmersive, setIsImmersive] = useState(false);
  const [immersiveBg, setImmersiveBg] = useState<ImmersiveBg>('parchment');

  const refreshOfflineStatus = useCallback(async () => {
    const books = await offlineStorage.getDownloadedBooks();
    setOfflineBooks(books);
  }, []);

  useEffect(() => { refreshOfflineStatus(); }, [refreshOfflineStatus]);

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    setVerses([]);
    setLoading(true);
    setActiveVerse(1);
    setChapterInput(String(chapter));
    
    try {
      const localPersisted = await offlineStorage.getBibleVerses(bookName, chapter);
      if (localPersisted && localPersisted.length > 0) {
        setVerses(localPersisted);
        setSourceType('local');
        setLoading(false);
        return;
      }

      if (isOnline) {
        const apiData = await fetchExternalBibleText(bookName, chapter, 'almeida');
        if (apiData && apiData.length > 0) {
           setVerses(apiData);
           setSourceType('api');
           await offlineStorage.saveBibleVerses(bookName, chapter, apiData);
           await refreshOfflineStatus();
           setLoading(false);
           return;
        }
      }

      if (isOnline) {
        setSourceType('ia');
        const iaData = await fetchBibleChapterIA(bookName, chapter, lang);
        if (iaData && iaData.length > 0) {
           setVerses(iaData);
           await offlineStorage.saveBibleVerses(bookName, chapter, iaData);
           await refreshOfflineStatus();
           setLoading(false);
           return;
        }
      }

      const staticData = getBibleVersesLocal(bookName, chapter);
      if (staticData.length > 0) {
        setVerses(staticData);
        setSourceType('static');
      } else {
        setVerses([{ book: bookName, chapter, verse: 1, text: "Conteúdo indisponível offline." }]);
      }
      
    } catch (e) {
      console.error("Erro no Scriptuarium:", e);
    } finally {
      setLoading(false);
    }
  }, [isOnline, lang, refreshOfflineStatus]);

  const scrollToVerse = (vNum: number) => {
    setActiveVerse(vNum);
    const el = document.getElementById(`v-${vNum}`);
    if (el) {
      const yOffset = -150; 
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpChapter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(chapterInput);
    if (!isNaN(val) && val >= 1 && val <= selectedBook.chapters) {
      setSelectedChapter(val);
      loadContent(selectedBook.name, val);
    } else {
      setChapterInput(String(selectedChapter));
    }
  };

  const navigateChapter = (dir: number) => {
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      loadContent(selectedBook.name, next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return CANON;
    const result: any = { "Busca": { "Resultados": [] } };
    const q = searchQuery.toLowerCase();
    CATHOLIC_BIBLE_BOOKS.forEach(b => {
      if (b.name.toLowerCase().includes(q)) {
        result["Busca"]["Resultados"].push(b.name);
      }
    });
    return result;
  }, [searchQuery]);

  const renderedVerses = useMemo(() => (
    verses.map((v) => (
      <span 
        key={v.verse} 
        id={`v-${v.verse}`}
        onClick={() => setActiveVerse(v.verse)}
        className={`inline group break-words transition-all duration-500 rounded-lg px-1 cursor-pointer ${activeVerse === v.verse ? 'bg-gold/10 ring-1 ring-gold/20' : 'hover:bg-gold/5'}`}
      >
        <sup className={`text-[0.6em] font-black mr-2 select-none ${activeVerse === v.verse ? 'text-sacred scale-125 inline-block' : 'text-stone-300'}`}>{v.verse}</sup>
        <span className="font-serif tracking-tight leading-relaxed">{v.text} </span>
      </span>
    ))
  ), [verses, activeVerse]);

  const LibraryView = () => (
    <div className="space-y-12 md:space-y-24 animate-in fade-in duration-700 pb-32">
      <header className="text-center space-y-8 pt-10">
        <div className="flex justify-center">
           <div className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] shadow-sacred border border-gold/30 rotate-3">
              <Icons.Book className="w-16 h-16 text-sacred dark:text-gold" />
           </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
          <p className="text-stone-400 italic text-2xl font-serif">"O Verbo se fez carne e habitou entre nós."</p>
        </div>
        <div className="max-w-2xl mx-auto px-4 relative group">
           <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors" />
           <input 
            type="text" 
            placeholder="Qual volume você deseja abrir?" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-xl outline-none focus:border-gold transition-all text-xl font-serif italic"
           />
        </div>
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
                          className={`p-6 rounded-[2.5rem] border shadow-lg transition-all text-left group relative overflow-hidden h-36 flex flex-col justify-between ${isOffline ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'} hover:-translate-y-2 hover:border-gold`}
                        >
                          <div className="relative z-10">
                             <h5 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight truncate">{bookName}</h5>
                             <p className="text-[9px] uppercase text-stone-400 mt-2 font-black tracking-widest">{bookData.chapters} Capítulos</p>
                          </div>
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
            const isActive = selectedChapter === chapterNum;
            return (
              <button 
                key={i} 
                onClick={() => handleChapterClick(chapterNum)}
                className={`aspect-square rounded-[2rem] flex items-center justify-center font-serif text-3xl font-bold transition-all shadow-xl active:scale-95 ${
                  isActive 
                    ? 'bg-gold text-stone-900 border-4 border-gold shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-110 z-10' 
                    : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-white hover:bg-gold/10 hover:border-gold hover:scale-110'
                }`}
              >
                {chapterNum}
              </button>
            );
          })}
       </div>
    </div>
  );

  const ImmersiveLectorium = () => {
    const bgStyles: Record<ImmersiveBg, string> = {
      parchment: 'bg-[#fdfcf8] text-stone-800 parchment',
      sepia: 'bg-[#f4ecd8] text-[#5b4636]',
      dark: 'bg-[#0c0a09] text-stone-300',
      white: 'bg-white text-stone-900'
    };

    return (
      <div className={`fixed inset-0 z-[1000] overflow-y-auto custom-scrollbar animate-in fade-in duration-500 ${bgStyles[immersiveBg]}`}>
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
           <header className="text-center mb-16 space-y-4 opacity-50 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-black uppercase tracking-[1em]">{selectedBook.category}</span>
              <h2 className="text-4xl md:text-7xl font-serif font-bold tracking-tighter">{selectedBook.name} {selectedChapter}</h2>
              <div className="h-px w-20 bg-current mx-auto opacity-20" />
           </header>

           <article 
             className="font-serif leading-[2] tracking-tight text-justify"
             style={{ fontSize: `${fontSize * 1.2}rem` }}
           >
             {renderedVerses}
           </article>

           <div className="mt-24 pt-12 border-t border-current opacity-10 flex justify-center">
              <Icons.Cross className="w-12 h-12" />
           </div>
        </div>

        {/* Floating Minimal Controls */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1010] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom-4">
           <div className="flex items-center gap-3 border-r border-white/10 pr-6">
              {(['parchment', 'sepia', 'dark', 'white'] as ImmersiveBg[]).map(bg => (
                <button 
                  key={bg}
                  onClick={() => setImmersiveBg(bg)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${immersiveBg === bg ? 'border-gold scale-110 shadow-lg' : 'border-white/20'}`}
                  style={{ backgroundColor: bg === 'parchment' ? '#fdfcf8' : bg === 'sepia' ? '#f4ecd8' : bg === 'dark' ? '#0c0a09' : '#ffffff' }}
                />
              ))}
           </div>
           <div className="flex items-center gap-4 border-r border-white/10 pr-6">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Fonte</span>
              <input 
                type="range" min="1" max="2.5" step="0.1" value={fontSize} 
                onChange={e => setFontSize(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
              />
           </div>
           <button 
             onClick={() => setIsImmersive(false)}
             className="flex items-center gap-2 text-white hover:text-gold transition-colors text-[10px] font-black uppercase tracking-widest"
           >
             <Icons.Cross className="w-4 h-4 rotate-45" /> Sair
           </button>
        </div>
      </div>
    );
  };

  const ReadingView = () => (
    <div className="space-y-8 animate-in fade-in duration-700 pb-48">
      {isImmersive && <ImmersiveLectorium />}

      <nav className="sticky top-2 md:top-4 z-[200] bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-xl rounded-full md:rounded-[3rem] border border-stone-200 dark:border-white/10 shadow-2xl p-2 md:p-3 flex items-center justify-between mx-2 md:mx-0">
         <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('chapters')} className="p-3 md:p-4 bg-stone-50 dark:bg-stone-800 hover:bg-gold hover:text-stone-900 rounded-full transition-all text-stone-400">
              <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 rotate-90" />
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-full p-1 border border-stone-200 dark:border-stone-800">
               <button onClick={() => setViewMode('library')} className="px-4 md:px-6 py-2 hover:bg-white dark:hover:bg-stone-800 rounded-full text-stone-900 dark:text-white font-serif font-bold text-sm md:text-lg truncate max-w-[80px] md:max-w-[120px]">{selectedBook.name}</button>
               <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-1 md:mx-2" />
               <form onSubmit={handleJumpChapter} className="relative flex items-center">
                  <input 
                    type="number" 
                    value={chapterInput}
                    onChange={e => setChapterInput(e.target.value)}
                    className="w-10 md:w-16 px-1 md:px-2 py-1 bg-transparent border-none text-gold font-serif font-bold text-xl md:text-2xl text-center outline-none focus:ring-0"
                    min="1"
                    max={selectedBook.chapters}
                  />
                  <button type="submit" className="p-1 md:p-2 text-stone-400 hover:text-gold transition-colors">
                     <Icons.Search className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
               </form>
            </div>
         </div>
         
         <div className="flex items-center gap-2 md:gap-6 px-2 md:px-10 border-x border-stone-100 dark:border-white/5">
            <button 
              disabled={activeVerse <= 1}
              onClick={() => scrollToVerse(activeVerse - 1)}
              className="p-2 md:p-3 text-stone-400 hover:text-gold disabled:opacity-20 transition-all"
              aria-label="Versículo anterior"
            >
              <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
            </button>
            <div className="flex flex-col items-center min-w-[50px] md:min-w-[100px]">
               <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">Versículo</span>
               <span className="text-sm md:text-xl font-serif font-bold text-gold">{activeVerse}</span>
            </div>
            <button 
              disabled={activeVerse >= verses.length}
              onClick={() => scrollToVerse(activeVerse + 1)}
              className="p-2 md:p-3 text-stone-400 hover:text-gold disabled:opacity-20 transition-all"
              aria-label="Próximo versículo"
            >
              <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5" />
            </button>
         </div>

         <div className="flex items-center gap-2 md:gap-4 px-2 md:px-4">
            <button 
               onClick={() => setIsImmersive(true)}
               className="p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-gold hover:text-stone-900 transition-all text-stone-400"
               title="Modo Lectorium (Imersivo)"
            >
               <Icons.Layout className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-1 md:gap-2">
               <span className="text-[10px] md:text-xs font-black text-stone-400">A</span>
               <input 
                 type="range" min="0.8" max="2.5" step="0.1" value={fontSize} 
                 onChange={e => setFontSize(parseFloat(e.target.value))}
                 className="w-12 md:w-24 h-1 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-gold"
                 aria-label="Ajustar tamanho da fonte"
               />
               <span className="text-sm md:text-lg font-black text-stone-400">A</span>
            </div>
            <ActionButtons className="hidden sm:flex" itemId={`bible_${selectedBook.name}_${selectedChapter}`} type="verse" title={`${selectedBook.name} ${selectedChapter}`} content={verses.map(v => v.text).join(' ')} />
         </div>
      </nav>

      <header className="bg-white dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] md:rounded-[5rem] shadow-xl border-t-[12px] md:border-t-[16px] border-gold text-center relative overflow-hidden mx-2 md:mx-0">
         <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none">
            <Icons.Cross className="w-64 h-64" />
         </div>
         <div className="relative z-10 space-y-6">
            <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.8em] text-gold">{selectedBook.category}</span>
            <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{selectedBook.name} {selectedChapter}</h2>
            <div className="h-px w-32 bg-gold/30 mx-auto mt-8" />
         </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-0">
        <article 
          className="parchment dark:bg-stone-900/50 p-8 md:p-24 rounded-[3rem] md:rounded-[6rem] shadow-inner border border-stone-100 dark:border-stone-800 relative min-h-[70vh] overflow-hidden"
          style={{ fontSize: `${fontSize}rem`, lineHeight: '1.9' }}
        >
           {loading ? (
              <div className="py-40 text-center space-y-8 animate-pulse">
                <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-3xl font-serif italic text-stone-400">Escutando o Verbo...</p>
              </div>
           ) : (
             <div className="relative z-10 text-stone-800 dark:text-stone-200 text-justify tracking-tight">
                {renderedVerses}
             </div>
           )}
           <div className="mt-24 pt-12 border-t border-stone-100 dark:border-stone-800 flex justify-center opacity-10">
              <Icons.Cross className="w-16 h-16" />
           </div>
        </article>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-6 pb-40 px-4 md:px-0">
         <button 
           disabled={selectedChapter <= 1}
           onClick={() => navigateChapter(-1)}
           className="px-10 md:px-12 py-6 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] disabled:opacity-20 transition-all hover:border-gold shadow-xl flex items-center justify-center gap-4"
         >
           <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 rotate-90" /> Anterior
         </button>
         <button 
           disabled={selectedChapter >= selectedBook.chapters}
           onClick={() => navigateChapter(1)}
           className="px-14 md:px-16 py-6 bg-gold text-stone-900 rounded-full md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.5em] shadow-[0_25px_50px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
         >
           Próximo <Icons.ArrowDown className="w-4 h-4 md:w-5 md:h-5 -rotate-90" />
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
