
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, fetchRealBibleText } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion, getChapterCount } from '../services/bibleLocal';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { LangContext } from '../App';

const CANON = getCatholicCanon();

const Bible: React.FC<{ onDeepDive?: (topic: string) => void }> = ({ onDeepDive }) => {
  const { lang, t } = useContext(LangContext);
  const [query, setQuery] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [expandedCommentary, setExpandedCommentary] = useState<string | null>(null);
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const totalChaptersInCurrentBook = useMemo(() => {
    if (!selectedBook) return 0;
    return getChapterCount(selectedBook);
  }, [selectedBook]);

  const loadChapter = useCallback(async (book: string, chapter: number, version: BibleVersion = selectedVersion) => {
    if (chapter < 1) return;
    setLoading(true);
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setShowChapterPicker(false);
    setExpandedCommentary(null);
    setVerses([]);
    setBookSearch('');
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsReading(null);
    }
    
    localStorage.setItem('cathedra_last_read', JSON.stringify({ book, chapter, versionId: version.id }));

    try {
      const realData = await fetchRealBibleText(book, chapter, lang);
      if (realData && realData.length > 0) {
        setVerses(realData);
      } else {
        const localData = await fetchLocalChapter(version.id, book, chapter);
        setVerses(localData);
      }
    } catch (error) {
      const localData = await fetchLocalChapter(version.id, book, chapter);
      setVerses(localData);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, lang]);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_last_read');
    if (saved) {
      const parsed = JSON.parse(saved);
      const version = BIBLE_VERSIONS.find(v => v.id === parsed.versionId) || BIBLE_VERSIONS[0];
      setSelectedVersion(version);
      loadChapter(parsed.book, parsed.chapter, version);
    } else {
      loadChapter("Mateus", 1, selectedVersion);
    }
  }, [loadChapter, selectedVersion]);

  const toggleSpeech = async (v: Verse) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    if (isReading === vid) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsReading(null);
      return;
    }
    setIsReading(vid);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const base64 = await generateSpeech(v.text);
      if (base64) {
        const buffer = await decodeAudioData(decodeBase64(base64), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsReading(null);
        audioSourceRef.current = source;
        source.start(0);
      }
    } catch (err) { setIsReading(null); }
  };

  const filteredCanon = useMemo(() => {
    const term = bookSearch.toLowerCase().trim();
    if (!term) return CANON;
    
    const results: any = { "Antigo Testamento": {}, "Novo Testamento": {} };
    let hasResults = false;

    Object.entries(CANON).forEach(([testament, categories]) => {
      Object.entries(categories).forEach(([category, books]) => {
        const filtered = books.filter(b => b.toLowerCase().includes(term));
        if (filtered.length > 0) {
          results[testament][category] = filtered;
          hasResults = true;
        }
      });
    });
    return hasResults ? results : null;
  }, [bookSearch]);

  const VerseItem: React.FC<{ v: Verse }> = ({ v }) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    const isThisVerseReading = isReading === vid;
    return (
      <article className={`p-6 md:p-10 rounded-[2.5rem] border shadow-lg bg-white dark:bg-stone-900 transition-all ${isThisVerseReading ? 'border-gold bg-gold/5' : 'border-stone-100 dark:border-stone-800'}`}>
         <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">{v.book} {v.chapter}:{v.verse}</span>
            <div className="flex gap-2">
               <button onClick={() => toggleSpeech(v)} className={`p-3 rounded-xl transition-all ${isThisVerseReading ? 'bg-gold text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}><Icons.Audio className="w-4 h-4" /></button>
               <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} />
            </div>
         </div>
         <p className="text-xl md:text-3xl font-serif italic leading-relaxed text-stone-800 dark:text-stone-100 tracking-tight">"{v.text}"</p>
      </article>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-48 space-y-8 page-enter relative">
      {/* NAVIGATION HEADER */}
      <nav className="sticky top-0 z-[140] bg-[#fdfcf8]/90 dark:bg-[#0c0a09]/90 backdrop-blur-md p-4 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
        <button 
          onClick={() => setShowBookSelector(true)} 
          className="flex items-center justify-between gap-3 bg-[#1a1a1a] dark:bg-gold text-gold dark:text-stone-900 px-8 py-5 rounded-2xl shadow-xl transition-all active:scale-95 w-full md:w-auto min-w-[240px]"
        >
          <div className="flex items-center gap-3">
            <Icons.Book className="w-6 h-6" />
            <span className="font-serif font-bold text-2xl">{selectedBook || 'Selecionar Livro'}</span>
          </div>
          <Icons.ArrowDown className="w-4 h-4 opacity-50" />
        </button>
        
        <button 
          onClick={() => setShowChapterPicker(true)} 
          className="px-8 py-5 bg-[#fcf8e8] dark:bg-stone-900 border border-gold/20 rounded-2xl font-serif font-bold text-2xl min-w-[100px] text-stone-800 dark:text-gold hover:border-gold transition-colors"
        >
          Cap. {selectedChapter}
        </button>

        <div className="flex-1 w-full relative group">
          <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-gold transition-colors" />
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Pesquisar versículos..." 
            className="w-full pl-14 pr-4 py-5 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl outline-none font-serif italic text-xl dark:text-white focus:border-gold/50 transition-all" 
          />
        </div>
      </nav>

      {/* BIBLE CONTENT */}
      <main className="space-y-6">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-48 bg-stone-50 dark:bg-stone-900 rounded-[2.5rem]" />)}
          </div>
        ) : (
          verses.map((v, i) => <VerseItem key={i} v={v} />)
        )}
      </main>

      {/* NEW BOOK SELECTOR MODAL (PROFESSIONAL VERSION) */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-10">
          <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-6xl h-[85vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom relative">
            
            {/* Modal Header */}
            <header className="p-8 md:p-12 border-b dark:border-stone-900 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Cânon Bíblico</h2>
                  <p className="text-stone-400 font-serif italic text-lg mt-1">Selecione a Palavra que deseja meditar</p>
                </div>
                <button 
                  onClick={() => setShowBookSelector(false)} 
                  className="p-4 bg-stone-100 dark:bg-stone-900 rounded-full text-stone-500 hover:bg-sacred hover:text-white transition-all active:scale-90"
                >
                  <Icons.Cross className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative group">
                  <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors" />
                  <input 
                    type="text" 
                    autoFocus
                    value={bookSearch} 
                    onChange={e => setBookSearch(e.target.value)} 
                    placeholder="Busca rápida por nome do livro..." 
                    className="w-full pl-16 pr-6 py-6 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] outline-none font-serif text-xl dark:text-white focus:border-gold transition-all shadow-inner" 
                  />
                </div>
                
                {!bookSearch && (
                  <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                    {['Antigo Testamento', 'Novo Testamento'].map((t: any) => (
                      <button
                        key={t}
                        onClick={() => setActiveTestament(t)}
                        className={`px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTestament === t ? 'bg-gold text-stone-900 shadow-lg scale-[1.02]' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* Modal Body (Books Grid) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 bg-white/30 dark:bg-black/10">
               {filteredCanon ? (
                 <div className="space-y-12">
                   {bookSearch ? (
                     // Search Mode: List all matching books by testament
                     Object.entries(filteredCanon).map(([test, categories]: [string, any]) => {
                       const categoryEntries = Object.entries(categories);
                       const hasMatches = categoryEntries.some(([cat, books]: [string, any]) => books.length > 0);
                       if (!hasMatches) return null;
                       return (
                         <div key={test} className="space-y-6">
                           <h4 className="text-sm font-black uppercase tracking-[0.5em] text-gold border-b border-gold/20 pb-2">{test}</h4>
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                             {categoryEntries.map(([cat, books]: [string, any]) => 
                               books.map((book: string) => (
                                 <button 
                                   key={book} 
                                   onClick={() => loadChapter(book, 1)} 
                                   className="group relative p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-gold transition-all text-left shadow-sm hover:shadow-gold/10"
                                 >
                                   <p className="font-serif font-bold text-xl text-stone-800 dark:text-stone-100 group-hover:text-gold transition-colors">{book}</p>
                                   <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 group-hover:text-gold/50">{cat}</span>
                                 </button>
                               ))
                             )}
                           </div>
                         </div>
                       );
                     })
                   ) : (
                     // Normal Mode: Group by category within active testament
                     Object.entries(filteredCanon[activeTestament] || {}).map(([cat, books]: [string, any]) => (
                       <section key={cat} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                         <div className="flex items-center gap-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-gold whitespace-nowrap">{cat}</h4>
                            <div className="h-px w-full bg-gradient-to-r from-gold/20 to-transparent" />
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                           {books.map((book: string) => (
                             <button 
                               key={book} 
                               onClick={() => loadChapter(book, 1)} 
                               className="p-6 rounded-[2rem] bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-gold hover:-translate-y-1 transition-all text-left shadow-sm hover:shadow-xl group"
                             >
                               <span className="font-serif font-bold text-xl md:text-2xl text-stone-800 dark:text-stone-100 group-hover:text-gold transition-colors block mb-1">
                                 {book}
                               </span>
                               <div className="w-6 h-0.5 bg-stone-100 dark:bg-stone-800 group-hover:w-full group-hover:bg-gold transition-all duration-500" />
                             </button>
                           ))}
                         </div>
                       </section>
                     ))
                   )}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                   <Icons.Cross className="w-24 h-24 mb-6 text-stone-300" />
                   <h3 className="text-3xl font-serif italic">Nenhum livro encontrado para sua busca.</h3>
                 </div>
               )}
            </div>

            {/* Modal Footer Decorative */}
            <div className="h-2 w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>
        </div>
      )}

      {/* CHAPTER PICKER */}
      {showChapterPicker && selectedBook && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowChapterPicker(false)}>
          <div className="bg-[#fdfcf8] dark:bg-stone-950 p-10 md:p-14 rounded-[4rem] shadow-3xl max-w-3xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar animate-modal-zoom border border-white/5" onClick={e => e.stopPropagation()}>
             <header className="mb-10 text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Seleção de Capítulo</span>
                <h3 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook}</h3>
             </header>
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {[...Array(totalChaptersInCurrentBook)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => loadChapter(selectedBook, i + 1)} 
                    className={`aspect-square rounded-2xl flex items-center justify-center font-serif text-2xl transition-all shadow-sm ${selectedChapter === i+1 ? 'bg-gold text-stone-900 ring-4 ring-gold/20 scale-110 z-10' : 'bg-stone-50 dark:bg-stone-900 text-stone-500 hover:border-gold hover:text-gold border border-transparent'}`}
                  >
                    {i + 1}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bible;
