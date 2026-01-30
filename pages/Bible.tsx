
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchBibleChapter, generateBibleAudio } from '../services/gemini';
import { Verse } from '../types';
import { offlineStorage } from '../services/offlineStorage';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import BibleReader from '../components/BibleReader';
import ChapterNavigation from '../components/ChapterNavigation';

interface BibleProps {
  initialBook?: string;
  initialChapter?: number;
}

const Bible: React.FC<BibleProps> = ({ initialBook, initialChapter }) => {
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [audioStatus, setAudioStatus] = useState<'idle' | 'buffering' | 'playing'>('idle');
  const [testamentFilter, setTestamentFilter] = useState<'AT' | 'NT' | 'ALL'>('ALL');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const filteredBooks = useMemo(() => {
    return CATHOLIC_BIBLE_BOOKS.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTestament = testamentFilter === 'ALL' || b.testament === testamentFilter;
      return matchesSearch && matchesTestament;
    });
  }, [searchTerm, testamentFilter]);

  const unloadCurrentChapter = useCallback(() => {
    setVerses([]); 
    if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
        currentSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.suspend();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    unloadCurrentChapter();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    setLoading(true);
    setAudioStatus('idle');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (signal.aborted) return;
      let data = await offlineStorage.getBibleVerses(bookName, chapter);
      if (!data || data.length === 0) {
        if (signal.aborted) return;
        data = await fetchBibleChapter(bookName, chapter);
        if (data && data.length > 0) {
          await offlineStorage.saveBibleVerses(bookName, chapter, data);
        }
      }
      if (!signal.aborted) setVerses(data || []);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error("Bible Load Error:", e);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [unloadCurrentChapter]);

  useEffect(() => {
    if (initialBook) {
      const book = CATHOLIC_BIBLE_BOOKS.find(b => b.name.toLowerCase() === initialBook.toLowerCase());
      if (book) {
        setSelectedBook(book);
        const ch = initialChapter || 1;
        setSelectedChapter(ch);
        setViewMode('reading');
        loadContent(book.name, ch);
      }
    }
    return () => unloadCurrentChapter();
  }, [initialBook, initialChapter, loadContent, unloadCurrentChapter]);

  const handleAudioPlay = async () => {
    if (verses.length === 0 || audioStatus !== 'idle') {
        if (audioStatus === 'playing') {
            currentSourceRef.current?.stop();
            currentSourceRef.current = null;
            setAudioStatus('idle');
        }
        return;
    }
    setAudioStatus('buffering');
    try {
      const fullText = verses.map(v => v.text).join(" ");
      const audioData = await generateBibleAudio(fullText);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      const base64Data = audioData.split(',')[1];
      const buffer = await decodeAudioData(decodeBase64(base64Data), audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setAudioStatus('idle');
        currentSourceRef.current = null;
      };
      source.start();
      currentSourceRef.current = source;
      setAudioStatus('playing');
    } catch (e) {
      console.error("Audio failure:", e);
      setAudioStatus('idle');
    }
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setViewMode('chapters');
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChapterSelect = (ch: number) => {
    if (!selectedBook) return;
    setSelectedChapter(ch);
    setViewMode('reading');
    loadContent(selectedBook.name, ch);
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-700 min-h-screen px-2 sm:px-4">
      
      {viewMode === 'library' && (
        <section className="space-y-8 md:space-y-16 pb-20">
          <header className="text-center space-y-4 md:space-y-8">
            <h2 className="text-4xl md:text-[8rem] font-serif font-bold text-stone-900 dark:text-gold tracking-tighter leading-none pt-4">Scriptuarium</h2>
            
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4 px-2">
               <div className="relative flex-1 group">
                  <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 group-focus-within:text-gold transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar Livro..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 md:py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[2.5rem] outline-none font-serif italic text-lg md:text-2xl shadow-xl focus:border-gold transition-all"
                  />
               </div>
            </div>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-8">
            {filteredBooks.map((book) => (
              <button 
                key={book.id}
                onClick={() => handleBookSelect(book)}
                className="p-4 md:p-10 bg-white dark:bg-stone-900 rounded-[1.5rem] md:rounded-[3.5rem] border border-stone-50 dark:border-stone-800 shadow-xl text-left group hover:border-gold hover:-translate-y-1 transition-all relative overflow-hidden"
              >
                <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest mb-1 md:mb-4 inline-block px-2 py-0.5 rounded-full ${book.testament === 'AT' ? 'bg-sacred/10 text-sacred' : 'bg-gold/10 text-gold'}`}>
                  {book.testament === 'AT' ? 'Antigo' : 'Novo'}
                </span>
                <h3 className="text-lg md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-gold transition-colors truncate">{book.name}</h3>
                <p className="text-[7px] md:text-[10px] text-stone-400 font-black uppercase mt-1 md:mt-3 tracking-widest">{book.chapters} Capítulos</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {viewMode === 'chapters' && selectedBook && (
        <section className="space-y-12 animate-in slide-in-from-right-10 pb-20">
           <button onClick={() => setViewMode('library')} className="group flex items-center gap-3 text-stone-400 hover:text-gold text-[9px] font-black uppercase tracking-[0.2em] pt-4">
             <Icons.ArrowDown className="w-4 h-4 rotate-90" />
             Voltar ao Scriptuarium
           </button>
           
           <header className="text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold/60">{selectedBook.category}</span>
              <h2 className="text-5xl md:text-[10rem] font-serif font-bold tracking-tighter text-stone-900 dark:text-stone-100 leading-none">{selectedBook.name}</h2>
           </header>

           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-4 max-w-5xl mx-auto">
              {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => handleChapterSelect(i + 1)}
                  className="aspect-square bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl md:rounded-3xl flex items-center justify-center font-serif text-xl md:text-3xl font-bold hover:bg-gold hover:text-stone-900 transition-all shadow-lg active:scale-90"
                >
                  {i + 1}
                </button>
              ))}
           </div>
        </section>
      )}

      {viewMode === 'reading' && selectedBook && (
        <section className="space-y-8 animate-in fade-in duration-1000 relative pb-32">
           <div className="flex items-center justify-between pt-4">
              <button onClick={() => setViewMode('chapters')} className="p-3 bg-stone-50 dark:bg-stone-900 rounded-full text-stone-400 hover:text-gold transition-all">
                <Icons.ArrowDown className="w-5 h-5 rotate-90" />
              </button>
              <button 
                onClick={handleAudioPlay}
                disabled={loading}
                className={`p-4 md:p-6 rounded-full shadow-4xl group ${audioStatus === 'playing' ? 'bg-sacred text-white' : 'bg-stone-900 text-gold'} ${loading ? 'opacity-20' : ''}`}
              >
                {audioStatus === 'playing' ? <Icons.Stop className="w-6 h-6 md:w-8 md:h-8" /> : <Icons.Audio className="w-6 h-6 md:w-8 md:h-8" />}
              </button>
           </div>

           {loading ? (
             <div className="py-40 text-center space-y-6">
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xl font-serif italic text-stone-400">Carregando Escrituras...</p>
             </div>
           ) : (
             <div className="contents">
               <BibleReader 
                 book={selectedBook.name} 
                 chapter={selectedChapter} 
                 verses={verses} 
               />
               <ChapterNavigation 
                 prev={selectedChapter > 1 ? selectedChapter - 1 : null}
                 next={selectedChapter < selectedBook.chapters ? selectedChapter + 1 : null}
                 onNavigate={handleChapterSelect}
                 bookName={selectedBook.name}
               />
             </div>
           )}
        </section>
      )}
    </div>
  );
};

export default Bible;
