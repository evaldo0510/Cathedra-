
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Icons } from '../constants';
import { fetchRealBibleText } from '../services/gemini';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback } from '../services/bibleLocal';
import { Verse, Language } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const CANON = getCatholicCanon();

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'library' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [quickJump, setQuickJump] = useState('');

  const chapterCount = useMemo(() => getChapterCount(selectedBook), [selectedBook]);

  // Lista plana de todos os livros para busca rápida
  const allBooks = useMemo(() => {
    const list: string[] = [];
    Object.values(CANON).forEach(testament => {
      Object.values(testament).forEach(books => {
        list.push(...books);
      });
    });
    return list;
  }, []);

  const loadContent = useCallback(async (book: string, chapter: number) => {
    setLoading(true);
    setVerses([]);
    setViewMode('reading');
    
    try {
      const data = await fetchRealBibleText(book, chapter, selectedVersion.name, lang as any);
      if (data && data.length > 0) {
        setVerses(data);
      } else {
        setVerses(fetchLocalFallback(book, chapter));
      }
    } catch (e) {
      setVerses(fetchLocalFallback(book, chapter));
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedVersion, lang]);

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
      
      const foundBook = allBooks.find(b => 
        b.toLowerCase().startsWith(bookName.toLowerCase())
      );

      if (foundBook) {
        setSelectedBook(foundBook);
        setSelectedChapter(chapter);
        setQuickJump('');
        setViewMode('reading');
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < chapterCount) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      const currentIndex = allBooks.indexOf(selectedBook);
      if (currentIndex < allBooks.length - 1) {
        setSelectedBook(allBooks[currentIndex + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      const currentIndex = allBooks.indexOf(selectedBook);
      if (currentIndex > 0) {
        const prevBook = allBooks[currentIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(getChapterCount(prevBook));
      }
    }
  };

  const LibraryView = () => (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header className="text-center space-y-6 max-w-4xl mx-auto">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
        <p className="text-stone-400 italic text-2xl">Explore os tesouros da Palavra Eterna</p>
        
        {/* Barra de Salto Rápido */}
        <form onSubmit={handleQuickJump} className="max-w-xl mx-auto mt-10 relative group">
           <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/40 transition-colors group-focus-within:text-gold" />
           <input 
             type="text" 
             placeholder="Salto Rápido (Ex: João 3, Gn 1)"
             value={quickJump}
             onChange={e => setQuickJump(e.target.value)}
             className="w-full pl-16 pr-6 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-xl text-stone-800 dark:text-white font-serif italic text-xl outline-none focus:border-gold transition-all"
           />
        </form>
      </header>

      <div className="space-y-24">
        {Object.entries(CANON).map(([testament, categories]) => (
          <section key={testament} className="space-y-12">
            <div className="flex items-center gap-6">
              <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
            <div className="grid gap-16">
              {Object.entries(categories).map(([category, books]) => (
                <div key={category} className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-sacred" />
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {books.map(book => (
                      <button 
                        key={book}
                        onClick={() => { setSelectedBook(book); setShowChapterSelector(true); }}
                        className="p-6 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-lg hover:border-gold hover:scale-105 transition-all text-left group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h5 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight relative z-10">{book}</h5>
                        <p className="text-[8px] uppercase text-stone-400 mt-2 font-black tracking-widest">{getChapterCount(book)} Capítulos</p>
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
  );

  return (
    <div className="max-w-7xl mx-auto pb-48 space-y-8 page-enter relative">
      {viewMode === 'reading' && (
        <nav className="sticky top-4 z-[200] bg-[#1a1917]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-4xl p-4 flex items-center justify-between animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('library')} className="p-4 bg-white/5 hover:bg-gold hover:text-stone-900 rounded-2xl transition-all text-gold group shadow-inner">
                <Icons.ArrowDown className="w-5 h-5 rotate-90" />
              </button>
              <div className="flex items-center bg-stone-900 rounded-2xl border border-white/10 p-1">
                 <button onClick={() => setShowBookSelector(true)} className="px-6 py-2 hover:bg-white/5 rounded-xl transition-all text-white font-serif font-bold">{selectedBook}</button>
                 <div className="w-px h-6 bg-white/10 mx-1" />
                 <button onClick={() => setShowChapterSelector(true)} className="px-6 py-2 hover:bg-white/5 rounded-xl transition-all text-gold font-serif font-bold text-xl">{selectedChapter}</button>
              </div>
           </div>
           
           <div className="hidden md:flex gap-2">
              {Array.from({ length: Math.min(10, chapterCount) }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedChapter(i + 1)}
                  className={`w-10 h-10 rounded-xl font-serif font-bold text-sm transition-all ${selectedChapter === i + 1 ? 'bg-gold text-stone-900 scale-110 shadow-lg' : 'bg-white/5 text-stone-500 hover:text-white'}`}
                >
                  {i + 1}
                </button>
              ))}
              {chapterCount > 10 && <span className="text-stone-700 flex items-center px-2">...</span>}
           </div>
        </nav>
      )}

      <main>
        {viewMode === 'library' ? <LibraryView /> : (
          <div className="space-y-12 mt-8 px-4">
            <section className="bg-white dark:bg-[#1a1917] p-8 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-white/5 relative overflow-hidden min-h-[60vh]">
               {/* Decoração Sacra */}
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                 <Icons.Cross className="w-96 h-96" />
               </div>

               <header className="mb-16 border-b border-stone-50 dark:border-white/5 pb-10 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Capítulo {selectedChapter}</span>
                    <h2 className="text-4xl md:text-7xl font-serif font-bold dark:text-stone-100 tracking-tight">{selectedBook}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Versão</p>
                    <p className="text-lg font-serif italic text-gold">{selectedVersion.name}</p>
                  </div>
               </header>

               <div className="space-y-12">
                  {loading ? (
                    <div className="py-20 text-center space-y-6">
                      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-3xl font-serif italic text-stone-400">Deslacrando o Manuscrito...</p>
                    </div>
                  ) : verses.length > 0 ? (
                    verses.map((v, i) => (
                      <div key={i} className="group relative transition-all duration-300 pb-8 border-b border-stone-50 dark:border-white/5 last:border-0">
                        <div className="flex gap-6 items-start">
                          <span className="text-xs font-serif font-black mt-2 text-sacred opacity-40 group-hover:opacity-100 transition-opacity w-8 text-right">{v.verse}</span>
                          <div className="flex-1">
                            <p className="font-serif leading-relaxed text-2xl md:text-4xl text-stone-800 dark:text-stone-300 transition-colors group-hover:text-stone-900 dark:group-hover:text-white">
                              {v.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                       <p className="text-2xl font-serif italic text-stone-400">Nenhum texto encontrado para este capítulo.</p>
                    </div>
                  )}
               </div>
            </section>

            {/* Navegação de Rodapé */}
            <div className="flex flex-col md:flex-row justify-center gap-6">
               <button 
                 onClick={handlePrevChapter}
                 className="flex-1 max-w-sm px-10 py-10 bg-stone-100 dark:bg-stone-900 rounded-[3rem] text-left group hover:border-gold border border-transparent transition-all"
               >
                 <span className="text-[10px] font-black uppercase text-stone-400 mb-2 block">Anterior</span>
                 <p className="font-serif font-bold text-2xl text-stone-800 dark:text-stone-200">Voltar Página</p>
               </button>
               <button 
                 onClick={handleNextChapter}
                 className="flex-1 max-w-sm px-12 py-10 bg-gold rounded-[3rem] text-left group hover:bg-yellow-400 transition-all shadow-2xl"
               >
                 <span className="text-[10px] font-black uppercase text-stone-900/60 mb-2 block">Próximo</span>
                 <p className="font-serif font-bold text-3xl text-stone-900">Avançar Leitura</p>
               </button>
            </div>
          </div>
        )}
      </main>

      {/* SELETOR DE CAPÍTULOS (MODAL) */}
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
                    className="aspect-square rounded-2xl font-serif font-bold text-xl flex items-center justify-center transition-all bg-stone-900/50 border border-white/5 text-stone-400 hover:bg-gold hover:text-stone-900 hover:scale-110"
                   >
                     {i + 1}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* SELETOR DE LIVROS (MODAL) */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8" onClick={() => setShowBookSelector(false)}>
           <div className="bg-[#0c0a09] w-full max-w-7xl h-[90vh] rounded-[5rem] shadow-4xl border border-white/10 overflow-hidden flex flex-col animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-stone-900/50">
                 <h2 className="text-4xl md:text-6xl font-serif font-bold text-gold tracking-tight">Scriptuarium</h2>
                 <form onSubmit={handleQuickJump} className="flex-1 max-w-2xl">
                    <input 
                      type="text" 
                      placeholder="Ir para livro ou sigla (João 3, Gn 1)..." 
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
                         {Object.entries(categories).map(([category, books]) => (
                           <div key={category} className="space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-sacred rounded-full" /> {category}
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                 {books.map(b => (
                                   <button 
                                    key={b} 
                                    onClick={() => { setSelectedBook(b); setShowBookSelector(false); setShowChapterSelector(true); }}
                                    className="p-5 bg-stone-900/50 border border-white/5 rounded-2xl text-left hover:border-gold transition-all"
                                   >
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
    </div>
  );
};

export default Bible;
