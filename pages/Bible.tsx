
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Icons } from '../constants';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
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
  
  // Modos: 'library' (lista de livros), 'chapters' (grid de capítulos), 'reading' (texto)
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<'static' | 'local' | 'ia'>('static');
  
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [offlineBooks, setOfflineBooks] = useState<Set<string>>(new Set());

  const refreshOfflineStatus = useCallback(async () => {
    const books = await offlineStorage.getDownloadedBooks();
    setOfflineBooks(books);
  }, []);

  useEffect(() => { refreshOfflineStatus(); }, [refreshOfflineStatus]);

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    setLoading(true);
    setVerses([]);
    
    try {
      // 1. Tentar Memória Local (IndexedDB - "Instalado")
      const localPersisted = await offlineStorage.getBibleVerses(bookName, chapter);
      if (localPersisted && localPersisted.length > 0) {
        setVerses(localPersisted);
        setSourceType('local');
        setLoading(false);
        return;
      }

      // 2. Tentar Cânon Estático (Exemplos rápidos)
      const staticData = getBibleVersesLocal(bookName, chapter);
      if (staticData.length > 0) {
        setVerses(staticData);
        setSourceType('static');
        setLoading(false);
        return;
      }

      // 3. Se Online, Instalar via Nexus IA
      if (isOnline) {
        setSourceType('ia');
        const iaData = await fetchBibleChapterIA(bookName, chapter, lang);
        if (iaData && iaData.length > 0) {
           setVerses(iaData);
           // Grava permanentemente (Instalação)
           await offlineStorage.saveBibleVerses(bookName, chapter, iaData);
           await refreshOfflineStatus();
           setLoading(false);
           return;
        }
      }

      // Fallback: Se estiver offline e não tiver o livro, avisar
      setVerses([{ book: bookName, chapter, verse: 1, text: "Este capítulo ainda não foi instalado para leitura offline. Conecte-se à internet uma vez para que o Nexus Scripturae o registre na memória local." }]);
      
    } catch (e) {
      console.error("Erro ao carregar manuscritos:", e);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const LibraryView = () => (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20">
      <header className="text-center space-y-4 pt-10">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
        <p className="text-stone-400 italic text-2xl font-serif">"Lâmpada para os meus pés é a Tua Palavra."</p>
        <div className="bg-emerald-500/10 text-emerald-600 px-6 py-2 rounded-full border border-emerald-500/20 inline-flex items-center gap-2">
           <Icons.Pin className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">{offlineBooks.size} Volumes Instalados</span>
        </div>
      </header>

      <div className="space-y-24 px-4">
        {Object.entries(CANON).map(([testament, categories]) => (
          <section key={testament} className="space-y-12">
            <div className="flex items-center gap-6">
              <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
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
                          onClick={() => handleBookClick(bookData)}
                          className={`p-6 rounded-[2.5rem] border shadow-lg transition-all text-left group relative overflow-hidden active:scale-95 ${isOffline ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
                        >
                          <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                            <div>
                               <h5 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight">{bookName}</h5>
                               <p className="text-[8px] uppercase text-stone-400 mt-2 font-black tracking-widest">{bookData.chapters} Capítulos</p>
                            </div>
                            {isOffline && <div className="flex justify-end"><Icons.Pin className="w-3 h-3 text-emerald-500" /></div>}
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
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
       <button onClick={() => setViewMode('library')} className="flex items-center gap-3 text-gold text-[10px] font-black uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
          <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar aos Volumes
       </button>
       
       <header className="text-center space-y-4">
          <span className="text-[12px] font-black uppercase tracking-[0.5em] text-gold">{selectedBook.category}</span>
          <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook.name}</h2>
          <p className="text-stone-400 italic text-xl">Selecione o capítulo para leitura</p>
       </header>

       <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-4 max-w-4xl mx-auto px-4">
          {Array.from({ length: selectedBook.chapters }).map((_, i) => (
            <button 
              key={i} 
              onClick={() => handleChapterClick(i + 1)}
              className="aspect-square rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 flex items-center justify-center font-serif text-2xl font-bold hover:bg-gold hover:text-stone-900 hover:border-gold hover:scale-110 active:scale-95 transition-all shadow-md dark:text-white"
            >
              {i + 1}
            </button>
          ))}
       </div>
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-12 animate-in fade-in duration-700">
      <nav className="sticky top-4 z-[200] bg-[#1a1917]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-4xl p-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('chapters')} className="p-4 bg-white/5 hover:bg-gold hover:text-stone-900 rounded-2xl transition-all text-gold">
              <Icons.ArrowDown className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center bg-stone-900 rounded-2xl border border-white/10 p-1 shadow-inner">
               <button onClick={() => setViewMode('library')} className="px-6 py-2 hover:bg-white/5 rounded-xl text-white font-serif font-bold">{selectedBook.name}</button>
               <div className="w-px h-6 bg-white/10 mx-1" />
               <button onClick={() => setViewMode('chapters')} className="px-6 py-2 hover:bg-white/5 rounded-xl text-gold font-serif font-bold text-xl">{selectedChapter}</button>
            </div>
         </div>
         <div className="flex gap-2 pr-4">
            <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${sourceType === 'local' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold/10 text-gold'}`}>
               <Icons.Pin className="w-3 h-3" /> {sourceType === 'local' ? 'Volume Instalado' : 'Sincronizado via Nexus'}
            </span>
         </div>
      </nav>

      <article className="parchment dark:bg-[#1a1917] p-8 md:p-24 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-white/5 relative overflow-hidden min-h-[60vh]">
         <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
           <Icons.Cross className="w-96 h-96" />
         </div>

         {loading ? (
            <div className="py-40 text-center space-y-6">
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-2xl font-serif italic text-stone-400">Instalando manuscritos no dispositivo...</p>
            </div>
         ) : (
           <div className="space-y-12">
              {verses.map((v, i) => (
                <div key={i} className="group relative transition-all duration-300 pb-10 border-b border-stone-50 dark:border-white/5 last:border-0">
                  <div className="flex gap-8 items-start">
                    <span className="text-xs font-serif font-black mt-2 text-sacred opacity-40 group-hover:opacity-100 transition-opacity w-10 text-right">{v.verse}</span>
                    <div className="flex-1">
                      <p className="font-serif leading-relaxed text-2xl md:text-4xl text-stone-800 dark:text-stone-300 transition-colors group-hover:text-stone-900 dark:group-hover:text-white">
                        {v.text}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
           onClick={() => handleChapterClick(selectedChapter - 1)}
           className="px-10 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl font-black uppercase text-[10px] tracking-widest disabled:opacity-20 transition-all hover:border-gold"
         >
           Capítulo Anterior
         </button>
         <button 
           disabled={selectedChapter >= selectedBook.chapters}
           onClick={() => handleChapterClick(selectedChapter + 1)}
           className="px-16 py-6 bg-gold text-stone-900 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
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
