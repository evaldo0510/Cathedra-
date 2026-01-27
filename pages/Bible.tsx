
import React, { useState, useEffect, useCallback, useContext, memo, useTransition } from 'react';
import { Icons } from '../constants';
import { getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchExternalBibleText } from '../services/bibleApi';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { offlineStorage } from '../services/offlineStorage';

// Componente de Versículo Harmonizado com o Catecismo
const VerseItem = memo(({ v, isActive, onSelect, bookName, chapter, fontSize }: { 
  v: Verse, 
  isActive: boolean, 
  onSelect: (n: number) => void,
  bookName: string,
  chapter: number,
  fontSize: number
}) => (
  <article 
    id={`v-${v.verse}`}
    onClick={() => onSelect(v.verse)}
    style={{ 
      contentVisibility: 'auto', 
      containIntrinsicSize: '0 60px',
      fontSize: `${fontSize}rem`
    }}
    className={`p-6 md:p-10 rounded-[2.5rem] border-2 transition-all duration-700 group relative overflow-hidden mb-6 cursor-pointer ${
      isActive 
        ? 'bg-gold/15 border-gold shadow-[0_20px_50px_rgba(212,175,55,0.2)] ring-8 ring-gold/5 scale-[1.02] z-10' 
        : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/30'
    }`}
  >
    {isActive && <div className="absolute top-0 left-0 w-full h-1.5 bg-gold animate-shimmer" />}
    
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all duration-500 ${isActive ? 'bg-gold text-stone-900 scale-110' : 'bg-stone-900 dark:bg-stone-700 text-gold'}`}>
          § {v.verse}
        </div>
        <span className={`text-[10px] font-serif italic transition-colors ${isActive ? 'text-gold' : 'text-stone-400'}`}>
          {bookName} {chapter}:{v.verse}
        </span>
      </div>
      
      {isActive && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
           <ActionButtons 
            itemId={`v_${bookName}_${chapter}_${v.verse}`} 
            type="verse" 
            title={`${bookName} ${chapter}:${v.verse}`} 
            content={v.text} 
            className="scale-90"
           />
        </div>
      )}
    </header>

    <p className={`font-serif leading-relaxed tracking-tight text-justify transition-all duration-500 ${isActive ? 'text-stone-900 dark:text-stone-50 font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
      {v.text}
    </p>
  </article>
));

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [fontSize, setFontSize] = useState(1.1);
  const [isPending, startTransition] = useTransition();

  const scrollToVerse = (vNum: number) => {
    if (!verses || vNum < 1 || vNum > verses.length) return;
    setActiveVerse(vNum);
    const el = document.getElementById(`v-${vNum}`);
    if (el) {
      const offset = 200;
      const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      document.getElementById('main-content')?.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    setLoading(true);
    setVerses(null); 
    
    try {
      let data = await offlineStorage.getBibleVerses(bookName, chapter);
      if (!data) {
        data = await fetchExternalBibleText(bookName, chapter, 'almeida') || getBibleVersesLocal(bookName, chapter);
        if (data && data.length > 0) await offlineStorage.saveBibleVerses(bookName, chapter, data);
      }
      
      startTransition(() => {
        setVerses(data);
        setActiveVerse(1);
      });
      
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'auto' });
    } catch (e) { 
      console.error("Erro ao carregar Escrituras:", e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  const navigateChapter = (dir: number) => {
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      loadContent(selectedBook.name, next);
    }
  };

  const Breadcrumbs = () => (
    <nav className="flex items-center gap-2 mb-8 bg-white/50 dark:bg-stone-900/50 p-3 rounded-2xl w-fit border border-stone-100 dark:border-stone-800">
      <button onClick={() => setViewMode('library')} className="text-[10px] font-black uppercase text-stone-400 hover:text-gold transition-colors">Biblioteca</button>
      <Icons.ArrowDown className="w-2 h-2 -rotate-90 text-stone-300" />
      <button onClick={() => setViewMode('chapters')} className={`text-[10px] font-black uppercase transition-colors ${viewMode === 'chapters' ? 'text-gold' : 'text-stone-400 hover:text-gold'}`}>{selectedBook.name}</button>
      {viewMode === 'reading' && (
        <>
          <Icons.ArrowDown className="w-2 h-2 -rotate-90 text-stone-300" />
          <span className="text-[10px] font-black uppercase text-gold">Cap. {selectedChapter}</span>
        </>
      )}
    </nav>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-40 px-2 md:px-4">
      {viewMode === 'library' && (
        <div className="space-y-12 pt-6">
          <header className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-8 bg-[#1a1a1a] rounded-[2.5rem] shadow-sacred border border-gold/20 rotate-3">
                <Icons.Book className="w-12 h-12 text-gold" />
              </div>
            </div>
            <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter leading-none">Scriptuarium</h2>
            <p className="text-stone-400 italic text-xl md:text-2xl font-serif">A Palavra que permanece para sempre.</p>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
             {CATHOLIC_BIBLE_BOOKS.map((b, i) => (
               <button key={i} onClick={() => { setSelectedBook(b); setViewMode('chapters'); }} className="p-6 md:p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-lg text-left hover:border-gold transition-all group overflow-hidden relative">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-125 transition-transform">
                    <Icons.Cross className="w-24 h-24" />
                  </div>
                  <span className="text-[7px] font-black uppercase text-stone-300 dark:text-stone-600 block mb-1 tracking-widest">{b.category}</span>
                  <h4 className="text-xl font-serif font-bold leading-tight group-hover:text-sacred dark:group-hover:text-gold transition-colors">{b.name}</h4>
                  <p className="text-[9px] text-stone-400 mt-2 font-black uppercase tracking-tighter">{b.chapters} Capítulos</p>
               </button>
             ))}
          </div>
        </div>
      )}

      {viewMode === 'chapters' && (
        <div className="space-y-8 animate-in slide-in-from-right-4 pt-6">
           <Breadcrumbs />
           <header className="text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">{selectedBook.category}</span>
              <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook.name}</h2>
              <div className="h-px w-24 bg-gold/30 mx-auto" />
           </header>
           <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-5xl mx-auto px-4 pb-20">
              {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                <button key={i} onClick={() => { setSelectedChapter(i + 1); setViewMode('reading'); loadContent(selectedBook.name, i + 1); }} className={`aspect-square rounded-[1.5rem] flex items-center justify-center font-serif text-2xl font-bold transition-all shadow-md ${selectedChapter === (i+1) ? 'bg-gold text-stone-900 scale-110 shadow-gold/20' : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-gold/50'}`}>{i + 1}</button>
              ))}
           </div>
        </div>
      )}

      {viewMode === 'reading' && (
        <div className="min-h-screen pt-4 pb-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <Breadcrumbs />
            <div className="flex bg-white dark:bg-stone-900 p-1 rounded-full border border-stone-100 dark:border-stone-800 shadow-sm self-start">
               <button onClick={() => navigateChapter(-1)} disabled={selectedChapter <= 1} className="p-3 text-stone-300 hover:text-gold disabled:opacity-10"><Icons.ArrowDown className="w-4 h-4 rotate-90" /></button>
               <div className="px-6 py-2 font-serif font-bold text-lg text-stone-700 dark:text-stone-300">Cap. {selectedChapter}</div>
               <button onClick={() => navigateChapter(1)} disabled={selectedChapter >= selectedBook.chapters} className="p-3 text-stone-300 hover:text-gold disabled:opacity-10"><Icons.ArrowDown className="w-4 h-4 -rotate-90" /></button>
            </div>
          </div>

          <nav className="sticky top-20 z-[130] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-full border border-stone-200 dark:border-stone-800 shadow-2xl p-2 flex items-center justify-between mx-2 md:mx-0 mb-12">
             <div className="flex items-center gap-3 px-4">
                <div className="p-2 bg-gold/10 rounded-lg"><Icons.Pin className="w-4 h-4 text-gold" /></div>
                <div className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">{selectedBook.name} {selectedChapter}</div>
             </div>
             <div className="flex items-center gap-4 px-4">
                <button onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} className="text-stone-300 hover:text-gold disabled:opacity-10 transition-colors"><Icons.ArrowDown className="w-5 h-5 rotate-180" /></button>
                <div className="px-5 py-1.5 bg-stone-900 dark:bg-gold rounded-full text-gold dark:text-stone-900 shadow-lg">
                  <span className="font-serif font-bold text-xl tabular-nums">§ {activeVerse}</span>
                </div>
                <button onClick={() => scrollToVerse(activeVerse + 1)} disabled={!verses || activeVerse >= verses.length} className="text-stone-300 hover:text-gold disabled:opacity-10 transition-colors"><Icons.ArrowDown className="w-5 h-5" /></button>
             </div>
          </nav>

          <div className="max-w-4xl mx-auto px-2">
             {loading || !verses ? (
               <div className="py-40 text-center animate-pulse space-y-4 bg-white dark:bg-stone-950 rounded-[4rem] border border-dashed border-gold/30">
                  <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-serif italic text-stone-400">Consultando o Verbo Eterno...</p>
               </div>
             ) : (
               <div className="space-y-2">
                  {verses.map(v => (
                    <VerseItem 
                      key={`${selectedBook.name}-${selectedChapter}-${v.verse}`} 
                      v={v} 
                      isActive={activeVerse === v.verse} 
                      onSelect={scrollToVerse} 
                      bookName={selectedBook.name} 
                      chapter={selectedChapter}
                      fontSize={fontSize}
                    />
                  ))}
               </div>
             )}
          </div>
        </div>
      )}

      {/* ACESSIBILIDADE FIXA */}
      <div className="fixed bottom-24 left-4 md:left-8 z-[300] flex flex-col gap-2">
          <button onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-xl font-black">A+</span></button>
          <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-lg font-black">A-</span></button>
      </div>
    </div>
  );
};

export default Bible;
