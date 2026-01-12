
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Icons } from '../constants';
import { fetchRealBibleText, generateSpeech } from '../services/gemini';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback } from '../services/bibleLocal';
import { Verse, Language } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'reading' | 'library'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]); // Ave Maria
  
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const lastScrollY = useRef(0);
  const chapterRibbonRef = useRef<HTMLDivElement>(null);

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

  const stopAudio = useCallback(() => {
    // Lógica de áudio herdada do App.tsx ou utilitários
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

  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault();
    // Ex: "Gn 1", "Mateus 5", "Ap 22"
    const match = quickSearch.match(/^([a-zA-Z\s]+)\s*(\d+)$/i);
    if (match) {
      const bookPart = match[1].trim().toLowerCase();
      const ch = parseInt(match[2]);
      
      const book = allBooksList.find(b => 
        b.toLowerCase().startsWith(bookPart) || 
        (bookPart === 'gn' && b === 'Gênesis') ||
        (bookPart === 'ap' && b === 'Apocalipse')
      );

      if (book) {
        setSelectedBook(book);
        setSelectedChapter(ch);
        setQuickSearch('');
        setShowBookSelector(false);
      }
    }
  };

  const LibraryView = () => (
    <div className="space-y-16 animate-in fade-in duration-700 pt-10 px-4">
      <header className="text-center space-y-6 max-w-4xl mx-auto">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl">Tradução Ave Maria • Texto Integral</p>
        
        <form onSubmit={handleQuickJump} className="relative group max-w-xl mx-auto mt-10">
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/40" />
          <input 
            type="text" 
            placeholder="Salto Rápido (Ex: Gn 1 ou Mateus 5)"
            value={quickSearch}
            onChange={e => setQuickSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-xl text-stone-800 dark:text-white font-serif italic text-xl outline-none focus:border-gold transition-all"
          />
        </form>
      </header>

      <div className="space-y-24">
        {Object.entries(CANON).map(([testament, categories]) => (
          <section key={testament} className="space-y-12">
            <div className="flex items-center gap-6">
              <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
            <div className="grid gap-16">
              {Object.entries(categories as any).map(([category, books]) => (
                <div key={category} className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-sacred flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-sacred" />
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(books as string[]).map(book => (
                      <button 
                        key={book}
                        onClick={() => { setSelectedBook(book); setShowChapterSelector(true); }}
                        className="p-6 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-lg hover:border-gold hover:scale-105 transition-all text-left group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h5 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold leading-tight relative z-10">{book}</h5>
                        <p className="text-[8px] uppercase text-stone-400 mt-2 font-black tracking-widest">{getChapterCount(book)} Caps</p>
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
    <div className={`max-w-7xl mx-auto pb-48 space-y-4 page-enter relative transition-all duration-1000`}>
      
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
              <span className="hidden md:block text-[10px] font-black uppercase text-gold/40 tracking-[0.5em]">Biblia Sacra Ave Maria</span>
            </div>

            <div ref={chapterRibbonRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {Array.from({ length: chapterCount }).map((_, i) => {
                const ch = i + 1;
                const isSelected = selectedChapter === ch;
                return (
                  <button key={ch} onClick={() => setSelectedChapter(ch)} className={`flex-shrink-0 min-w-[45px] h-11 rounded-xl font-serif font-bold text-sm transition-all ${isSelected ? 'bg-gold text-stone-900 scale-110 shadow-lg' : 'bg-white/5 text-stone-500 hover:text-white'}`}>
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
          <div className="space-y-12 mt-8 px-4">
            <section className={`bg-white dark:bg-[#1a1917] p-8 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-white/5 relative overflow-hidden`}>
               {/* Marcas d'água e decorativos */}
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                 <Icons.Cross className="w-96 h-96" />
               </div>

               <header className="mb-16 border-b border-stone-100 dark:border-white/5 pb-10 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Capitulum {selectedChapter}</span>
                    <h2 className="text-4xl md:text-7xl font-serif font-bold dark:text-stone-100 tracking-tight">{selectedBook}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Tradução Oficial</p>
                    <p className="text-lg font-serif italic text-gold">Ave Maria</p>
                  </div>
               </header>

               <div className="space-y-12 min-h-[50vh]">
                  {loading ? (
                    <div className="space-y-10 py-20 text-center">
                      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                      <p className="text-3xl font-serif italic text-stone-400">Recuperando o Manuscrito...</p>
                    </div>
                  ) : verses.map((v, i) => (
                    <div key={i} className="group relative transition-all duration-300 pb-10 border-b border-stone-50 dark:border-white/5 last:border-0 hover:pl-2">
                      <div className="flex gap-6 items-start">
                        <span className={`text-xs font-serif font-black mt-2 text-sacred opacity-40 group-hover:opacity-100 transition-opacity`}>{v.verse}</span>
                        <div className="flex-1">
                          <p className={`font-serif leading-relaxed text-2xl md:text-4xl text-stone-800 dark:text-stone-300 transition-colors group-hover:text-stone-900 dark:group-hover:text-white`}>
                            {v.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </section>

            <div className="mt-20 flex flex-col md:flex-row justify-center gap-6">
              <button 
                onClick={() => { if (selectedChapter > 1) setSelectedChapter(selectedChapter - 1); }}
                disabled={selectedChapter === 1}
                className="flex-1 max-w-sm px-10 py-10 bg-stone-100 dark:bg-stone-900 rounded-[3rem] text-left group hover:border-gold border border-transparent transition-all disabled:opacity-20"
              >
                <span className="text-[10px] font-black uppercase text-stone-400 mb-2 block">Capítulo Anterior</span>
                <p className="font-serif font-bold text-2xl text-stone-800 dark:text-stone-200">Voltar Página</p>
              </button>
              <button 
                onClick={() => { if (selectedChapter < chapterCount) setSelectedChapter(selectedChapter + 1); }}
                disabled={selectedChapter === chapterCount}
                className="flex-1 max-w-sm px-12 py-10 bg-gold rounded-[3rem] text-left group hover:bg-yellow-400 transition-all shadow-2xl disabled:opacity-20"
              >
                <span className="text-[10px] font-black uppercase text-stone-900/60 mb-2 block">Próximo Capítulo</span>
                <p className="font-serif font-bold text-3xl text-stone-900">Avançar Leitura</p>
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
                   <button key={i} onClick={() => { setSelectedChapter(i + 1); setViewMode('reading'); setShowChapterSelector(false); }} className="aspect-square rounded-2xl font-serif font-bold text-xl flex items-center justify-center transition-all bg-stone-900/50 border border-white/5 text-stone-400 hover:bg-gold hover:text-stone-900 hover:scale-110">
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
                 <form onSubmit={handleQuickJump} className="flex-1 max-w-2xl">
                    <input 
                      type="text" 
                      placeholder="Ir para livro ou sigla (Gn, Mt, Ap)..." 
                      value={quickSearch} 
                      autoFocus
                      onChange={e => setQuickSearch(e.target.value)} 
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
                                   <button key={b} onClick={() => { setSelectedBook(b); setShowBookSelector(false); setShowChapterSelector(true); }} className="p-5 bg-stone-900/50 border border-white/5 rounded-2xl text-left hover:border-gold transition-all">
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Bible;
