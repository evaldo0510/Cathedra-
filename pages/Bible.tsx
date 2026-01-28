
import React, { useState, useEffect, useCallback, useContext, memo } from 'react';
import { Icons } from '../constants';
import { getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchExternalBibleText } from '../services/bibleApi';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { offlineStorage } from '../services/offlineStorage';

const VerseItem = memo(({ v, isActive, onSelect, bookName, chapter, fontSize, isImmersive }: { 
  v: Verse, 
  isActive: boolean, 
  onSelect: (n: number) => void,
  bookName: string,
  chapter: number,
  fontSize: number,
  isImmersive?: boolean
}) => {
  const style = { fontSize: `${fontSize}rem` };
  
  if (isImmersive) {
    return (
      <span 
        id={`v-${v.verse}`}
        onClick={() => onSelect(v.verse)}
        className={`inline transition-all duration-300 cursor-pointer px-0.5 rounded ${isActive ? 'bg-gold/20 font-bold ring-2 ring-gold/10' : 'hover:text-gold'}`}
      >
        <sup className="text-[0.6em] font-black mr-1 text-gold/60">{v.verse}</sup>
        {v.text}{' '}
      </span>
    );
  }

  return (
    <article 
      id={`v-${v.verse}`}
      onClick={() => onSelect(v.verse)}
      className={`p-6 md:p-10 rounded-[2.5rem] border-2 transition-all duration-500 group relative overflow-hidden mb-6 cursor-pointer ${
        isActive 
          ? 'bg-gold/15 border-gold shadow-xl scale-[1.01] z-10' 
          : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/30'
      }`}
      style={style}
    >
      <header className="flex justify-between items-center mb-6">
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-gold text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-500'}`}>
          § {v.verse}
        </div>
        {isActive && <ActionButtons itemId={`v_${bookName}_${chapter}_${v.verse}`} type="verse" title={`${bookName} ${chapter}:${v.verse}`} content={v.text} className="scale-90" />}
      </header>
      <p className={`font-serif leading-relaxed text-justify transition-all ${isActive ? 'text-stone-900 dark:text-stone-50' : 'text-stone-800 dark:text-stone-200'}`}>
        {v.text}
      </p>
    </article>
  );
});

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [isImmersive, setIsImmersive] = useState(false);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [fontSize, setFontSize] = useState(1.15);

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    setLoading(true);
    try {
      // 1. Prioridade: Armazenamento Offline (IndexedDB)
      let data = await offlineStorage.getBibleVerses(bookName, chapter);
      
      // 2. Fallback 1: Dados Estáticos embutidos
      if (!data) {
        data = getBibleVersesLocal(bookName, chapter);
        if (data && data.length > 0) {
          await offlineStorage.saveBibleVerses(bookName, chapter, data);
        }
      }

      // 3. Fallback 2: API Externa (Se houver rede)
      if (!data || data.length === 0) {
        if (navigator.onLine) {
          const apiData = await fetchExternalBibleText(bookName, chapter);
          if (apiData) {
            data = apiData;
            await offlineStorage.saveBibleVerses(bookName, chapter, apiData);
          }
        }
      }

      setVerses(data || []);
      setActiveVerse(1);
    } catch (e) {
      console.error(e);
      setVerses([]);
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

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-40 px-2 md:px-4">
      {isImmersive && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#fdfcf8] dark:bg-[#050505] animate-in fade-in duration-500 p-6 md:p-20">
          <div className="max-w-3xl mx-auto">
            <header className="mb-20 text-center space-y-4">
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight dark:text-gold">{selectedBook.name} {selectedChapter}</h1>
              <div className="h-px w-20 bg-gold/30 mx-auto" />
            </header>
            <div className="font-serif leading-[1.8] text-justify indent-8 text-stone-800 dark:text-stone-300" style={{ fontSize: `${fontSize * 1.2}rem` }}>
              {verses?.map(v => (
                <VerseItem key={v.verse} v={v} isActive={activeVerse === v.verse} onSelect={setActiveVerse} bookName={selectedBook.name} chapter={selectedChapter} fontSize={fontSize} isImmersive={true} />
              ))}
            </div>
            <button onClick={() => setIsImmersive(false)} className="fixed bottom-10 right-10 p-5 bg-gold text-stone-900 rounded-full shadow-4xl hover:scale-110 transition-all"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
          </div>
        </div>
      )}

      {viewMode === 'library' && (
        <div className="space-y-12 pt-6">
          <header className="text-center space-y-4">
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Sagradas Escrituras</h2>
            <p className="text-stone-400 italic text-xl font-serif">A Palavra Viva em suas mãos.</p>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
             {CATHOLIC_BIBLE_BOOKS.map((b, i) => (
               <button key={i} onClick={() => { setSelectedBook(b); setViewMode('chapters'); }} className="p-6 md:p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-lg text-left hover:border-gold transition-all group relative overflow-hidden active:scale-95">
                  <span className="text-[8px] font-black uppercase text-stone-300 block mb-1 tracking-widest">{b.category}</span>
                  <h4 className="text-xl font-serif font-bold leading-tight dark:text-stone-100">{b.name}</h4>
                  <p className="text-[10px] text-stone-400 mt-2 font-black uppercase">{b.chapters} Capítulos</p>
               </button>
             ))}
          </div>
        </div>
      )}

      {viewMode === 'chapters' && (
        <div className="space-y-8 pt-6">
           <button onClick={() => setViewMode('library')} className="flex items-center gap-2 text-stone-400 hover:text-gold uppercase font-black text-[10px] tracking-widest"><Icons.ArrowDown className="w-3 h-3 rotate-90" /> Voltar à Biblioteca</button>
           <header className="text-center space-y-4">
              <h2 className="text-5xl md:text-8xl font-serif font-bold dark:text-stone-100">{selectedBook.name}</h2>
              <p className="text-stone-400 font-serif italic text-xl uppercase tracking-widest">Escolha o Capítulo</p>
           </header>
           <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-5xl mx-auto pb-20">
              {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                <button key={i} onClick={() => { setSelectedChapter(i + 1); setViewMode('reading'); loadContent(selectedBook.name, i + 1); }} className="aspect-square rounded-[1.5rem] flex items-center justify-center font-serif text-2xl font-bold transition-all shadow-md bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-gold active:scale-90 dark:text-stone-200">{i + 1}</button>
              ))}
           </div>
        </div>
      )}

      {viewMode === 'reading' && (
        <div className="min-h-screen pt-4 pb-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('chapters')} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl hover:text-gold"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
              <h3 className="text-2xl font-serif font-bold dark:text-stone-100">{selectedBook.name} {selectedChapter}</h3>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setIsImmersive(true)} className="px-6 py-3 bg-stone-900 text-gold rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Modo Imersivo</button>
               <div className="flex bg-white dark:bg-stone-900 p-1 rounded-full border border-stone-100 dark:border-stone-800 shadow-xl">
                  <button onClick={() => navigateChapter(-1)} disabled={selectedChapter <= 1} className="p-3 text-stone-300 hover:text-gold disabled:opacity-10"><Icons.ArrowDown className="w-4 h-4 rotate-90" /></button>
                  <button onClick={() => navigateChapter(1)} disabled={selectedChapter >= selectedBook.chapters} className="p-3 text-stone-300 hover:text-gold disabled:opacity-10"><Icons.ArrowDown className="w-4 h-4 -rotate-90" /></button>
               </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
             {loading ? (
               <div className="py-40 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-serif italic text-stone-400">Consultando Escrituras Offline...</p>
               </div>
             ) : verses && verses.length > 0 ? (
               <div className="space-y-2">
                  {verses.map(v => (
                    <VerseItem key={v.verse} v={v} isActive={activeVerse === v.verse} onSelect={setActiveVerse} bookName={selectedBook.name} chapter={selectedChapter} fontSize={fontSize} />
                  ))}
               </div>
             ) : (
               <div className="py-20 text-center space-y-6 bg-stone-50 dark:bg-stone-950 rounded-[3rem] border-2 border-dashed border-stone-200 dark:border-stone-800">
                  <Icons.Book className="w-12 h-12 mx-auto text-stone-200" />
                  <p className="text-xl font-serif italic text-stone-400 max-w-sm mx-auto">Este capítulo ainda não foi sincronizado. Conecte-se à rede uma vez para baixá-lo permanentemente.</p>
                  <button onClick={() => loadContent(selectedBook.name, selectedChapter)} className="px-8 py-3 bg-gold text-stone-900 rounded-full font-black uppercase text-[9px] tracking-widest">Tentar Novamente</button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bible;
