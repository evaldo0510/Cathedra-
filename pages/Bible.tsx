
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getVerseCommentary, getCatenaAureaCommentary } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();
const GOSPELS = ["Mateus", "Marcos", "Lucas", "João"];

const PILGRIM_THEMES = [
  { label: 'Vocação', icon: Icons.Cross },
  { label: 'Esperança', icon: Icons.Feather },
  { label: 'Sofrimento', icon: Icons.History },
  { label: 'Aliança', icon: Icons.Users },
  { label: 'Justiça', icon: Icons.Globe },
  { label: 'Eucaristia', icon: Icons.Cross }
];

const COMMENTARY_CACHE = new Map<string, { text: string; fathers?: string[] }>();

const Bible: React.FC<{ onDeepDive?: (topic: string) => void }> = ({ onDeepDive }) => {
  const [query, setQuery] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(true);
  const [viewMode, setViewMode] = useState<'canon' | 'favorites'>('canon');
  const [favoriteVerses, setFavoriteVerses] = useState<Verse[]>([]);
  
  const [selectedVerseForCommentary, setSelectedVerseForCommentary] = useState<Verse | null>(null);
  const [commentaryType, setCommentaryType] = useState<'pilgrim' | 'catena'>('pilgrim');
  const [commentaryData, setCommentaryData] = useState<{ text: string, fathers?: string[] }>({ text: "" });
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [lastRead, setLastRead] = useState<{ book: string; chapter: number } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadFavorites = useCallback(() => {
    const bookmarks = JSON.parse(localStorage.getItem('cathedra_bookmarks') || '[]');
    const highlights = JSON.parse(localStorage.getItem('cathedra_highlights') || '[]');
    const savedContent = JSON.parse(localStorage.getItem('cathedra_saved_content') || '{}');
    
    const allIds = Array.from(new Set([...bookmarks, ...highlights]));
    const favs = allIds
      .map(id => savedContent[id])
      .filter(item => item && item.book && item.text); 
      
    setFavoriteVerses(favs);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_last_read');
    if (saved) {
      const parsed = JSON.parse(saved);
      setLastRead(parsed);
      // Opcional: Auto-carregar último lido se desejar
    }
    loadFavorites();

    const handleSync = () => loadFavorites();
    window.addEventListener('cathedra-content-sync', handleSync);
    return () => window.removeEventListener('cathedra-content-sync', handleSync);
  }, [loadFavorites]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsReading(null);
  };

  const toggleSpeech = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    if (isReading === vid) {
      stopAudio();
      return;
    }
    stopAudio();
    setIsReading(vid);
    try {
      const textToRead = `${verse.book}, ${verse.chapter}, ${verse.verse}. ${verse.text}`;
      const base64Audio = await generateSpeech(textToRead);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReading(null);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      stopAudio();
    }
  };

  const loadChapter = async (book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setViewMode('canon');
    setLoading(true);
    setVerses([]);
    stopAudio();

    const progress = { book, chapter };
    localStorage.setItem('cathedra_last_read', JSON.stringify(progress));
    setLastRead(progress);

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

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter) {
        loadChapter(selectedBook, selectedChapter + 1);
    }
  };

  const handlePrevChapter = () => {
    if (selectedBook && selectedChapter && selectedChapter > 1) {
        loadChapter(selectedBook, selectedChapter - 1);
    }
  };

  const handleGlobalSearch = async (qOverride?: string) => {
    const term = qOverride || query;
    if (!term.trim()) return;
    setLoading(true);
    setShowBookSelector(false);
    setViewMode('canon');
    try {
      const result = await searchVerse(term);
      if (result && result.text) {
        setVerses([result]);
        setSelectedBook(result.book);
        setSelectedChapter(result.chapter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCommentary = useCallback(async (verse: Verse, type: 'pilgrim' | 'catena') => {
    const cacheKey = `${verse.book}_${verse.chapter}_${verse.verse}_${type}`;
    setSelectedVerseForCommentary(verse);
    setCommentaryType(type);
    
    if (COMMENTARY_CACHE.has(cacheKey)) {
        setCommentaryData(COMMENTARY_CACHE.get(cacheKey)!);
        setLoadingCommentary(false);
        return;
    }

    setLoadingCommentary(true);
    setCommentaryData({ text: "" });
    
    try {
      let data;
      if (type === 'pilgrim') {
        const text = await getVerseCommentary(verse);
        data = { text };
      } else {
        const res = await getCatenaAureaCommentary(verse);
        data = { text: res.content, fathers: res.fathers };
      }
      
      COMMENTARY_CACHE.set(cacheKey, data);
      setCommentaryData(data);
    } catch (err) {
      setCommentaryData({ text: "Erro ao carregar comentários da Tradição. Tente novamente." });
    } finally {
      setLoadingCommentary(false);
    }
  }, []);

  const filteredCanon = useMemo(() => {
    if (!bookSearch.trim()) return CANON[activeTestament];
    
    const term = bookSearch.toLowerCase();
    const result: Record<string, string[]> = {};
    
    Object.entries(CANON[activeTestament]).forEach(([category, books]) => {
      const filtered = (books as string[]).filter(b => b.toLowerCase().includes(term));
      if (filtered.length > 0) result[category] = filtered;
    });
    
    return result;
  }, [activeTestament, bookSearch]);

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4 md:px-0 page-enter overflow-x-hidden">
      
      {/* Commentary Modal */}
      {selectedVerseForCommentary && (
        <div 
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 md:p-6 modal-backdrop animate-fast-in"
            onClick={() => setSelectedVerseForCommentary(null)}
        >
          <div 
            className={`bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-3xl rounded-[2.5rem] p-6 md:p-14 shadow-3xl border-t-[8px] md:border-t-[12px] relative overflow-hidden flex flex-col max-h-[85vh] modal-content animate-modal-zoom ${commentaryType === 'catena' ? 'border-gold' : 'border-[#d4af37]'}`} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedVerseForCommentary(null)}
              className="absolute top-4 md:top-8 right-4 md:right-8 p-2 md:p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-[#8b0000] hover:text-white transition-all z-10 active:scale-90"
            >
              <Icons.Cross className="w-5 h-5 md:w-6 md:h-6 rotate-45" />
            </button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 md:space-y-8 pr-2 md:pr-4 mt-8 md:mt-0">
              <header className="space-y-2 md:space-y-4">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[#d4af37]">
                  {commentaryType === 'catena' ? 'Catena Aurea (Compilação Patrística)' : 'Luz do Peregrino'}
                </span>
                <h3 className="text-2xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {selectedVerseForCommentary.book} {selectedVerseForCommentary.chapter}:{selectedVerseForCommentary.verse}
                </h3>
                <p className="text-lg md:text-xl italic font-serif text-stone-500 dark:text-stone-400">"{selectedVerseForCommentary.text}"</p>
                {commentaryType === 'catena' && commentaryData.fathers && (
                   <div className="flex flex-wrap gap-2">
                      {commentaryData.fathers.map(f => <span key={f} className="text-[8px] font-black uppercase tracking-widest bg-gold/10 text-[#8b0000] px-3 py-1 rounded-full">{f}</span>)}
                   </div>
                )}
              </header>

              <div className="prose dark:prose-invert max-w-none">
                {loadingCommentary ? (
                  <div className="space-y-4 md:space-y-6 py-6 md:py-10">
                    <div className="h-4 md:h-6 w-full bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
                    <div className="h-4 md:h-6 w-5/6 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="text-base md:text-xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap animate-in fade-in duration-300">
                    {commentaryData.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Search Section */}
      <header className="mb-8 md:mb-12 text-center space-y-6 md:space-y-10">
        <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Scriptura</h2>
        
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="relative group px-2">
            <Icons.Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-[#d4af37]" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
              placeholder="Fale com a Bíblia do Peregrino (ex: preciso de paz)..."
              className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-5 md:py-8 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] md:rounded-[3rem] outline-none font-serif italic text-lg md:text-3xl shadow-xl transition-all focus:border-[#d4af37]"
            />
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 px-4">
             {PILGRIM_THEMES.map(theme => (
               <button 
                 key={theme.label}
                 onClick={() => { setQuery(theme.label); handleGlobalSearch(theme.label); }}
                 className="flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-stone-800 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold hover:bg-gold/5 transition-all"
               >
                 <theme.icon className="w-3 h-3" />
                 {theme.label}
               </button>
             ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 px-4">
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-full shadow-inner border border-stone-200 dark:border-stone-700">
            <button 
              onClick={() => setViewMode('canon')}
              className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'canon' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-[#d4af37] shadow-md' : 'text-stone-400'}`}
            >
              Cânon Sagrado
            </button>
            <button 
              onClick={() => setViewMode('favorites')}
              className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'favorites' ? 'bg-white dark:bg-stone-900 text-[#8b0000] dark:text-[#d4af37] shadow-md' : 'text-stone-400'}`}
            >
              <Icons.History className={`w-3.5 h-3.5 ${viewMode === 'favorites' ? 'fill-current' : ''}`} />
              Meus Versículos
            </button>
          </div>

          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2 justify-start md:justify-center">
               {BIBLE_VERSIONS.map(v => (
                 <button 
                   key={v.id}
                   onClick={() => setSelectedVersion(v)}
                   className={`flex-shrink-0 px-5 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedVersion.id === v.id ? 'bg-[#d4af37] text-stone-900 border-[#d4af37] shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800'}`}
                 >
                   {v.name}
                 </button>
               ))}
          </div>
        </div>
      </header>

      {viewMode === 'canon' ? (
        <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
          {/* Aside: Book Selection */}
          <aside className={`lg:col-span-4 space-y-6 md:space-y-8 ${!showBookSelector && 'hidden lg:block'}`}>
             <div className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-stone-100 dark:border-stone-800 flex flex-col h-fit lg:max-h-[85vh]">
                
                {/* Book Filter Search */}
                <div className="relative mb-6">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                    <input 
                        type="text"
                        placeholder="Buscar livro..."
                        value={bookSearch}
                        onChange={e => setBookSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none font-serif italic text-sm transition-all focus:border-gold/50 dark:text-white"
                    />
                </div>

                {showBookSelector && lastRead && !bookSearch && (
                  <div className="mb-6">
                     <button 
                      onClick={() => loadChapter(lastRead.book, lastRead.chapter)}
                      className="w-full flex items-center justify-between p-4 bg-[#fcf8e8] dark:bg-stone-800/50 border border-[#d4af37]/30 rounded-2xl shadow-sm group active:scale-95 transition-all"
                     >
                        <div className="flex items-center gap-3">
                          <Icons.History className="w-4 h-4 text-[#d4af37]" />
                          <div className="text-left">
                            <p className="text-[8px] font-black uppercase text-stone-400">Continuar lendo</p>
                            <p className="text-sm font-serif font-bold text-stone-900 dark:text-white">{lastRead.book} {lastRead.chapter}</p>
                          </div>
                        </div>
                        <Icons.ArrowDown className="w-4 h-4 -rotate-90 text-[#d4af37]" />
                     </button>
                  </div>
                )}

                <div className="flex border-2 border-stone-50 dark:border-stone-800 mb-6 p-1 bg-stone-50 dark:bg-stone-800 rounded-full">
                  {['Antigo', 'Novo'].map((testament, idx) => {
                    const label = testament === 'Antigo' ? 'Antigo Testamento' : 'Novo Testamento';
                    return (
                      <button 
                        key={testament}
                        onClick={() => { setActiveTestament(label as any); setBookSearch(''); }} 
                        className={`flex-1 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTestament === label ? 'bg-white dark:bg-stone-700 text-[#d4af37] shadow-sm' : 'text-stone-300'}`}
                      >
                        {testament}
                      </button>
                    );
                  })}
                </div>
                
                <div className="overflow-y-auto custom-scrollbar space-y-8 pr-2 flex-1">
                  {Object.entries(filteredCanon).map(([category, books]) => (
                    <div key={category} className="space-y-3">
                      <h5 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37] border-b-2 border-stone-50 dark:border-stone-800 pb-2">
                        {category}
                      </h5>
                      <div className="flex flex-col gap-1">
                        {(books as string[]).map(book => (
                          <button 
                            key={book} 
                            onClick={() => { setSelectedBook(book); setSelectedChapter(null); }}
                            className={`text-left px-4 py-3 rounded-xl transition-all font-serif italic text-lg md:text-xl ${selectedBook === book ? 'bg-[#fcf8e8] dark:bg-stone-800 text-stone-900 dark:text-[#d4af37] font-bold' : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                          >
                            {book}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(filteredCanon).length === 0 && (
                      <div className="text-center py-10 opacity-30">
                          <Icons.Search className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs font-serif italic">Nenhum livro encontrado</p>
                      </div>
                  )}
                </div>
             </div>
          </aside>

          {/* Main Content: Chapter Selection & Verses */}
          <main className={`lg:col-span-8 space-y-6 md:space-y-10 ${showBookSelector && 'hidden lg:block'}`}>
            {selectedBook && (
              <div className="bg-white dark:bg-stone-900 p-6 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setShowBookSelector(true)} className="lg:hidden p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <Icons.History className="w-5 h-5 text-[#d4af37] rotate-90" />
                    </button>
                    <div className="text-center md:text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]/50">{activeTestament}</span>
                        <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">{selectedBook}</h3>
                    </div>
                    <div className="w-10 h-10 lg:hidden" />
                 </div>
                 
                 <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
                    {[...Array(selectedBook === 'Salmos' ? 150 : 50)].map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => loadChapter(selectedBook, i + 1)}
                        className={`h-10 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-xl transition-all active:scale-90 ${selectedChapter === i + 1 ? 'bg-[#d4af37] text-stone-900 shadow-md scale-105' : 'bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-gold hover:bg-gold/5'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <div className="space-y-6">
              {loading ? (
                 <div className="space-y-6 animate-pulse">
                   {[1, 2, 3].map(n => <div key={n} className="h-32 md:h-48 bg-white dark:bg-stone-900 rounded-[2rem]" />)}
                 </div>
              ) : verses.map((v, i) => {
                const vid = `${v.book}_${v.chapter}_${v.verse}`;
                return (
                  <article key={i} className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border-l-[8px] md:border-l-[12px] bg-white dark:bg-stone-900 shadow-xl transition-all relative group ${isReading === vid ? 'border-[#d4af37] bg-[#fcf8e8] dark:bg-stone-800' : 'border-stone-100 dark:border-stone-800'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#d4af37]">{v.book} {v.chapter}:{v.verse}</span>
                      <div className="flex gap-2">
                        {GOSPELS.includes(v.book) && (
                          <button 
                            onClick={() => openCommentary(v, 'catena')} 
                            className="p-2 md:p-3 bg-gold/20 text-[#8b0000] dark:text-gold hover:bg-gold hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                            title="Catena Aurea"
                          >
                             <Icons.Book className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        )}
                        <button onClick={() => openCommentary(v, 'pilgrim')} className="p-2 md:p-3 bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-gold rounded-xl active:scale-90" title="Comentário do Peregrino"><Icons.Feather className="w-4 h-4 md:w-5 md:h-5" /></button>
                        <button onClick={() => toggleSpeech(v)} className={`p-2 md:p-3 rounded-xl transition-all active:scale-90 ${isReading === vid ? 'bg-[#d4af37] text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-300'}`} title="Ouvir Versículo"><Icons.Audio className="w-4 h-4 md:w-5 md:h-5" /></button>
                        <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} />
                      </div>
                    </div>
                    <p className={`text-xl md:text-4xl font-serif italic leading-snug ${selectedVersion.isPilgrim ? 'text-stone-900 dark:text-gold' : 'text-stone-800 dark:text-stone-200'}`}>
                       "{v.text}"
                    </p>
                  </article>
                );
              })}

              {/* Navigation Between Chapters */}
              {selectedChapter && verses.length > 0 && !loading && (
                  <nav className="flex items-center justify-between pt-12 pb-20">
                      <button 
                        onClick={handlePrevChapter}
                        disabled={selectedChapter === 1}
                        className={`flex items-center gap-4 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${selectedChapter === 1 ? 'opacity-20 cursor-not-allowed' : 'bg-white dark:bg-stone-900 text-[#d4af37] hover:bg-[#8b0000] hover:text-white'}`}
                      >
                          <Icons.ArrowDown className="w-4 h-4 rotate-90" />
                          Anterior
                      </button>
                      <div className="text-center hidden md:block">
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Capítulo {selectedChapter}</p>
                      </div>
                      <button 
                        onClick={handleNextChapter}
                        className="flex items-center gap-4 px-8 py-4 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] transition-all shadow-xl hover:bg-[#8b0000] hover:text-white"
                      >
                          Próximo
                          <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
                      </button>
                  </nav>
              )}
            </div>
          </main>
        </div>
      ) : (
        /* Favorites Mode */
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
           {favoriteVerses.length === 0 ? (
             <div className="text-center py-40 bg-white/30 dark:bg-stone-900/30 rounded-[4rem] border-2 border-dashed border-stone-200 dark:border-stone-800">
                <Icons.History className="w-24 h-24 mx-auto mb-8 text-stone-200 dark:text-stone-800 opacity-30" />
                <h3 className="text-3xl font-serif italic text-stone-400 dark:text-stone-600">Sua coleção sagrada está vazia.</h3>
                <p className="text-stone-400 font-serif text-lg mt-4 px-8 max-w-md mx-auto">Use o ícone de marcador ou pena nos versículos para salvá-los aqui para estudo posterior.</p>
             </div>
           ) : (
             <div className="grid gap-8">
               <div className="flex items-center justify-between px-6">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#d4af37]">Versículos Guardados ({favoriteVerses.length})</h3>
                  <p className="text-[10px] italic font-serif text-stone-400">Sincronizado com sua biblioteca digital</p>
               </div>
               
               {favoriteVerses.map((v, i) => {
                 const vid = `${v.book}_${v.chapter}_${v.verse}`;
                 return (
                   <article key={i} className={`p-8 md:p-12 rounded-[3.5rem] border-l-[12px] bg-white dark:bg-stone-900 shadow-xl transition-all relative group border-[#8b0000]/10 hover:border-[#8b0000] animate-in slide-in-from-bottom-4 duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">{v.book} {v.chapter}:{v.verse}</span>
                        <div className="flex gap-2">
                           <button onClick={() => toggleSpeech(v)} className={`p-3 rounded-xl transition-all ${isReading === vid ? 'bg-[#d4af37] text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-300'}`}><Icons.Audio className="w-4 h-4" /></button>
                           <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} />
                        </div>
                      </div>
                      <p className="text-xl md:text-3xl font-serif italic leading-snug text-stone-800 dark:text-stone-100">"{v.text}"</p>
                      
                      <div className="mt-8 pt-6 border-t border-stone-50 dark:border-stone-800 flex justify-between items-center">
                         <button 
                           onClick={() => loadChapter(v.book, v.chapter)}
                           className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-gold transition-colors flex items-center gap-2"
                         >
                           <Icons.ArrowDown className="w-3 h-3 rotate-90" />
                           Ler Capítulo Completo
                         </button>
                         <button 
                           onClick={() => openCommentary(v, 'pilgrim')}
                           className="text-[9px] font-black uppercase tracking-widest text-[#d4af37] hover:text-[#8b0000] transition-colors"
                         >
                           Consultar Investigação IA
                         </button>
                      </div>
                   </article>
                 );
               })}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Bible;
