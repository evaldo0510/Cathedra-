
import React, { useState, useEffect, useCallback, useContext, useRef, memo } from 'react';
import { Icons } from '../constants';
import { getCatholicCanon, getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchExternalBibleText } from '../services/bibleApi';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { offlineStorage } from '../services/offlineStorage';

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
    className={`group relative py-4 px-5 md:px-10 rounded-[1.5rem] md:rounded-[3rem] transition-all duration-500 cursor-pointer border-l-4 md:border-l-[10px] mb-2 ${
      isActive 
        ? 'bg-gold/15 border-gold shadow-xl scale-[1.01] z-10' 
        : 'border-transparent hover:bg-stone-50'
    }`}
  >
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1">
        <sup className={`text-[0.7em] font-black mr-3 select-none transition-all ${isActive ? 'text-sacred' : 'text-stone-300'}`}>
          {v.verse}
        </sup>
        <span className={`font-serif tracking-tight leading-relaxed text-justify inline-block ${isActive ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
          {v.text}
        </span>
      </div>
      {isActive && (
        <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-2">
           <ActionButtons 
            itemId={`v_${bookName}_${chapter}_${v.verse}`} 
            type="verse" 
            title={`${bookName} ${chapter}:${v.verse}`} 
            content={v.text} 
            className="scale-90"
           />
        </div>
      )}
    </div>
  </div>
));

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [fontSize, setFontSize] = useState(1.15);
  const [showSidebar, setShowSidebar] = useState(false);

  const scrollToVerse = (vNum: number) => {
    if (vNum < 1 || vNum > verses.length) return;
    setActiveVerse(vNum);
    const el = document.getElementById(`v-${vNum}`);
    if (el) {
      const offset = window.innerWidth < 768 ? 120 : 180;
      const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    setVerses([]); 
    setLoading(true);
    try {
      let data = await offlineStorage.getBibleVerses(bookName, chapter);
      if (!data) {
        data = await fetchExternalBibleText(bookName, chapter, 'almeida') || getBibleVersesLocal(bookName, chapter);
        if (data.length > 0) await offlineStorage.saveBibleVerses(bookName, chapter, data);
      }
      setVerses(data);
      setActiveVerse(1);
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (e) { console.error(e); } finally { setLoading(true); setTimeout(()=>setLoading(false), 100); }
  }, []);

  const navigateChapter = (dir: number) => {
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      loadContent(selectedBook.name, next);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fdfcf8] dark:bg-[#0c0a09] relative">
      <div className="flex-1 max-w-[100vw] px-2 md:px-12">
        {viewMode === 'library' && (
          <div className="space-y-12 animate-in fade-in duration-700 pt-6 pb-32">
            <header className="text-center space-y-6">
              <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
              <p className="text-stone-400 italic text-xl">A Palavra Viva e Eficaz</p>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
               {CATHOLIC_BIBLE_BOOKS.map((b, i) => (
                 <button key={i} onClick={() => { setSelectedBook(b); setViewMode('chapters'); }} className="p-6 md:p-8 bg-white dark:bg-stone-900 border border-stone-100 rounded-[2rem] shadow-lg text-left hover:border-gold transition-all">
                    <span className="text-[7px] font-black uppercase text-stone-300 block mb-1">{b.category}</span>
                    <h4 className="text-xl font-serif font-bold leading-tight">{b.name}</h4>
                    <p className="text-[9px] text-stone-400 mt-2">{b.chapters} Capítulos</p>
                 </button>
               ))}
            </div>
          </div>
        )}

        {viewMode === 'chapters' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 pt-6 pb-32">
             <button onClick={() => setViewMode('library')} className="flex items-center gap-2 text-gold text-[9px] font-black uppercase tracking-widest px-4"><Icons.ArrowDown className="w-4 h-4 rotate-90" /> Biblioteca</button>
             <header className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">{selectedBook.category}</span>
                <h2 className="text-5xl md:text-8xl font-serif font-bold">{selectedBook.name}</h2>
             </header>
             <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-5xl mx-auto px-4">
                {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                  <button key={i} onClick={() => { setSelectedChapter(i + 1); setViewMode('reading'); loadContent(selectedBook.name, i + 1); }} className={`aspect-square rounded-2xl flex items-center justify-center font-serif text-2xl font-bold transition-all shadow-md ${selectedChapter === (i+1) ? 'bg-gold text-stone-900' : 'bg-white dark:bg-stone-900 border border-stone-100'}`}>{i + 1}</button>
                ))}
             </div>
          </div>
        )}

        {viewMode === 'reading' && (
          <div className="min-h-screen pt-4 pb-40">
            <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-full border border-stone-200 shadow-2xl p-2 flex items-center justify-between mx-2 md:mx-0 mb-8">
               <div className="flex items-center gap-1">
                  <button onClick={() => setViewMode('library')} className="p-3 bg-stone-900 text-gold rounded-full"><Icons.Home className="w-4 h-4" /></button>
                  <div className="px-4 font-serif font-bold text-lg">{selectedBook.name} {selectedChapter}</div>
               </div>
               <div className="flex items-center gap-4 px-4">
                  <button onClick={() => scrollToVerse(activeVerse - 1)} disabled={activeVerse <= 1} className="text-stone-300 disabled:opacity-10"><Icons.ArrowDown className="w-5 h-5 rotate-180" /></button>
                  <span className="text-gold font-serif font-bold text-xl tabular-nums">§ {activeVerse}</span>
                  <button onClick={() => scrollToVerse(activeVerse + 1)} disabled={activeVerse >= verses.length} className="text-stone-300 disabled:opacity-10"><Icons.ArrowDown className="w-5 h-5" /></button>
               </div>
            </nav>

            <article className="max-w-4xl mx-auto bg-white dark:bg-stone-950 p-6 md:p-16 rounded-[3rem] shadow-inner" style={{ fontSize: `${fontSize}rem` }}>
               {loading ? (
                 <div className="py-40 text-center animate-pulse space-y-4">
                    <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-serif italic text-stone-400">Consultando o Verbo...</p>
                 </div>
               ) : (
                 <div className="space-y-1">
                    {verses.map(v => (
                      <VerseItem key={v.verse} v={v} isActive={activeVerse === v.verse} onSelect={scrollToVerse} bookName={selectedBook.name} chapter={selectedChapter} />
                    ))}
                 </div>
               )}
            </article>

            {/* CONTROLES MOBILE INFERIORES */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex gap-3 md:hidden">
               <button onClick={() => navigateChapter(-1)} className="px-8 py-4 bg-stone-900 text-gold rounded-full font-black uppercase text-[10px] shadow-4xl active:scale-95 border border-gold/30">Anterior</button>
               <button onClick={() => navigateChapter(1)} className="px-8 py-4 bg-gold text-stone-900 rounded-full font-black uppercase text-[10px] shadow-4xl active:scale-95 border border-white">Próximo</button>
            </div>
          </div>
        )}
      </div>
      
      {viewMode === 'reading' && (
        <div className="fixed bottom-24 right-4 md:right-8 z-[300] flex flex-col gap-2">
           <button onClick={() => setFontSize(f => Math.min(f + 0.1, 2.5))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-xl font-black">A+</span></button>
           <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-lg font-black">A-</span></button>
        </div>
      )}
    </div>
  );
};

export default Bible;
