
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Icons } from '../constants';
import { getCatholicCanon, getChapterCount, getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchExternalBibleText } from '../services/bibleApi';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { offlineStorage } from '../services/offlineStorage';
import { fetchBibleChapterIA } from '../services/gemini';

const CANON = getCatholicCanon();

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const { isOnline } = useOfflineMode();
  
  // Modos: 'library', 'chapters', 'reading'
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<'local' | 'api' | 'ia' | 'static'>('static');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [offlineBooks, setOfflineBooks] = useState<Set<string>>(new Set());

  // Lectorium Settings
  const [fontSize, setFontSize] = useState(1.4); // rem

  const refreshOfflineStatus = useCallback(async () => {
    const books = await offlineStorage.getDownloadedBooks();
    setOfflineBooks(books);
  }, []);

  useEffect(() => { refreshOfflineStatus(); }, [refreshOfflineStatus]);

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    setLoading(true);
    setVerses([]);
    const mainArea = document.querySelector('main');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      // 1. Tentar Cache Local (IndexedDB)
      const localPersisted = await offlineStorage.getBibleVerses(bookName, chapter);
      if (localPersisted && localPersisted.length > 0) {
        setVerses(localPersisted);
        setSourceType('local');
        setLoading(false);
        return;
      }

      // 2. Tentar API Externa (Standard Text)
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

      // 3. Tentar Nexus IA (Geração/Transcrição via Gemini)
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

      // 4. Fallback: Estático (Apenas para os livros principais)
      const staticData = getBibleVersesLocal(bookName, chapter);
      if (staticData.length > 0) {
        setVerses(staticData);
        setSourceType('static');
      } else {
        setVerses([{ book: bookName, chapter, verse: 1, text: "Conteúdo indisponível offline. Por favor, conecte-se para baixar este volume." }]);
      }
      
    } catch (e) {
      console.error("Erro no Scriptuarium:", e);
    } finally {
      setLoading(false);
    }
  }, [isOnline, lang, refreshOfflineStatus]);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setViewMode('chapters');
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

  const LibraryView = () => (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20">
      <header className="text-center space-y-8 pt-10">
        <div className="flex justify-center">
           <div className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-sacred border border-gold/30">
              <Icons.Book className="w-16 h-16 text-sacred dark:text-gold" />
           </div>
        </div>
        <div>
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
          <p className="text-stone-400 italic text-2xl font-serif mt-2">"Lâmpada para os meus pés é a Tua Palavra."</p>
        </div>

        <div className="max-w-2xl mx-auto px-4 relative">
           <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300" />
           <input 
            type="text" 
            placeholder="Buscar livro... (Ex: Isaias, João, Macabeus)" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-xl outline-none focus:border-gold transition-all text-xl font-serif italic"
           />
        </div>
      </header>

      <div className="space-y-24 px-4">
        {Object.entries(filteredBooks).map(([testament, categories]) => (
          <section key={testament} className="space-y-12">
            <div className="flex items-center gap-6">
              <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
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
                          className={`p-6 rounded-[2.5rem] border shadow-lg transition-all text-left group relative overflow-hidden active:scale-95 flex flex-col justify-between h-32 ${isOffline ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
                        >
                          <div className="relative z-10">
                             <h5 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight">{bookName}</h5>
                             <p className="text-[9px] uppercase text-stone-400 mt-1 font-black tracking-widest">{bookData.chapters} Capítulos</p>
                          </div>
                          <div className="flex justify-end items-center mt-2">
                             {isOffline ? <Icons.Pin className="w-4 h-4 text-emerald-500" /> : <Icons.ArrowDown className="w-4 h-4 -rotate-90 text-stone-200 opacity-0 group-hover:opacity-100 transition-all" />}
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
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-32">
       <button onClick={() => setViewMode('library')} className="flex items-center gap-3 text-gold text-[10px] font-black uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
          <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar aos Volumes
       </button>
       
       <header className="text-center space-y-4">
          <span className="text-[12px] font-black uppercase tracking-[0.5em] text-gold">{selectedBook.category}</span>
          <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook.name}</h2>
          <p className="text-stone-400 italic text-xl">Selecione a porta de entrada</p>
       </header>

       <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 max-w-5xl mx-auto px-4">
          {Array.from({ length: selectedBook.chapters }).map((_, i) => (
            <button 
              key={i} 
              onClick={() => handleChapterClick(i + 1)}
              className="aspect-square rounded-[2rem] bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 flex items-center justify-center font-serif text-3xl font-bold hover:bg-gold hover:text-stone-900 hover:border-gold hover:scale-110 active:scale-95 transition-all shadow-xl dark:text-white"
            >
              {i + 1}
            </button>
          ))}
       </div>
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-40">
      <nav className="sticky top-4 z-[200] bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl rounded-[2.5rem] border border-stone-200 dark:border-white/10 shadow-4xl p-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('chapters')} className="p-4 bg-stone-50 dark:bg-stone-800 hover:bg-gold hover:text-stone-900 rounded-2xl transition-all text-stone-400">
              <Icons.ArrowDown className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-1">
               <button onClick={() => setViewMode('library')} className="px-6 py-2 hover:bg-white dark:hover:bg-stone-800 rounded-xl text-stone-900 dark:text-white font-serif font-bold text-lg">{selectedBook.name}</button>
               <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-1" />
               <button onClick={() => setViewMode('chapters')} className="px-6 py-2 hover:bg-white dark:hover:bg-stone-800 rounded-xl text-gold font-serif font-bold text-2xl">{selectedChapter}</button>
            </div>
         </div>
         
         <div className="hidden md:flex items-center gap-4 px-6 border-l border-stone-100 dark:border-stone-800">
            <button onClick={() => setFontSize(Math.max(1, fontSize - 0.1))} className="text-stone-300 hover:text-gold transition-colors font-serif text-lg">A-</button>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Lectorium</span>
            <button onClick={() => setFontSize(Math.min(3, fontSize + 0.1))} className="text-stone-300 hover:text-gold transition-colors font-serif text-2xl">A+</button>
         </div>

         <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hidden sm:flex items-center gap-2 ${sourceType === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'}`}>
               <Icons.Pin className="w-3 h-3" /> {sourceType === 'local' ? 'Volume Preservado' : 'Sincronizado'}
            </span>
         </div>
      </nav>

      <article 
        className="parchment dark:bg-stone-950 p-8 md:p-24 rounded-[4rem] shadow-3xl border border-stone-200 dark:border-white/5 relative overflow-hidden min-h-[70vh]"
        style={{ fontSize: `${fontSize}rem` }}
      >
         <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
           <Icons.Cross className="w-[40rem] h-[40rem]" />
         </div>

         {loading ? (
            <div className="py-40 text-center space-y-8 animate-pulse">
              <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-3xl font-serif italic text-stone-400">Instalando os manuscritos do céu...</p>
            </div>
         ) : (
           <div className="space-y-10 relative z-10 max-w-4xl mx-auto">
              {verses.map((v, i) => (
                <div key={i} className="group relative transition-all duration-300 pb-8 border-b border-stone-50 dark:border-white/5 last:border-0 hover:bg-stone-50/30 dark:hover:bg-white/5 rounded-3xl p-4">
                  <div className="flex gap-10 items-start">
                    <span className="text-sm font-serif font-black mt-2 text-sacred dark:text-gold opacity-30 group-hover:opacity-100 transition-opacity w-10 text-right">{v.verse}</span>
                    <div className="flex-1">
                      <p className="font-serif leading-relaxed text-stone-800 dark:text-stone-300 transition-colors group-hover:text-stone-900 dark:group-hover:text-white">
                        {v.text}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                       <ActionButtons itemId={`v_${v.book}_${v.chapter}_${v.verse}`} type="verse" title={`${v.book} ${v.chapter}:${v.verse}`} content={v.text} />
                    </div>
                  </div>
                </div>
              ))}
           </div>
         )}
      </article>

      <div className="flex justify-center gap-6 pb-20">
         <button 
           disabled={selectedChapter <= 1}
           onClick={() => navigateChapter(-1)}
           className="px-10 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] disabled:opacity-20 transition-all hover:border-gold shadow-lg"
         >
           Reverter Caput
         </button>
         <button 
           disabled={selectedChapter >= selectedBook.chapters}
           onClick={() => navigateChapter(1)}
           className="px-16 py-6 bg-gold text-stone-900 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all"
         >
           Seguir Fluxo
         </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto page-enter">
      {viewMode === 'library' && <LibraryView />}
      {viewMode === 'chapters' && <ChapterSelector />}
      {viewMode === 'reading' && <ReadingView />}
    </div>
  );
};

export default Bible;
