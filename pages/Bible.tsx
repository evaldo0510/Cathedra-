
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getCatenaAureaCommentary, fetchRealBibleText } from '../services/gemini';
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
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [expandedCommentary, setExpandedCommentary] = useState<string | null>(null);
  const [inlineCommentaryData, setInlineCommentaryData] = useState<Record<string, { content: string, fathers: string[], loading: boolean }>>({});
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const totalChaptersInCurrentBook = useMemo(() => {
    if (!selectedBook) return 0;
    return getChapterCount(selectedBook);
  }, [selectedBook]);

  const loadChapter = useCallback(async (book: string, chapter: number, version: BibleVersion = selectedVersion) => {
    if (chapter < 1) return;
    const maxChapters = getChapterCount(book);
    if (chapter > maxChapters) return;

    setLoading(true);
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setShowChapterPicker(false);
    setSearchResults([]);
    setExpandedCommentary(null);
    setVerses([]);
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsReading(null);
    }
    
    localStorage.setItem('cathedra_last_read', JSON.stringify({ book, chapter, versionId: version.id }));

    try {
      // Prioridade: Busca via IA para garantir texto REAL e INTEGRAL
      // O fetchLocalChapter agora serve apenas como fallback de estrutura se a IA falhar.
      const realData = await fetchRealBibleText(book, chapter, lang);
      
      if (realData && realData.length > 0) {
        setVerses(realData);
      } else {
        // Fallback local se a IA falhar totalmente (placeholders básicos)
        const localData = await fetchLocalChapter(version.id, book, chapter);
        setVerses(localData);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Erro ao carregar capítulo:", error);
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
      if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; }
      setIsReading(null);
      return;
    }
    if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; }
    setIsReading(vid);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const base64 = await generateSpeech(v.text);
      if (base64) {
        const buffer = await decodeAudioData(decodeBase64(base64), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => { setIsReading(null); audioSourceRef.current = null; };
        audioSourceRef.current = source;
        source.start(0);
      } else { setIsReading(null); }
    } catch (err) { setIsReading(null); }
  };

  const handleBibleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const results = await searchVerse(query, undefined, undefined, undefined, lang);
      setSearchResults(results);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toggleInlineCommentary = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    if (expandedCommentary === vid) { setExpandedCommentary(null); return; }
    setExpandedCommentary(vid);
    if (inlineCommentaryData[vid]) return;
    setInlineCommentaryData(prev => ({ ...prev, [vid]: { content: '', fathers: [], loading: true } }));
    try {
      const res = await getCatenaAureaCommentary(verse, lang);
      setInlineCommentaryData(prev => ({ ...prev, [vid]: { content: res.content, fathers: res.fathers, loading: false } }));
    } catch (e) {
      setInlineCommentaryData(prev => ({ ...prev, [vid]: { content: "Comentário indisponível.", fathers: [], loading: false } }));
    }
  };

  const filteredCanon = useMemo(() => {
    const term = bookSearch.toLowerCase();
    if (!term) return CANON;
    const newCanon: any = { "Antigo Testamento": {}, "Novo Testamento": {} };
    Object.entries(CANON).forEach(([testament, categories]) => {
      Object.entries(categories).forEach(([category, books]) => {
        const filtered = books.filter(b => b.toLowerCase().includes(term));
        if (filtered.length > 0) newCanon[testament][category] = filtered;
      });
    });
    return newCanon;
  }, [bookSearch]);

  const VerseItem: React.FC<{ v: Verse; isSearch?: boolean }> = ({ v, isSearch = false }) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    const isExpanded = expandedCommentary === vid;
    const isThisVerseReading = isReading === vid;
    const commentary = inlineCommentaryData[vid];
    return (
      <div className="space-y-4">
        <article className={`p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border-l-[15px] shadow-2xl bg-white dark:bg-stone-900 transition-all duration-700 ${isThisVerseReading ? 'border-gold bg-gold/5 scale-[1.02]' : 'border-stone-100 dark:border-stone-800'}`}>
           <div className="flex justify-between items-center mb-8">
              <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isThisVerseReading ? 'text-gold' : 'text-stone-300'}`}>{v.book} {v.chapter}:{v.verse}</span>
              <div className="flex gap-2">
                 <button onClick={() => toggleInlineCommentary(v)} className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-sacred text-white shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold'}`} title="Comentário Patrístico"><Icons.Book className="w-5 h-5" /></button>
                 <button onClick={() => toggleSpeech(v)} className={`p-4 rounded-2xl transition-all ${isThisVerseReading ? 'bg-gold text-stone-900 shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold'}`} title="Ouvir Versículo"><Icons.Audio className="w-5 h-5" /></button>
                 <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} className="ml-2" />
              </div>
           </div>
           <p className="text-2xl md:text-5xl font-serif italic leading-relaxed text-stone-800 dark:text-stone-100 tracking-tight">"{v.text}"</p>
        </article>
        {isExpanded && (
          <div className="mx-6 md:mx-16 p-10 md:p-16 bg-[#fcf8e8] dark:bg-stone-950 rounded-[3rem] border border-gold/20 shadow-inner animate-in slide-in-from-top-4 duration-700">
             {commentary?.loading ? (
               <div className="flex items-center gap-4">
                 <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">Consultando Tesouro Patrístico...</p>
               </div>
             ) : (
             <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <Icons.Feather className="w-5 h-5 text-gold" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-gold">Cadeia de Ouro</p>
               </div>
               <p className="text-xl md:text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed tracking-tight">"{commentary?.content}"</p>
               <div className="flex flex-wrap gap-2 pt-4">
                 {commentary?.fathers.map(f => <span key={f} className="px-3 py-1 bg-white dark:bg-stone-800 rounded-lg text-[8px] font-black uppercase text-gold/70">{f}</span>)}
               </div>
             </div>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-48 space-y-8 page-enter px-2 md:px-0 relative">
      {/* NAVIGATION HEADER */}
      <nav className="sticky top-4 z-[140] space-y-4">
        <div className="bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border border-stone-100 dark:border-stone-800 p-4 md:p-6 rounded-[3rem] shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setShowBookSelector(true)} className="flex items-center gap-3 bg-[#1a1a1a] text-gold px-8 py-5 rounded-2xl shadow-xl hover:bg-stone-800 transition-all whitespace-nowrap">
                <Icons.Book className="w-5 h-5" />
                <span className="font-serif font-bold text-2xl">{selectedBook || 'Livro'}</span>
              </button>
              <button onClick={() => setShowChapterPicker(true)} className="px-8 py-5 bg-[#fcf8e8] dark:bg-stone-900 border border-gold/20 rounded-2xl font-serif font-bold text-2xl min-w-[80px]">
                {selectedChapter}
              </button>
            </div>

            <div className="flex-1 w-full max-w-2xl">
              <form onSubmit={handleBibleSearch} className="relative group">
                <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  placeholder="Pesquisar Palavra de Deus..." 
                  className="w-full pl-16 pr-6 py-5 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl outline-none font-serif italic text-xl dark:text-white focus:border-gold transition-all" 
                />
              </form>
            </div>
          </div>
        </div>

        {selectedBook && searchResults.length === 0 && (
          <div className="bg-white/60 dark:bg-stone-900/60 backdrop-blur-md border border-white/10 p-2 rounded-[2.5rem] overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2">
             <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-4">
                {[...Array(totalChaptersInCurrentBook)].map((_, i) => {
                  const ch = i + 1;
                  const isActive = selectedChapter === ch;
                  return (
                    <button
                      key={ch}
                      onClick={() => loadChapter(selectedBook, ch)}
                      className={`min-w-[50px] h-12 flex items-center justify-center rounded-xl font-serif text-xl transition-all ${isActive ? 'bg-gold text-stone-900 shadow-lg font-bold scale-110' : 'bg-white dark:bg-stone-800 text-stone-400 hover:bg-stone-100'}`}
                    >
                      {ch}
                    </button>
                  );
                })}
             </div>
          </div>
        )}
      </nav>

      {/* BIBLE CONTENT */}
      <main className="space-y-10">
        {loading ? (
          <div className="space-y-10 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-72 bg-stone-50 dark:bg-stone-900 rounded-[4rem]" />)}
          </div>
        ) : (
          <>
            {searchResults.length > 0 ? (
              <div className="space-y-12">
                 <div className="text-center py-6">
                   <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gold">Resultados da Investigação</span>
                 </div>
                 {searchResults.map((v, i) => <VerseItem key={i} v={v} isSearch />)}
              </div>
            ) : (
              verses.map((v, i) => <VerseItem key={i} v={v} />)
            )}
          </>
        )}
      </main>

      {/* SELECTION MODALS */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-700 overflow-hidden">
          <header className="p-8 md:p-16 flex justify-between items-center">
             <h2 className="text-5xl md:text-8xl font-serif font-bold text-gold tracking-tight">Cânon Sagrado</h2>
             <button onClick={() => setShowBookSelector(false)} className="p-5 bg-white/5 rounded-full text-white hover:bg-sacred transition-all"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
          </header>
          <div className="max-w-7xl mx-auto w-full flex-1 p-6 md:p-16 pt-0 overflow-y-auto custom-scrollbar">
             <input type="text" autoFocus value={bookSearch} onChange={e => setBookSearch(e.target.value)} placeholder="Encontrar Livro..." className="w-full mb-16 pl-10 pr-10 py-10 bg-white/5 border-2 border-white/10 rounded-[3rem] text-3xl md:text-5xl font-serif italic text-white outline-none focus:border-gold transition-all" />
             <div className="grid gap-20 pb-40">
                {Object.entries(filteredCanon).map(([testament, categories]: [string, any]) => (
                  <div key={testament} className="space-y-12">
                     <h3 className="text-3xl font-black uppercase tracking-[0.5em] text-gold border-b border-gold/20 pb-6">{testament}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
                        {Object.entries(categories).map(([catName, books]: [string, any]) => (
                          <div key={catName} className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500">{catName}</h4>
                            <div className="flex flex-col gap-3">
                              {books.map((book: string) => (
                                <button 
                                  key={book} 
                                  onClick={() => loadChapter(book, 1)} 
                                  className="text-left px-8 py-4 rounded-2xl bg-white/5 hover:bg-gold text-stone-300 hover:text-stone-900 font-serif italic text-2xl transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                                >
                                  {book}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {showChapterPicker && selectedBook && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowChapterPicker(false)}>
          <div className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-3xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <h3 className="text-4xl font-serif font-bold mb-10 text-center">{selectedBook}</h3>
             <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-y-auto pr-4 pb-10 custom-scrollbar">
                {[...Array(totalChaptersInCurrentBook)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => loadChapter(selectedBook, i + 1)} 
                    className={`h-16 rounded-2xl flex items-center justify-center font-serif text-2xl border transition-all ${selectedChapter === i+1 ? 'bg-gold text-stone-900 border-gold shadow-xl scale-110' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:border-gold hover:text-gold'}`}
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
