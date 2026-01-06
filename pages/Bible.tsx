
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getVerseCommentary, getCatenaAureaCommentary } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
import { Verse, SavedSearchFilter } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { LangContext } from '../App';

const CANON = getCatholicCanon();
const GOSPELS = ["Mateus", "Marcos", "Lucas", "João"];

const ALL_BOOKS = [
  ...Object.values(CANON["Antigo Testamento"]).flatMap(cat => cat),
  ...Object.values(CANON["Novo Testamento"]).flatMap(cat => cat)
];

const Bible: React.FC<{ onDeepDive?: (topic: string) => void }> = ({ onDeepDive }) => {
  const { lang, t } = useContext(LangContext);
  const [query, setQuery] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  
  // Controle de comentários inline
  const [expandedCommentary, setExpandedCommentary] = useState<string | null>(null);
  const [inlineCommentaryData, setInlineCommentaryData] = useState<Record<string, { content: string, fathers: string[], loading: boolean }>>({});

  const [searchBooks, setSearchBooks] = useState<string[]>([]);
  const [searchChapters, setSearchChapters] = useState('');
  const [searchVerses, setSearchVerses] = useState('');
  const [savedFilters, setSavedFilters] = useState<SavedSearchFilter[]>(() => {
    const saved = localStorage.getItem('cathedra_saved_bible_filters');
    return saved ? JSON.parse(saved) : [];
  });

  // Fix for line 405 error: Define bookSelectorResults
  const bookSelectorResults = useMemo(() => {
    const results: any = {
      "Antigo Testamento": {},
      "Novo Testamento": {}
    };

    Object.entries(CANON).forEach(([testament, categories]) => {
      Object.entries(categories).forEach(([category, books]) => {
        const filteredBooks = books.filter(b => 
          b.toLowerCase().includes(bookSearch.toLowerCase())
        );
        if (filteredBooks.length > 0) {
          results[testament][category] = filteredBooks;
        }
      });
    });

    return results;
  }, [bookSearch]);

  const [selectedVerseForCommentary, setSelectedVerseForCommentary] = useState<Verse | null>(null);
  const [commentaryType, setCommentaryType] = useState<'pilgrim' | 'catena'>('pilgrim');
  const [commentaryData, setCommentaryData] = useState<{ text: string, fathers?: string[] }>({ text: "" });
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_last_read');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!selectedBook) loadChapter(parsed.book, parsed.chapter);
    } else {
      if (!selectedBook) loadChapter("Gênesis", 1);
    }
  }, []);

  const loadChapter = async (book: string, chapter: number) => {
    if (chapter < 1) return;
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setShowChapterPicker(false);
    setSearchResults([]);
    setExpandedCommentary(null);
    setLoading(true);
    setVerses([]);
    setBookSearch('');
    
    localStorage.setItem('cathedra_last_read', JSON.stringify({ book, chapter }));

    try {
      const data = await fetchLocalChapter(selectedVersion.id, book, chapter);
      setVerses(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBibleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query && searchBooks.length === 0 && !searchChapters) return;

    setLoading(true);
    setSearchResults([]);
    setIsAdvancedSearchOpen(false);

    try {
      const chaptersList = searchChapters.split(',').map(s => s.trim()).filter(s => s !== "");
      const versesList = searchVerses.split(',').map(s => s.trim()).filter(s => s !== "");

      const results = await searchVerse(
        query, 
        searchBooks.length > 0 ? searchBooks : undefined, 
        chaptersList.length > 0 ? chaptersList : undefined, 
        versesList.length > 0 ? versesList : undefined, 
        lang
      );
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setQuery('');
    setSearchBooks([]);
    setSearchChapters('');
    setSearchVerses('');
  };

  const toggleInlineCommentary = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    
    if (expandedCommentary === vid) {
      setExpandedCommentary(null);
      return;
    }

    setExpandedCommentary(vid);

    // Se já tiver carregado antes, não busca de novo
    if (inlineCommentaryData[vid]) return;

    setInlineCommentaryData(prev => ({ ...prev, [vid]: { content: '', fathers: [], loading: true } }));

    try {
      const res = await getCatenaAureaCommentary(verse, lang);
      setInlineCommentaryData(prev => ({ 
        ...prev, 
        [vid]: { content: res.content, fathers: res.fathers, loading: false } 
      }));
    } catch (e) {
      setInlineCommentaryData(prev => ({ 
        ...prev, 
        [vid]: { content: "Erro ao carregar tradição.", fathers: [], loading: false } 
      }));
    }
  };

  const toggleSpeech = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    if (isReading === vid) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsReading(null);
      return;
    }
    setIsReading(vid);
    try {
      const base64Audio = await generateSpeech(`${verse.book} ${verse.chapter}:${verse.verse}. ${verse.text}`);
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReading(null);
      source.start();
      audioSourceRef.current = source;
    } catch (err) { setIsReading(null); }
  };

  const handleCopyCommentary = (verse: Verse, text: string) => {
    const fullText = `${verse.book} ${verse.chapter}:${verse.verse}\n\nTRADIÇÃO PATRÍSTICA:\n${text}\n\nVia: Cathedra Digital 🏛️`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const VerseItem: React.FC<{ v: Verse, isSearch?: boolean }> = ({ v, isSearch = false }) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    const isExpanded = expandedCommentary === vid;
    const commentary = inlineCommentaryData[vid];

    return (
      <div className="space-y-4">
        <article className={`p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border-l-[8px] md:border-l-[20px] shadow-lg bg-white dark:bg-stone-900 transition-all ${isReading === vid ? 'border-gold bg-gold/5' : isSearch ? 'border-gold/30' : 'border-stone-100 dark:border-stone-800'}`}>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-8">
              <span className="text-[9px] md:text-[12px] font-black uppercase tracking-[0.3em] text-gold">{v.book} {v.chapter}:{v.verse}</span>
              <div className="flex gap-2">
                 {/* Botão de Comentário Patrístico Inline */}
                 <button 
                  onClick={() => toggleInlineCommentary(v)} 
                  title="Sabedoria dos Padres" 
                  className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-sacred text-white shadow-lg' : 'bg-gold/10 text-sacred hover:bg-gold hover:text-stone-900'}`}
                 >
                   <Icons.Book className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 
                 <button onClick={() => toggleSpeech(v)} title="Audio" className={`p-3 rounded-xl transition-all ${isReading === vid ? 'bg-gold text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-300'}`}><Icons.Audio className="w-4 h-4 md:w-5 md:h-5" /></button>
                 <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} className="bg-stone-50/50 dark:bg-stone-800/50 p-1 md:p-2 rounded-xl" />
              </div>
           </div>
           <p className="text-lg md:text-4xl font-serif italic leading-snug tracking-tight text-stone-800 dark:text-stone-100">
              "{v.text}"
           </p>
           {isSearch && (
             <button 
              onClick={() => loadChapter(v.book, v.chapter)} 
              className="mt-4 text-[8px] font-black uppercase tracking-widest text-gold hover:text-sacred transition-colors flex items-center gap-2"
             >
               Ir para o Capítulo →
             </button>
           )}
        </article>

        {/* SEÇÃO DE COMENTÁRIO PATRÍSTICO EXPANSÍVEL */}
        {isExpanded && (
          <div className="mx-4 md:mx-12 p-8 md:p-12 bg-[#fcf8e8] dark:bg-stone-950 rounded-[2.5rem] md:rounded-[4rem] border border-gold/20 shadow-inner animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
             {/* Decorativo lateral */}
             <div className="absolute top-0 left-0 w-2 h-full bg-gold/30" />
             
             {commentary?.loading ? (
               <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                  <p className="text-[10px] text-stone-400 font-serif italic">Consultando a Tradição...</p>
               </div>
             ) : (
               <div className="space-y-6">
                  <header className="flex justify-between items-start">
                     <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Tesouro Patrístico</span>
                        <div className="flex flex-wrap gap-2">
                           {commentary?.fathers.map(f => (
                             <span key={f} className="px-3 py-1 bg-white/50 dark:bg-stone-800 text-stone-500 dark:text-gold rounded-full text-[8px] font-black uppercase tracking-widest border border-gold/10">
                               {f}
                             </span>
                           ))}
                        </div>
                     </div>
                     <button 
                      onClick={() => handleCopyCommentary(v, commentary.content)} 
                      className={`p-2 rounded-lg transition-all ${isCopied ? 'text-green-600 bg-green-50' : 'text-gold/40 hover:text-gold hover:bg-gold/10'}`}
                     >
                       <Icons.Globe className="w-4 h-4" />
                     </button>
                  </header>

                  <div className="prose dark:prose-invert max-w-none">
                     <p className="text-xl md:text-3xl font-serif italic leading-relaxed text-stone-700 dark:text-stone-300">
                        {commentary?.content}
                     </p>
                  </div>

                  <footer className="pt-6 border-t border-gold/10 flex justify-between items-center">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                        {GOSPELS.includes(v.book) ? 'Ex: Catena Aurea' : 'Ex: Glosa Ordinária'}
                     </p>
                     <button 
                      onClick={() => onDeepDive?.(`Tradição Patrística sobre ${v.book} ${v.chapter}:${v.verse}`)} 
                      className="text-[8px] font-black uppercase tracking-widest text-gold hover:text-sacred transition-colors"
                     >
                        Investigar Profundamente →
                     </button>
                  </footer>
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-6 md:space-y-10 page-enter">
      
      {/* SCRIPTORIUM NAVIGATOR */}
      <nav className="sticky top-0 z-[140] bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl border border-stone-100 dark:border-stone-800 p-3 md:p-6 rounded-[2rem] md:rounded-[3rem] shadow-2xl space-y-4 transition-all">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowBookSelector(true)}
              className="flex items-center gap-2 md:gap-4 bg-[#1a1a1a] text-[#d4af37] px-4 md:px-8 py-3 md:py-4 rounded-2xl shadow-xl hover:bg-[#8b0000] hover:text-white transition-all active:scale-95 group flex-1 md:flex-none"
            >
              <Icons.Book className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-serif font-bold text-base md:text-2xl truncate">{selectedBook || 'Livro'}</span>
              <Icons.ArrowDown className="w-3 h-3 opacity-50" />
            </button>
            
            {selectedBook && (
              <div className="flex items-center bg-[#fcf8e8] dark:bg-stone-800 rounded-2xl border border-gold/20 overflow-hidden">
                <button 
                  onClick={() => selectedChapter && loadChapter(selectedBook, selectedChapter - 1)}
                  disabled={selectedChapter === 1}
                  className="px-3 md:px-4 py-3 md:py-4 hover:bg-gold/10 text-gold disabled:opacity-30 disabled:hover:bg-transparent transition-all border-r border-gold/10"
                  title="Capítulo Anterior"
                >
                   <svg className="w-5 h-5 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                <button 
                  onClick={() => setShowChapterPicker(!showChapterPicker)}
                  className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 hover:bg-gold/10 transition-all"
                  title="Selecionar Capítulo"
                >
                  <span className={`font-serif font-bold text-sm md:text-xl ${loading ? 'animate-pulse text-gold' : 'text-stone-800 dark:text-gold'}`}>
                    {selectedChapter}
                  </span>
                  <Icons.ArrowDown className={`w-3 h-3 ${showChapterPicker ? 'rotate-180' : ''} transition-transform text-gold/50`} />
                </button>

                <button 
                  onClick={() => selectedChapter && loadChapter(selectedBook, selectedChapter + 1)}
                  className="px-3 md:px-4 py-3 md:py-4 hover:bg-gold/10 text-gold transition-all border-l border-gold/10"
                  title="Próximo Capítulo"
                >
                   <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleBibleSearch} className="relative flex-1 w-full flex items-center gap-2">
             <div className="relative flex-1">
               <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
               <input 
                 type="text" 
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 placeholder="O que buscas na Palavra?"
                 className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl focus:border-gold outline-none font-serif italic text-sm md:text-lg transition-all dark:text-white"
               />
             </div>
             <button 
                type="button"
                onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                className={`p-3 rounded-2xl border transition-all ${isAdvancedSearchOpen ? 'bg-gold text-stone-900 border-gold' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-100 dark:border-stone-800'}`}
                title="Busca Avançada"
             >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
             </button>
          </form>
        </div>
      </nav>

      {/* SEARCH RESULTS HEADER */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <div className="p-2 bg-gold/10 rounded-lg text-gold"><Icons.Search className="w-3 h-3" /></div>
              <h3 className="text-base md:text-xl font-serif font-bold">{searchResults.length} Resultados</h3>
           </div>
           <button onClick={clearSearch} className="text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-sacred transition-colors">Limpar</button>
        </div>
      )}

      {/* VERSES LIST */}
      <main className="space-y-4 md:space-y-8">
        {loading ? (
          <div className="space-y-4 md:space-y-8 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-40 md:h-64 bg-white dark:bg-stone-900 rounded-[2rem] md:rounded-[4rem]" />)}
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((v, i) => <VerseItem key={i} v={v} isSearch />)
        ) : (
          verses.map((v, i) => <VerseItem key={i} v={v} />)
        )}
      </main>

      {/* ENHANCED BOOK SELECTION OVERLAY */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/98 backdrop-blur-2xl flex flex-col p-4 md:p-12 overflow-hidden animate-in fade-in duration-500">
          <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8 md:mb-12 flex-shrink-0">
            <div>
              <h2 className="text-3xl md:text-6xl font-serif font-bold text-gold tracking-tight">Cânon Sagrado</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500 mt-1">Navegação por Testamentos e Categorias</p>
            </div>
            <button onClick={() => setShowBookSelector(false)} className="p-4 bg-white/5 rounded-full hover:bg-sacred text-white transition-all active:scale-90">
              <Icons.Cross className="w-6 h-6 rotate-45" />
            </button>
          </header>

          <div className="max-w-6xl mx-auto w-full space-y-8 flex flex-col flex-1 overflow-hidden">
            {/* SEARCH BOX */}
            <div className="relative group flex-shrink-0">
               <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/30 group-focus-within:text-gold transition-colors" />
               <input 
                 type="text" 
                 autoFocus
                 value={bookSearch}
                 onChange={e => setBookSearch(e.target.value)}
                 placeholder="Buscar livro (ex: Jó, Lucas, Salmos...)"
                 className="w-full pl-16 pr-8 py-5 md:py-7 bg-white/5 border-2 border-white/10 rounded-[2rem] text-xl md:text-3xl font-serif italic text-white outline-none focus:border-gold transition-all shadow-2xl"
               />
            </div>

            {/* SCROLLABLE BOOK GRID */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-12 pr-4">
               <div className="space-y-12">
                  {Object.entries(bookSelectorResults).map(([testamentName, categories]: [string, any]) => {
                    if (!bookSearch.trim() && testamentName !== activeTestament) return null;
                    if (Object.keys(categories).length === 0) return null;

                    return (
                      <div key={testamentName} className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                         {bookSearch.trim() && (
                            <div className="flex items-center gap-4">
                               <h3 className="text-xl md:text-2xl font-serif font-bold text-gold/60">{testamentName}</h3>
                               <div className="h-px flex-1 bg-white/10" />
                            </div>
                         )}

                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {Object.entries(categories).map(([catName, books]: [string, any]) => (
                               <div key={catName} className="space-y-4">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 border-b border-white/5 pb-2">
                                     {catName}
                                  </h4>
                                  <div className="grid grid-cols-1 gap-1">
                                     {books.map((book: string) => (
                                        <button 
                                          key={book} 
                                          onClick={() => loadChapter(book, 1)} 
                                          className="text-left text-lg md:text-xl font-serif italic text-stone-300 hover:text-gold hover:translate-x-2 transition-all duration-300 py-1.5 px-3 rounded-xl hover:bg-white/5 group flex items-center justify-between"
                                        >
                                          <span>{book}</span>
                                          <Icons.ArrowDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                     ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED CHAPTER PICKER MODAL */}
      {showChapterPicker && selectedBook && (
        <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowChapterPicker(false)}>
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl border border-gold/10 max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-8">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-1">Ir para capítulo</p>
                 <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook}</h3>
               </div>
               <button onClick={() => setShowChapterPicker(false)} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full hover:bg-sacred hover:text-white transition-all">
                 <Icons.Cross className="w-5 h-5 rotate-45" />
               </button>
             </div>
             <div className="grid grid-cols-5 md:grid-cols-6 gap-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
                {[...Array(150)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => loadChapter(selectedBook, i + 1)}
                    className={`h-14 rounded-2xl flex items-center justify-center font-serif text-lg transition-all active:scale-90 border ${selectedChapter === i + 1 ? 'bg-gold text-stone-900 border-gold shadow-lg font-bold' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-transparent hover:border-gold/30 hover:text-gold'}`}
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
