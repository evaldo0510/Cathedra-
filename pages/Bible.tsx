
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Icons } from '../constants';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, getBibleVersesLocal, BIBLE_VERSES } from '../services/bibleLocal';
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
  const [viewMode, setViewMode] = useState<'library' | 'reading' | 'search'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [offlineBooks, setOfflineBooks] = useState<Set<string>>(new Set());
  const [syncingBook, setSyncingBook] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'static' | 'local' | 'ia'>('static');
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [quickJump, setQuickJump] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const chapterCount = useMemo(() => getChapterCount(selectedBook), [selectedBook]);

  const allBooks = useMemo(() => {
    const list: string[] = [];
    Object.values(CANON).forEach(testament => {
      Object.values(testament as any).forEach(books => {
        list.push(...(books as string[]));
      });
    });
    return list;
  }, []);

  const refreshOfflineStatus = useCallback(async () => {
    const books = await offlineStorage.getDownloadedBooks();
    setOfflineBooks(books);
  }, []);

  useEffect(() => {
    refreshOfflineStatus();
  }, [viewMode, refreshOfflineStatus]);

  const loadContent = useCallback(async (book: string, chapter: number) => {
    setLoading(true);
    setVerses([]);
    setViewMode('reading');
    
    try {
      // 1. Tentar Memória Local (IndexedDB)
      const localPersisted = await offlineStorage.getBibleVerses(book, chapter);
      if (localPersisted && localPersisted.length > 0) {
        setVerses(localPersisted);
        setSourceType('local');
        setLoading(false);
        return;
      }

      // 2. Tentar Cânon Estático (Gênesis, Salmos, etc)
      const hasStatic = BIBLE_VERSES[book]?.[String(chapter)];
      if (hasStatic) {
        const staticData = getBibleVersesLocal(book, chapter);
        setVerses(staticData);
        setSourceType('static');
        setLoading(false);
        return;
      }

      // 3. Se estiver Online, Extrair via IA Gemini (Nexus Scripturae)
      if (isOnline) {
        setSourceType('ia');
        const iaData = await fetchBibleChapterIA(book, chapter, lang);
        if (iaData && iaData.length > 0) {
           setVerses(iaData);
           // Auto-preservação: Salva no banco local para uso futuro offline
           await offlineStorage.saveBibleVerses(book, chapter, iaData);
           await refreshOfflineStatus();
        } else {
           throw new Error("IA falhou na extração");
        }
      } else {
        // Fallback offline se não houver no banco
        setVerses([{ book, chapter, verse: 1, text: "Este manuscrito ainda não foi preservado em sua memória local e você está sem conexão com o Santuário Digital." }]);
      }
    } catch (e) {
      console.error("Erro ao carregar Bíblia:", e);
      setVerses([{ book, chapter, verse: 1, text: "Erro ao acessar o arquivo. Tente novamente em instantes." }]);
    } finally {
      setLoading(false);
      const mainArea = document.querySelector('main');
      if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOnline, lang, refreshOfflineStatus]);

  useEffect(() => {
    if (viewMode === 'reading') {
      loadContent(selectedBook, selectedChapter);
    }
  }, [selectedChapter, selectedBook, viewMode, loadContent]);

  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault();
    const match = quickJump.match(/^([a-zA-Z\u00C0-\u00FF\s]+)\s*(\d+)$/i);
    if (match) {
      const bookName = match[1].trim();
      const chapter = parseInt(match[2]);
      const foundBook = allBooks.find(b => b.toLowerCase().startsWith(bookName.toLowerCase()));
      if (foundBook) {
        setSelectedBook(foundBook);
        setSelectedChapter(chapter);
        setQuickJump('');
        setViewMode('reading');
      }
    }
  };

  const handleOfflineSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const results = await offlineStorage.searchOfflineText(searchQuery);
    setSearchResults(results);
    setLoading(false);
  };

  // Melhoria: O download agora busca dados reais via IA antes de salvar
  const preserveBook = async (book: string) => {
    if (!isOnline) {
      alert("É necessário conexão para baixar novos livros via IA.");
      return;
    }
    setSyncingBook(book);
    const chapters = getChapterCount(book);
    
    try {
      // Baixamos apenas os 3 primeiros capítulos para não exceder limites de tokens num loop
      // Em um produto real, isso seria feito via stream ou API REST dedicada
      for (let c = 1; c <= Math.min(chapters, 5); c++) {
         const iaData = await fetchBibleChapterIA(book, c, lang);
         if (iaData.length > 0) {
            await offlineStorage.saveBibleVerses(book, c, iaData);
         }
      }
      await refreshOfflineStatus();
      alert(`Os primeiros capítulos de ${book} foram preservados. Abra outros capítulos para baixá-los automaticamente.`);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingBook(null);
    }
  };

  const LibraryView = () => (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20">
      <header className="text-center space-y-6 max-w-4xl mx-auto pt-10">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
        <p className="text-stone-400 italic text-2xl">A Palavra de Deus em 73 volumes eternos.</p>
        
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-6 py-3 rounded-2xl border border-emerald-500/20 inline-flex items-center gap-3">
          <Icons.Pin className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Memória de Pedra Ativa: {offlineBooks.size} / 73 Preservados</span>
        </div>

        <div className="flex justify-center gap-4 mt-8">
           <button onClick={() => setViewMode('library')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${viewMode === 'library' ? 'bg-sacred text-white border-sacred' : 'bg-white dark:bg-stone-900 text-stone-400'}`}>Biblioteca</button>
           <button onClick={() => setViewMode('search')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${viewMode === 'search' ? 'bg-sacred text-white border-sacred' : 'bg-white dark:bg-stone-900 text-stone-400'}`}>Busca Local</button>
        </div>

        {viewMode === 'library' ? (
          <form onSubmit={handleQuickJump} className="max-w-xl mx-auto mt-10 relative group">
             <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/40 transition-colors group-focus-within:text-gold" />
             <input 
               type="text" 
               placeholder="Salto Rápido (Ex: João 3, Salmos 23)"
               value={quickJump}
               onChange={e => setQuickJump(e.target.value)}
               className="w-full pl-16 pr-6 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-xl text-stone-800 dark:text-white font-serif italic text-xl outline-none focus:border-gold transition-all"
             />
          </form>
        ) : (
          <form onSubmit={handleOfflineSearch} className="max-w-xl mx-auto mt-10 relative group">
             <input 
               type="text" 
               placeholder="Pesquisar nos volumes preservados..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full pl-8 pr-20 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-xl text-stone-800 dark:text-white font-serif italic text-xl outline-none focus:border-gold transition-all"
             />
             <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-gold text-stone-900 rounded-2xl"><Icons.Search className="w-5 h-5" /></button>
          </form>
        )}
      </header>

      {viewMode === 'search' ? (
        <div className="grid gap-6 px-4">
           {searchResults.length > 0 ? searchResults.map((r, i) => (
             <button key={i} onClick={() => { setSelectedBook(r.book); setSelectedChapter(r.chapter); setViewMode('reading'); }} className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 text-left hover:border-gold transition-all group">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black uppercase text-sacred">{r.book} {r.chapter}:{r.verse}</span>
                   <Icons.Pin className="w-3 h-3 text-emerald-500" />
                </div>
                <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300">"{r.text}"</p>
             </button>
           )) : !loading && searchQuery && (
             <div className="text-center py-20 opacity-30">
                <Icons.Search className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl font-serif italic">Nenhum versículo encontrado na sua memória local.</p>
             </div>
           )}
        </div>
      ) : (
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
                      <div className="w-2 h-2 rounded-full bg-sacred" />
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {(books as string[]).map(book => {
                        const isOffline = offlineBooks.has(book);
                        const isSyncing = syncingBook === book;
                        return (
                          <div 
                            key={book}
                            className={`p-6 rounded-[2rem] border shadow-lg transition-all text-left group relative overflow-hidden ${isOffline ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/40' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
                          >
                            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                              <button onClick={() => { setSelectedBook(book); setShowChapterSelector(true); }} className="flex-1 text-left">
                                <h5 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight">{book}</h5>
                                <p className="text-[8px] uppercase text-stone-400 mt-2 font-black tracking-widest">{getChapterCount(book)} Caps</p>
                              </button>
                              {!isOffline && !isSyncing ? (
                                <button 
                                  onClick={() => preserveBook(book)}
                                  className="p-2 text-stone-300 hover:text-emerald-500 transition-colors"
                                  title="Preservar Offline"
                                >
                                  <Icons.Download className="w-4 h-4" />
                                </button>
                              ) : isSyncing ? (
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Icons.Pin className="w-3 h-3 text-emerald-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );

  const getSourceLabel = () => {
    switch(sourceType) {
      case 'static': return 'Arquivo Histórico';
      case 'local': return 'Memória de Pedra';
      case 'ia': return 'Nuvem Nexus IA';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 page-enter relative">
      {viewMode === 'reading' && (
        <nav className="sticky top-4 z-[200] bg-[#1a1917]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-4xl p-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('library')} className="p-4 bg-white/5 hover:bg-gold hover:text-stone-900 rounded-2xl transition-all text-gold">
                <Icons.ArrowDown className="w-5 h-5 rotate-90" />
              </button>
              <div className="flex items-center bg-stone-900 rounded-2xl border border-white/10 p-1 shadow-inner">
                 <button onClick={() => setShowBookSelector(true)} className="px-6 py-2 hover:bg-white/5 rounded-xl text-white font-serif font-bold">{selectedBook}</button>
                 <div className="w-px h-6 bg-white/10 mx-1" />
                 <button onClick={() => setShowChapterSelector(true)} className="px-6 py-2 hover:bg-white/5 rounded-xl text-gold font-serif font-bold text-xl">{selectedChapter}</button>
              </div>
           </div>
           
           <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[40%] md:max-w-none pr-4">
              {Array.from({ length: Math.min(10, chapterCount) }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedChapter(i + 1)}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl font-serif font-bold text-sm transition-all ${selectedChapter === i + 1 ? 'bg-gold text-stone-900 scale-110 shadow-lg' : 'bg-white/5 text-stone-500 hover:text-white'}`}
                >
                  {i + 1}
                </button>
              ))}
              {chapterCount > 10 && <span className="text-stone-700 flex items-center px-2">...</span>}
           </div>
        </nav>
      )}

      <main>
        {viewMode !== 'reading' ? <LibraryView /> : (
          <div className="space-y-12 mt-8 px-4">
            <section className="bg-white dark:bg-[#1a1917] p-8 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-white/5 relative overflow-hidden min-h-[60vh]">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                 <Icons.Cross className="w-96 h-96" />
               </div>

               <header className="mb-16 border-b border-stone-50 dark:border-white/5 pb-10 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Capitulum {selectedChapter}</span>
                    <h2 className="text-4xl md:text-7xl font-serif font-bold dark:text-stone-100 tracking-tight">{selectedBook}</h2>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 ${sourceType === 'local' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : sourceType === 'ia' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                      <Icons.Pin className="w-2.5 h-2.5" /> {getSourceLabel()}
                    </span>
                    <p className="text-lg font-serif italic text-gold">{selectedVersion.name}</p>
                  </div>
               </header>

               <div className="space-y-12 pb-20">
                  {loading ? (
                    <div className="py-20 text-center space-y-6">
                      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-3xl font-serif italic text-stone-400">Extraindo do Nexus Scripturae...</p>
                    </div>
                  ) : verses.length > 0 ? (
                    verses.map((v, i) => (
                      <div key={i} className="group relative transition-all duration-300 pb-10 border-b border-stone-50 dark:border-white/5 last:border-0 hover:pl-4">
                        <div className="flex gap-6 items-start">
                          <span className="text-xs font-serif font-black mt-2 text-sacred opacity-40 group-hover:opacity-100 transition-opacity w-8 text-right">{v.verse}</span>
                          <div className="flex-1">
                            <p className="font-serif leading-relaxed text-2xl md:text-4xl text-stone-800 dark:text-stone-300 transition-colors group-hover:text-stone-900 dark:group-hover:text-white">
                              {v.text}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <ActionButtons itemId={`v_${v.book}_${v.chapter}_${v.verse}`} type="verse" title={`${v.book} {v.chapter}:{v.verse}`} content={v.text} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-30">
                       <Icons.Book className="w-16 h-16 mx-auto mb-4" />
                       <p className="text-2xl font-serif italic">Nenhum manuscrito disponível offline para esta página.</p>
                    </div>
                  )}
               </div>
            </section>

            <div className="flex flex-col md:flex-row justify-center gap-6 pb-20">
               <button 
                 onClick={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
                 className="flex-1 max-w-sm px-10 py-10 bg-stone-100 dark:bg-stone-900 rounded-[3rem] text-left group hover:border-gold border border-transparent transition-all"
               >
                 <span className="text-[10px] font-black uppercase text-stone-400 mb-2 block">Capítulo Anterior</span>
                 <p className="font-serif font-bold text-2xl text-stone-800 dark:text-stone-200">Voltar Página</p>
               </button>
               <button 
                 onClick={() => setSelectedChapter(selectedChapter + 1)}
                 className="flex-1 max-w-sm px-12 py-10 bg-gold text-stone-900 rounded-[3rem] text-left group hover:bg-yellow-400 transition-all shadow-2xl"
               >
                 <span className="text-[10px] font-black uppercase text-stone-900/60 mb-2 block">Avançar Leitura</span>
                 <p className="font-serif font-bold text-3xl text-stone-900">Seguir Fluxo</p>
               </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE CAPÍTULOS */}
      {showChapterSelector && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4" onClick={() => setShowChapterSelector(false)}>
           <div className="bg-[#0c0a09] w-full max-w-4xl max-h-[85vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-12 border-b border-white/5 bg-stone-900/50 flex justify-between items-center">
                 <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold/50">Librum</span>
                   <h2 className="text-4xl md:text-6xl font-serif font-bold text-white">{selectedBook}</h2>
                 </div>
                 <button onClick={() => setShowChapterSelector(false)} className="p-4 bg-white/5 rounded-full text-stone-500"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
              </header>
              <div className="p-12 overflow-y-auto custom-scrollbar grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                 {Array.from({ length: chapterCount }).map((_, i) => (
                   <button 
                    key={i} 
                    onClick={() => { setSelectedChapter(i + 1); setViewMode('reading'); setShowChapterSelector(false); }}
                    className={`aspect-square rounded-2xl font-serif font-bold text-xl flex items-center justify-center transition-all bg-stone-900/50 border border-white/5 text-stone-400 hover:bg-gold hover:text-stone-900 hover:scale-110 ${selectedChapter === i+1 ? 'bg-gold text-stone-900' : ''}`}
                   >
                     {i + 1}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
      
      {/* MODAL DE LIVROS */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8" onClick={() => setShowBookSelector(false)}>
           <div className="bg-[#0c0a09] w-full max-w-7xl h-[90vh] rounded-[5rem] shadow-4xl border border-white/10 overflow-hidden flex flex-col animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-stone-900/50">
                 <h2 className="text-4xl md:text-6xl font-serif font-bold text-gold tracking-tight">Scriptuarium</h2>
                 <form onSubmit={handleQuickJump} className="flex-1 max-w-2xl relative">
                    <input 
                      type="text" 
                      placeholder="Ir para livro ou sigla (João 3, Salmos 23)..." 
                      value={quickJump} 
                      autoFocus
                      onChange={e => setQuickJump(e.target.value)} 
                      className="w-full px-10 py-6 bg-white/5 border border-white/10 rounded-[3rem] outline-none text-white text-2xl font-serif italic focus:border-gold transition-all"
                    />
                 </form>
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
                                 {(books as string[]).map(b => (
                                   <div 
                                    key={b} 
                                    className={`p-5 border rounded-2xl text-left transition-all relative ${offlineBooks.has(b) ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-stone-900/50 border-white/5 hover:border-gold'}`}
                                   >
                                      <button 
                                        onClick={() => { setSelectedBook(b); setShowBookSelector(false); setShowChapterSelector(true); }}
                                        className="w-full text-left"
                                      >
                                         <div className="flex justify-between items-center">
                                            <span className="font-serif font-bold text-lg text-stone-300">{b}</span>
                                            {offlineBooks.has(b) && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                         </div>
                                      </button>
                                   </div>
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
    </div>
  );
};

export default Bible;
