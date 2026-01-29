
import React, { useState, useEffect, useCallback, useContext, memo, useMemo, useRef } from 'react';
import { Icons } from '../constants';
import { getBibleVersesLocal, CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchExternalBibleText } from '../services/bibleApi';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { offlineStorage } from '../services/offlineStorage';

const VerseItem = memo(({ v, isActive, isReading, onSelect, bookName, chapter, fontSize, isImmersive }: { 
  v: Verse, 
  isActive: boolean, 
  isReading: boolean,
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
        className={`inline transition-all duration-300 cursor-pointer px-0.5 rounded ${isReading ? 'bg-gold/40 text-stone-900 font-bold ring-2 ring-gold/20' : isActive ? 'bg-gold/20 font-bold' : 'hover:text-gold'}`}
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
      className={`p-8 md:p-12 rounded-[3rem] border-2 transition-all duration-500 group relative overflow-hidden mb-6 cursor-pointer ${
        isReading 
          ? 'bg-gold/30 border-gold shadow-[0_0_40px_rgba(212,175,55,0.3)] scale-[1.02] z-20'
          : isActive 
            ? 'bg-gold/15 border-gold shadow-xl scale-[1.01] z-10' 
            : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/30'
      }`}
      style={style}
    >
      <header className="flex justify-between items-center mb-6">
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isReading ? 'bg-stone-900 text-gold' : isActive ? 'bg-gold text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-500'}`}>
          § {v.verse} {isReading && "• Lectorium"}
        </div>
        {(isActive || isReading) && <ActionButtons itemId={`v_${bookName}_${chapter}_${v.verse}`} type="verse" title={`${bookName} ${chapter}:${v.verse}`} content={v.text} className="scale-90" />}
      </header>
      <p className={`font-serif leading-relaxed text-justify transition-all ${isReading ? 'text-stone-950 dark:text-white font-bold' : isActive ? 'text-stone-900 dark:text-stone-50' : 'text-stone-800 dark:text-stone-200'}`}>
        {v.text}
      </p>
    </article>
  );
});

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [isImmersive, setIsImmersive] = useState(false);
  const [isBookshelfOpen, setIsBookshelfOpen] = useState(false);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book>(CATHOLIC_BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [fontSize, setFontSize] = useState(1.2);

  // --- Speech Engine State ---
  const [isReading, setIsReading] = useState(false);
  const [readingVerseIndex, setReadingVerseIndex] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(0.95);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices.filter(v => v.lang.startsWith('pt')));
      const defaultVoice = availableVoices.find(v => v.name.includes('Google') && v.lang.startsWith('pt')) || availableVoices.find(v => v.lang.startsWith('pt'));
      if (defaultVoice) setSelectedVoice(defaultVoice.name);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => window.speechSynthesis.cancel();
  }, []);

  const stopReading = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setReadingVerseIndex(null);
  }, []);

  const readVerse = useCallback((index: number) => {
    if (!verses || index >= verses.length) {
      stopReading();
      return;
    }
    window.speechSynthesis.cancel();
    setReadingVerseIndex(index);
    const verse = verses[index];
    const utterance = new SpeechSynthesisUtterance(verse.text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.onend = () => { if (isReading) readVerse(index + 1); };
    utterance.onerror = () => stopReading();
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    document.getElementById(`v-${verse.verse}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [verses, voices, selectedVoice, rate, isReading, stopReading]);

  const toggleReading = () => {
    if (isReading) {
      window.speechSynthesis.pause();
      setIsReading(false);
    } else {
      setIsReading(true);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      else readVerse(activeVerse > 1 ? activeVerse - 1 : 0);
    }
  };

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    stopReading();
    setLoading(true);
    try {
      let data = await offlineStorage.getBibleVerses(bookName, chapter);
      if (!data) {
        data = getBibleVersesLocal(bookName, chapter);
        if (data && data.length > 0) await offlineStorage.saveBibleVerses(bookName, chapter, data);
      }
      setVerses(data || []);
      setActiveVerse(1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [stopReading]);

  const navigateChapter = (dir: number) => {
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      loadContent(selectedBook.name, next);
    }
  };

  return (
    <div id="bible-container" className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-40 px-2 relative">
      {viewMode === 'library' && (
        <div className="space-y-12 pt-6">
          <header className="text-center space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-sacred">Cânon Bíblico Católico</span>
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter leading-none">Scriptuarium</h2>
            <p className="text-stone-400 italic text-xl font-serif">Fonte: Nova Vulgata (Tradução Oficial)</p>
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
           <button onClick={() => setViewMode('library')} className="flex items-center gap-2 text-stone-400 hover:text-gold uppercase font-black text-[10px] tracking-widest"><Icons.ArrowDown className="w-3 h-3 rotate-90" /> Biblioteca</button>
           <header className="text-center space-y-4">
              <h2 className="text-5xl md:text-8xl font-serif font-bold dark:text-stone-100">{selectedBook.name}</h2>
              <p className="text-stone-400 font-serif italic text-xl uppercase tracking-widest">Capítulos do Livro</p>
           </header>
           <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-5xl mx-auto pb-20">
              {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                <button key={i} onClick={() => { setSelectedChapter(i + 1); setViewMode('reading'); loadContent(selectedBook.name, i + 1); }} className="aspect-square rounded-[1.5rem] flex items-center justify-center font-serif text-2xl font-bold transition-all shadow-md bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-gold active:scale-90 dark:text-stone-200">{i + 1}</button>
              ))}
           </div>
        </div>
      )}

      {viewMode === 'reading' && (
        <article className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-700">
           <div className="mb-12 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold mb-2 block">Leitura Orante • Scriptura</span>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook.name} {selectedChapter}</h1>
              </div>
              <div className="flex gap-2">
                 <button onClick={toggleReading} className={`p-4 rounded-2xl shadow-xl transition-all ${isReading ? 'bg-sacred text-white' : 'bg-stone-900 text-gold'}`}>
                    {isReading ? <Icons.Stop className="w-5 h-5" /> : <Icons.Audio className="w-5 h-5" />}
                 </button>
                 <button onClick={() => setViewMode('chapters')} className="p-4 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-gold transition-all">
                    <Icons.Cross className="w-5 h-5 rotate-45" />
                 </button>
              </div>
           </div>

           <div className="space-y-4">
              {loading ? (
                <div className="py-20 text-center animate-pulse">
                   <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                   <p className="font-serif italic text-stone-400">Consultando o Codex...</p>
                </div>
              ) : verses?.map((v, i) => (
                <VerseItem key={v.verse} v={v} isActive={activeVerse === v.verse} isReading={readingVerseIndex === i} onSelect={setActiveVerse} bookName={selectedBook.name} chapter={selectedChapter} fontSize={fontSize} />
              ))}
           </div>

           {/* COMENTÁRIO DOUTRINAL INTEGRADO (ESTILO READER) */}
           <div className="border-l-4 border-gold pl-8 my-20 bg-[#fcf8e8] dark:bg-stone-900/50 p-10 rounded-[3rem] shadow-inner">
              <p className="text-[10px] font-black text-stone-400 dark:text-gold uppercase tracking-widest mb-4 flex items-center gap-3">
                 <Icons.Feather className="w-4 h-4" /> Nexo Doutrinal — Tradição Patrística
              </p>
              <p className="text-stone-700 dark:text-stone-300 font-serif leading-relaxed italic text-xl">
                 "Toda a Escritura é divinamente inspirada e útil para ensinar, para repreender, para corrigir e para instruir na justiça." — 2 Timóteo 3, 16. A leitura deve ser feita no mesmo Espírito em que foi escrita.
              </p>
           </div>

           <div className="flex justify-between items-center py-12 border-t border-stone-100 dark:border-stone-800">
              <button onClick={() => navigateChapter(-1)} disabled={selectedChapter <= 1} className="flex items-center gap-3 text-[10px] font-black uppercase text-stone-400 hover:text-gold disabled:opacity-20">
                 <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Cap. Anterior
              </button>
              <button onClick={() => navigateChapter(1)} disabled={selectedChapter >= selectedBook.chapters} className="flex items-center gap-3 text-[10px] font-black uppercase text-stone-900 dark:text-gold hover:scale-105 transition-all disabled:opacity-20">
                 Próximo Cap. <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
              </button>
           </div>
        </article>
      )}

      <div className="fixed bottom-24 right-4 md:right-8 z-[300] flex flex-col gap-2">
          <button onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-xl font-black">A+</span></button>
          <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-lg font-black">A-</span></button>
       </div>
    </div>
  );
};

export default Bible;
