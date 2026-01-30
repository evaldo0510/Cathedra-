
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
    // MEMORY OPTIMIZATION: Purgar explicitamente o array de versículos anterior
    setVerses([]); 
    
    // Matar processos de áudio pendentes
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
    // 1. Limpa o DOM e a memória antes de começar o novo carregamento
    unloadCurrentChapter();
    
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setAudioStatus('idle');
    
    try {
      // Delay tático para permitir que o Garbage Collector limpe os versículos anteriores
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

      if (!signal.aborted) {
        setVerses(data || []);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error("Bible Load Error:", e);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [unloadCurrentChapter]);

  // Limpeza de saída do componente para garantir economia de memória total
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
    <div className="flex flex-col animate-in fade-in duration-700 min-h-screen">
      
      {/* 1. SELEÇÃO DE LIVROS */}
      {viewMode === 'library' && (
        <section className="space-y-16 pb-20">
          <header className="text-center space-y-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-sacred/10 border border-sacred/20 rounded-full">
              <Icons.Cross className="w-3 h-3 text-sacred" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred">Biblioteca Sagrada</span>
            </div>
            <h2 className="text-6xl md:text-[8rem] font-serif font-bold text-stone-900 dark:text-gold tracking-tighter leading-none">Scriptuarium</h2>
            
            <div className="max-w-2xl mx-auto flex gap-4 pt-8">
               <div className="relative flex-1 group">
                  <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300 w-6 h-6 group-focus-within:text-gold transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar Livro Profético..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-18 pr-8 py-7 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] outline-none font-serif italic text-2xl shadow-2xl focus:border-gold transition-all"
                  />
               </div>
            </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {filteredBooks.map((book) => (
              <button 
                key={book.id}
                onClick={() => handleBookSelect(book)}
                className="p-10 bg-white dark:bg-stone-900 rounded-[3.5rem] border border-stone-50 dark:border-stone-800 shadow-xl text-left group hover:border-gold hover:-translate-y-2 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                  <Icons.Book className="w-32 h-32" />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest mb-4 inline-block px-3 py-1 rounded-full ${book.testament === 'AT' ? 'bg-sacred/10 text-sacred' : 'bg-gold/10 text-gold'}`}>
                  {book.testament === 'AT' ? 'Antigo' : 'Novo'}
                </span>
                <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-gold transition-colors">{book.name}</h3>
                <p className="text-[10px] text-stone-400 font-black uppercase mt-3 tracking-widest">{book.chapters} Capítulos</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 2. SELEÇÃO DE CAPÍTULOS */}
      {viewMode === 'chapters' && selectedBook && (
        <section className="space-y-16 animate-in slide-in-from-right-10 duration-700 pb-20">
           <button onClick={() => setViewMode('library')} className="group flex items-center gap-4 text-stone-400 hover:text-gold transition-colors text-[10px] font-black uppercase tracking-[0.3em]">
             <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-full group-hover:-translate-x-2 transition-transform"><Icons.ArrowDown className="w-4 h-4 rotate-90" /></div>
             Voltar ao Scriptuarium
           </button>
           
           <header className="text-center space-y-6">
              <span className="text-[12px] font-black uppercase tracking-[0.8em] text-gold/60">{selectedBook.category}</span>
              <h2 className="text-7xl md:text-[10rem] font-serif font-bold tracking-tighter text-stone-900 dark:text-stone-100 leading-none">{selectedBook.name}</h2>
              <p className="text-stone-400 font-serif italic text-2xl">Selecione a Estação da Leitura</p>
           </header>

           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 max-w-5xl mx-auto">
              {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => handleChapterSelect(i + 1)}
                  className="aspect-square bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl flex items-center justify-center font-serif text-3xl font-bold hover:bg-stone-900 hover:text-gold dark:hover:bg-gold dark:hover:text-stone-900 transition-all shadow-lg active:scale-90"
                >
                  {i + 1}
                </button>
              ))}
           </div>
        </section>
      )}

      {/* 3. MODO LEITURA (OTIMIZADO) */}
      {viewMode === 'reading' && selectedBook && (
        <section className="space-y-16 animate-in fade-in duration-1000 relative pb-32">
           <div className="flex items-center justify-between">
              <button 
                onClick={() => setViewMode('chapters')} 
                className="group flex items-center gap-4 text-stone-400 hover:text-gold transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
              >
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-full group-hover:-translate-x-2 transition-transform"><Icons.ArrowDown className="w-4 h-4 rotate-90" /></div>
                Capítulos de {selectedBook.name}
              </button>
              
              <button 
                onClick={handleAudioPlay}
                disabled={loading}
                className={`p-6 rounded-full transition-all shadow-4xl group ${audioStatus === 'playing' ? 'bg-sacred text-white scale-110' : 'bg-stone-900 text-gold hover:bg-gold hover:text-stone-900'} ${loading ? 'opacity-20' : ''}`}
              >
                {audioStatus === 'playing' ? <Icons.Stop className="w-8 h-8" /> : <Icons.Audio className="w-8 h-8 group-hover:scale-110 transition-transform" />}
              </button>
           </div>

           {loading ? (
             <div className="py-60 text-center space-y-10">
                <div className="w-24 h-24 border-8 border-gold border-t-transparent rounded-full animate-spin mx-auto shadow-sacred" />
                <p className="text-3xl font-serif italic text-stone-400 animate-pulse tracking-tighter">Invocando a Sabedoria Eterna...</p>
             </div>
           ) : (
             <div className="contents">
               <BibleReader 
                 book={selectedBook.name} 
                 chapter={selectedChapter} 
                 verses={verses} 
               />
               
               <div className="px-4 md:px-0">
                  <ChapterNavigation 
                    prev={selectedChapter > 1 ? selectedChapter - 1 : null}
                    next={selectedChapter < selectedBook.chapters ? selectedChapter + 1 : null}
                    onNavigate={handleChapterSelect}
                    bookName={selectedBook.name}
                  />
               </div>
             </div>
           )}
        </section>
      )}
    </div>
  );
};

export default Bible;
