
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
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [expandedCommentary, setExpandedCommentary] = useState<string | null>(null);
  const [inlineCommentaryData, setInlineCommentaryData] = useState<Record<string, { content: string, fathers: string[], loading: boolean }>>({});
  
  // Advanced Filter State
  const [filterBooks, setFilterBooks] = useState<string[]>([]);
  const [filterChapter, setFilterChapter] = useState('');
  const [filterVerse, setFilterVerse] = useState('');

  // Wallpaper State
  const [wallpaperVerse, setWallpaperVerse] = useState<Verse | null>(null);
  const [wallpaperTheme, setWallpaperTheme] = useState<'light' | 'dark'>('light');
  const wallpaperCanvasRef = useRef<HTMLCanvasElement>(null);

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
      // Primeiro tentamos o cache "local" simulado
      let data = await fetchLocalChapter(version.id, book, chapter);
      
      // Para um produto pro, se o texto é genérico ("No princípio..."), 
      // vamos forçar a busca de texto REAL via IA para este capítulo específico.
      if (data.length > 0 && data[0].text.startsWith("No princípio era o Verbo")) {
         const realData = await fetchRealBibleText(book, chapter, lang);
         if (realData.length > 0) data = realData;
      }

      setVerses(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
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
      setInlineCommentaryData(prev => ({ ...prev, [vid]: { content: "Erro ao carregar comentário.", fathers: [], loading: false } }));
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

  const VerseItem = ({ v, isSearch = false }: { v: Verse; isSearch?: boolean }) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    const isExpanded = expandedCommentary === vid;
    const isThisVerseReading = isReading === vid;
    const commentary = inlineCommentaryData[vid];
    return (
      <div className="space-y-4">
        <article className={`p-8 md:p-12 rounded-[2.5rem] border-l-[12px] shadow-lg bg-white dark:bg-stone-900 transition-all duration-500 ${isThisVerseReading ? 'border-gold bg-gold/5' : 'border-stone-100 dark:border-stone-800'}`}>
           <div className="flex justify-between items-center mb-6">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isThisVerseReading ? 'text-gold' : 'text-stone-400'}`}>{v.book} {v.chapter}:{v.verse}</span>
              <div className="flex gap-2">
                 <button onClick={() => toggleInlineCommentary(v)} className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}><Icons.Book className="w-5 h-5" /></button>
                 <button onClick={() => toggleSpeech(v)} className={`p-3 rounded-xl transition-all ${isThisVerseReading ? 'bg-gold text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}><Icons.Audio className="w-5 h-5" /></button>
              </div>
           </div>
           <p className="text-xl md:text-3xl font-serif italic leading-relaxed text-stone-800 dark:text-stone-100">"{v.text}"</p>
        </article>
        {isExpanded && (
          <div className="mx-6 p-8 bg-[#fcf8e8] dark:bg-stone-950 rounded-[2rem] border border-gold/20 animate-in slide-in-from-top-2">
             {commentary?.loading ? <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">Consultando a Tradição...</p> : 
             <div className="space-y-4"><p className="text-[9px] font-black uppercase tracking-widest text-gold">Tesouro Patrístico</p><p className="text-lg md:text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">{commentary?.content}</p></div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-48 space-y-6 page-enter px-2 md:px-0 relative">
      <nav className="sticky top-4 z-[140] space-y-4">
        <div className="bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border border-stone-100 dark:border-stone-800 p-4 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setShowBookSelector(true)} className="flex items-center gap-3 bg-[#1a1a1a] text-gold px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-800 transition-all whitespace-nowrap">
                <Icons.Book className="w-5 h-5" />
                <span className="font-serif font-bold text-xl">{selectedBook || 'Livro'}</span>
              </button>
              <button onClick={() => setShowChapterPicker(true)} className="px-6 py-4 bg-[#fcf8e8] dark:bg-stone-900 border border-gold/20 rounded-2xl font-serif font-bold text-xl">
                {selectedChapter}
              </button>
            </div>

            <div className="flex-1 w-full max-w-xl flex items-center gap-2">
              <form onSubmit={handleBibleSearch} className="relative flex-1">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  placeholder="Pesquisar versículo..." 
                  className="w-full pl-10 pr-4 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl outline-none font-serif italic text-lg dark:text-white" 
                />
              </form>
            </div>
          </div>
        </div>

        {selectedBook && searchResults.length === 0 && (
          <div className="bg-white/50 dark:bg-stone-900/50 backdrop-blur-md border border-white/5 p-2 rounded-2xl overflow-hidden">
             <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-2">
                {[...Array(totalChaptersInCurrentBook)].map((_, i) => {
                  const ch = i + 1;
                  const isActive = selectedChapter === ch;
                  return (
                    <button
                      key={ch}
                      onClick={() => loadChapter(selectedBook, ch)}
                      className={`min-w-[44px] h-11 flex items-center justify-center rounded-xl font-serif text-lg transition-all ${isActive ? 'bg-gold text-stone-900 shadow-lg font-bold' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:bg-stone-200'}`}
                    >
                      {ch}
                    </button>
                  );
                })}
             </div>
          </div>
        )}
      </nav>

      <main className="space-y-6">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-64 bg-stone-50 dark:bg-stone-900 rounded-[2.5rem]" />)}
          </div>
        ) : (
          <>
            {searchResults.length > 0 ? (
              <div className="space-y-10">
                 {searchResults.map((v, i) => <VerseItem key={i} v={v} isSearch />)}
              </div>
            ) : (
              verses.map((v, i) => <VerseItem key={i} v={v} />)
            )}
          </>
        )}
      </main>

      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500 overflow-hidden">
          <header className="p-8 md:p-12 flex justify-between items-center">
             <h2 className="text-4xl md:text-6xl font-serif font-bold text-gold tracking-tight">Cânon Sagrado</h2>
             <button onClick={() => setShowBookSelector(false)} className="p-4 bg-white/5 rounded-full text-white"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
          </header>
          <div className="max-w-7xl mx-auto w-full flex-1 p-6 md:p-12 pt-0 overflow-y-auto">
             <input type="text" autoFocus value={bookSearch} onChange={e => setBookSearch(e.target.value)} placeholder="Pesquisar livro..." className="w-full mb-10 pl-8 pr-8 py-8 bg-white/5 border-2 border-white/10 rounded-[2.5rem] text-2xl md:text-4xl font-serif italic text-white outline-none" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-20">
                {Object.entries(filteredCanon).map(([testament, categories]: [string, any]) => (
                  <div key={testament} className="col-span-full">
                     <h3 className="text-2xl font-black uppercase tracking-[0.3em] text-gold mb-8 border-b border-gold/20 pb-4">{testament}</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(categories).map(([catName, books]: [string, any]) => (
                          books.map((book: string) => <button key={book} onClick={() => loadChapter(book, 1)} className="text-left px-6 py-4 rounded-2xl bg-white/5 hover:bg-gold text-stone-300 hover:text-stone-900 font-serif italic text-xl transition-all">{book}</button>)
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {showChapterPicker && selectedBook && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowChapterPicker(false)}>
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[3.5rem] shadow-3xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
             <h3 className="text-3xl font-serif font-bold mb-8">{selectedBook}</h3>
             <div className="grid grid-cols-5 md:grid-cols-8 gap-3 overflow-y-auto pr-2 pb-6">
                {[...Array(totalChaptersInCurrentBook)].map((_, i) => (
                  <button key={i} onClick={() => loadChapter(selectedBook, i + 1)} className={`h-14 rounded-2xl flex items-center justify-center font-serif text-xl border ${selectedChapter === i+1 ? 'bg-gold text-stone-900 border-gold' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}>{i + 1}</button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bible;
