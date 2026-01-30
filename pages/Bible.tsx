
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { fetchBibleChapter, generateBibleAudio } from '../services/gemini';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { offlineStorage } from '../services/offlineStorage';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const Bible: React.FC = () => {
  const [viewMode, setViewMode] = useState<'library' | 'chapters' | 'reading'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(1.15);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioStatus, setAudioStatus] = useState<'idle' | 'buffering' | 'playing'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const filteredBooks = useMemo(() => {
    return CATHOLIC_BIBLE_BOOKS.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const loadContent = useCallback(async (bookName: string, chapter: number) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setVerses([]); 
    setAudioStatus('idle');
    if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
    }
    
    try {
      let data = await offlineStorage.getBibleVerses(bookName, chapter);
      if (!data || data.length === 0) {
        data = await fetchBibleChapter(bookName, chapter);
        if (data && data.length > 0) {
          await offlineStorage.saveBibleVerses(bookName, chapter, data);
        }
      }
      setVerses(data || []);
    } catch (e) {
      console.error("Bible Load Error:", e);
    } finally {
      setLoading(false);
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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
      // Incluímos a reflexão opcional conforme solicitado "adicionando um pequeno trecho"
      const audioData = await generateBibleAudio(fullText, true);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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
    setViewMode('chapters');
  };

  const handleChapterSelect = (ch: number) => {
    if (!selectedBook) return;
    setSelectedChapter(ch);
    setViewMode('reading');
    loadContent(selectedBook.name, ch);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-48 animate-in fade-in duration-700">
      <header className="text-center space-y-6 pt-10 px-4">
        <div className="flex justify-center">
           <div className="p-6 bg-stone-900 rounded-[2.5rem] shadow-sacred border-4 border-gold">
              <Icons.Book className="w-12 h-12 text-gold" />
           </div>
        </div>
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">Scriptuarium</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl font-serif">O Cânon Católico em Alta Definição</p>

        {viewMode === 'library' && (
          <div className="max-w-2xl mx-auto relative mt-8">
             <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300" />
             <input 
               type="text" 
               placeholder="Pesquisar livro do Antigo ou Novo Testamento..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-20 pr-8 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-xl outline-none text-xl font-serif italic focus:border-gold transition-all dark:text-white"
             />
          </div>
        )}
      </header>

      {viewMode === 'library' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
           {filteredBooks.map(book => (
             <button key={book.id} onClick={() => handleBookSelect(book)} className="p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-md text-left hover:border-gold transition-all group relative overflow-hidden active:scale-95">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform"><Icons.Book className="w-12 h-12" /></div>
                <span className="text-[8px] font-black uppercase text-stone-300 block mb-1 tracking-widest">{book.category}</span>
                <h4 className="text-xl font-serif font-bold leading-tight dark:text-stone-100">{book.name}</h4>
                <p className="text-[10px] text-stone-400 mt-2 font-black uppercase">{book.chapters} Capítulos</p>
             </button>
           ))}
        </div>
      )}

      {viewMode === 'chapters' && selectedBook && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8">
           <button onClick={() => setViewMode('library')} className="flex items-center gap-3 text-stone-400 hover:text-gold font-black uppercase text-[10px] tracking-widest ml-4">
             <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar à Biblioteca
           </button>
           <div className="text-center space-y-4">
              <h3 className="text-5xl md:text-7xl font-serif font-bold dark:text-white">{selectedBook.name}</h3>
              <p className="text-gold font-serif italic text-2xl uppercase tracking-widest">Capítulo</p>
           </div>
           <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-4 max-w-5xl mx-auto px-4 pb-20">
              {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                <button key={i} onClick={() => handleChapterSelect(i + 1)} className="aspect-square bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] flex items-center justify-center font-serif text-3xl font-bold hover:bg-gold hover:text-stone-900 transition-all shadow-md active:scale-90 dark:text-stone-200">{i + 1}</button>
              ))}
           </div>
        </div>
      )}

      {viewMode === 'reading' && selectedBook && (
        <article className="max-w-4xl mx-auto px-4 md:px-6 space-y-12 animate-in slide-in-from-bottom-10">
           <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-stone-100 dark:border-stone-800 pb-10">
              <div>
                 <button onClick={() => setViewMode('chapters')} className="text-[9px] font-black uppercase text-stone-400 hover:text-gold flex items-center gap-2 mb-2"><Icons.ArrowDown className="w-4 h-4 rotate-90" /> Outro Capítulo</button>
                 <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook.name} {selectedChapter}</h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                 <button 
                  onClick={handleAudioPlay}
                  disabled={loading}
                  className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all ${audioStatus === 'playing' ? 'bg-sacred text-white' : 'bg-stone-900 text-gold hover:bg-sacred hover:text-white'}`}
                 >
                    {audioStatus === 'buffering' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (audioStatus === 'playing' ? <Icons.Stop className="w-5 h-5" /> : <Icons.Audio className="w-5 h-5" />)}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {audioStatus === 'buffering' ? 'Processando Áudio...' : (audioStatus === 'playing' ? 'Parar Narração' : 'Ouvir Capítulo')}
                    </span>
                 </button>
                 <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl">
                    <button onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))} className="p-3 text-stone-500 hover:text-gold transition-colors font-bold">A+</button>
                    <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.9))} className="p-3 text-stone-500 hover:text-gold transition-colors font-bold">A-</button>
                 </div>
              </div>
           </header>

           {loading ? (
             <div className="py-24 text-center space-y-6">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="font-serif italic text-stone-400 text-xl">Sincronizando com o depósito sagrado...</p>
             </div>
           ) : (
             <div className="space-y-10" style={{ fontSize: `${fontSize}rem` }}>
                {verses.map(v => (
                  <div key={`${selectedBook.id}-${selectedChapter}-${v.verse}`} className="flex gap-6 group">
                     <span className="text-gold font-black font-serif text-sm mt-1.5 opacity-40 group-hover:opacity-100 transition-opacity">{v.verse}</span>
                     <div className="space-y-4 flex-1">
                        <p className="font-serif leading-[1.8] text-stone-800 dark:text-stone-200 text-justify">{v.text}</p>
                        <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-3">
                           <button onClick={() => window.dispatchEvent(new CustomEvent('cathedra-open-ai-study', { detail: { topic: `Exegese teológica de ${selectedBook.name} ${selectedChapter}:${v.verse}` } }))} className="text-[9px] font-black uppercase text-sacred border-b border-sacred/20 pb-0.5">Investigar IA</button>
                           <ActionButtons itemId={`bible_${selectedBook.id}_${selectedChapter}_${v.verse}`} type="verse" title={`${selectedBook.name} ${selectedChapter}:${v.verse}`} content={v.text} className="scale-75" />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}

           <footer className="pt-20 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center pb-20">
              <button disabled={selectedChapter <= 1} onClick={() => handleChapterSelect(selectedChapter - 1)} className="flex items-center gap-3 text-[10px] font-black uppercase text-stone-400 hover:text-gold disabled:opacity-20 transition-all">
                <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Anterior
              </button>
              <button disabled={selectedChapter >= selectedBook.chapters} onClick={() => handleChapterSelect(selectedChapter + 1)} className="flex items-center gap-3 text-[10px] font-black uppercase text-stone-900 dark:text-gold hover:scale-105 transition-all disabled:opacity-20">
                Próximo <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
              </button>
           </footer>
        </article>
      )}
    </div>
  );
};

export default Bible;
