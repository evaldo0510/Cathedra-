
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { generateSpeech, fetchRealBibleText, getChapterAnalysis, searchBible } from '../services/gemini';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback } from '../services/bibleLocal';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { LangContext } from '../App';

const CANON = getCatholicCanon();
const FLAT_CANON = Object.values(CANON).flatMap(t => Object.values(t).flat());

interface ChapterAnalysis {
  propheticInsight: string;
  catechismLinks: { number: number, text: string }[];
  magisteriumStatements: { source: string, quote: string }[];
  patristicView: string;
}

const Bible: React.FC<{ onDeepDive?: (topic: string) => void }> = ({ onDeepDive }) => {
  const { lang, t } = useContext(LangContext);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<ChapterAnalysis | null>(null);
  const [loadError, setLoadError] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [bookSearch, setBookSearch] = useState('');
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  
  const [recentBooks, setRecentBooks] = useState<string[]>([]);
  const [dailySuggestion, setDailySuggestion] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const chapterGridRef = useRef<HTMLDivElement>(null);

  const totalChaptersInCurrentBook = useMemo(() => getChapterCount(selectedBook), [selectedBook]);

  const loadContent = useCallback(async (book: string, chapter: number, version: BibleVersion, verseToScroll?: number) => {
    setLoading(true);
    setLoadError(false);
    setAnalysis(null);
    setIsSearching(false);
    setSearchResults([]);
    setHighlightedVerse(verseToScroll || null);
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsReading(null);
    }

    try {
      const data = await fetchRealBibleText(book, chapter, version.name, lang);
      if (data && data.length > 0) {
        setVerses(data);
      } else {
        throw new Error("No verses returned");
      }
    } catch (err) {
      console.warn("AI Bible Fetch failed, using Scriptorium Fallback:", err);
      const fallback = fetchLocalFallback(book, chapter);
      setVerses(fallback);
      setLoadError(true);
    } finally {
      setLoading(false);
      localStorage.setItem('cathedra_last_read', JSON.stringify({ book, chapter, versionId: version.id }));
      updateRecentBooks(book);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (verseToScroll) {
        setTimeout(() => {
          verseRefs.current[verseToScroll]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [lang]);

  const updateRecentBooks = (book: string) => {
    const saved = JSON.parse(localStorage.getItem('cathedra_recent_books') || '[]');
    const updated = [book, ...saved.filter((b: string) => b !== book)].slice(0, 5);
    setRecentBooks(updated);
    localStorage.setItem('cathedra_recent_books', JSON.stringify(updated));
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    const refRegex = /^(.+?)\s+(\d+)(?::(\d+))?$/;
    const match = searchTerm.trim().match(refRegex);

    if (match) {
      const bookName = match[1];
      const chapter = parseInt(match[2]);
      const verse = match[3] ? parseInt(match[3]) : undefined;
      
      let actualBook = bookName;
      let found = false;
      Object.values(CANON).forEach(testament => {
        Object.values(testament).forEach(cat => {
          const b = cat.find(b => b.toLowerCase() === bookName.toLowerCase() || b.toLowerCase().startsWith(bookName.toLowerCase()));
          if (b) { actualBook = b; found = true; }
        });
      });

      if (found) {
        setSelectedBook(actualBook);
        setSelectedChapter(chapter);
        loadContent(actualBook, chapter, selectedVersion, verse);
        setSearchTerm('');
      } else {
        setIsSearching(true);
        const results = await searchBible(searchTerm, lang);
        setSearchResults(results);
        setLoading(false);
      }
    } else {
      setIsSearching(true);
      try {
        const results = await searchBible(searchTerm, lang);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const loadAnalysis = async () => {
    if (loadingAnalysis) return;
    setLoadingAnalysis(true);
    try {
      const data = await getChapterAnalysis(selectedBook, selectedChapter, lang);
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
      setTimeout(() => {
         document.getElementById('analysis-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_last_read');
    const recent = JSON.parse(localStorage.getItem('cathedra_recent_books') || '[]');
    const daily = localStorage.getItem(`cathedra_daily_${lang}`);
    
    setRecentBooks(recent);
    if (daily) {
      const parsed = JSON.parse(daily);
      if (parsed.gospel?.reference) {
        const match = parsed.gospel.reference.match(/^([a-zA-Z\sÀ-ÿ]+)/);
        if (match) setDailySuggestion(match[1].trim());
      }
    }

    if (saved) {
      const { book, chapter, versionId } = JSON.parse(saved);
      const version = BIBLE_VERSIONS.find(v => v.id === versionId) || BIBLE_VERSIONS[0];
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setSelectedVersion(version);
      loadContent(book, chapter, version);
    } else {
      loadContent("Gênesis", 1, BIBLE_VERSIONS[0]);
    }
  }, []);

  const changeChapter = (offset: number) => {
    const next = selectedChapter + offset;
    if (next >= 1 && next <= totalChaptersInCurrentBook) {
      setSelectedChapter(next);
      loadContent(selectedBook, next, selectedVersion);
    } else if (next > totalChaptersInCurrentBook) {
      // Avança para o próximo livro
      const currentIndex = FLAT_CANON.indexOf(selectedBook);
      if (currentIndex < FLAT_CANON.length - 1) {
        const nextBook = FLAT_CANON[currentIndex + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
        loadContent(nextBook, 1, selectedVersion);
      }
    } else if (next < 1) {
      // Volta para o livro anterior
      const currentIndex = FLAT_CANON.indexOf(selectedBook);
      if (currentIndex > 0) {
        const prevBook = FLAT_CANON[currentIndex - 1];
        const prevBookChapters = getChapterCount(prevBook);
        setSelectedBook(prevBook);
        setSelectedChapter(prevBookChapters);
        loadContent(prevBook, prevBookChapters, selectedVersion);
      }
    }
  };

  const changeBook = (offset: number) => {
    const currentIndex = FLAT_CANON.indexOf(selectedBook);
    const nextIndex = currentIndex + offset;
    if (nextIndex >= 0 && nextIndex < FLAT_CANON.length) {
      const nextBook = FLAT_CANON[nextIndex];
      const nextBookTotalChapters = getChapterCount(nextBook);
      
      // Tenta manter o capítulo atual, caso contrário vai para o último capítulo do novo livro
      const targetChapter = Math.min(selectedChapter, nextBookTotalChapters);
      
      setSelectedBook(nextBook);
      setSelectedChapter(targetChapter);
      loadContent(nextBook, targetChapter, selectedVersion);
    }
  };

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
    Object.entries(CANON).forEach(([testament, categories]) => {
      Object.entries(categories).forEach(([category, books]) => {
        const filtered = books.filter(b => b.toLowerCase().includes(term));
        if (filtered.length > 0) results[testament][category] = filtered;
      });
    });
    return results;
  }, [bookSearch]);

  const handleSelectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setShowBookSelector(false);
    loadContent(book, 1, selectedVersion);
    setBookSearch('');
  };

  const nextBookName = useMemo(() => {
    const idx = FLAT_CANON.indexOf(selectedBook);
    return idx < FLAT_CANON.length - 1 ? FLAT_CANON[idx + 1] : null;
  }, [selectedBook]);

  const prevBookName = useMemo(() => {
    const idx = FLAT_CANON.indexOf(selectedBook);
    return idx > 0 ? FLAT_CANON[idx - 1] : null;
  }, [selectedBook]);

  return (
    <div className="max-w-5xl mx-auto pb-48 space-y-12 page-enter relative">
      {/* BARRA DE PESQUISA SUPERIOR */}
      <section className="bg-white dark:bg-stone-900 p-4 rounded-[2.5rem] shadow-xl border border-stone-100 dark:border-stone-800">
        <form onSubmit={handleGlobalSearch} className="flex gap-3">
           <div className="flex-1 relative group">
              <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Ex: Jo 3:16 ou 'Sermão da Montanha'" 
                className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-800 rounded-3xl outline-none font-serif italic text-lg border border-transparent focus:border-gold/50 transition-all dark:text-white"
              />
           </div>
           <button type="submit" className="px-8 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">
              Pesquisar
           </button>
        </form>
      </section>

      {/* NAVEGAÇÃO DE LIVRO E CAPÍTULO REFINADA */}
      <nav className="sticky top-0 z-[140] bg-[#fdfcf8]/90 dark:bg-[#0c0a09]/90 backdrop-blur-xl p-3 md:p-5 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl flex flex-col md:flex-row items-center gap-4">
        <div className="flex w-full md:w-auto gap-2 items-center">
          {/* Seletor de Livro com setas de navegação rápida */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-[1.5rem]">
            <button onClick={() => changeBook(-1)} disabled={!prevBookName} className="p-3 text-stone-400 hover:text-gold transition-colors active:scale-90 disabled:opacity-20">
              <Icons.ArrowDown className="w-4 h-4 rotate-90" />
            </button>
            <button 
              onClick={() => setShowBookSelector(true)} 
              className="flex items-center gap-3 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 px-6 py-3 rounded-[1.2rem] shadow-xl transition-all active:scale-95 min-w-[140px] justify-center"
            >
              <Icons.Book className="w-4 h-4" />
              <span className="font-serif font-bold text-lg tracking-tight truncate max-w-[120px]">{selectedBook}</span>
            </button>
            <button onClick={() => changeBook(1)} disabled={!nextBookName} className="p-3 text-stone-400 hover:text-gold transition-colors active:scale-90 disabled:opacity-20">
              <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>

          {/* Seletor de Capítulo com setas de navegação rápida */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-[1.5rem]">
            <button onClick={() => changeChapter(-1)} className="p-3 text-stone-400 hover:text-gold transition-colors active:scale-90">
              <Icons.ArrowDown className="w-4 h-4 rotate-90" />
            </button>
            <button 
              onClick={() => setShowChapterPicker(true)} 
              className="px-6 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-[1.2rem] font-serif font-bold text-lg text-stone-800 dark:text-gold shadow-md min-w-[60px] text-center"
            >
              {selectedChapter}
            </button>
            <button onClick={() => changeChapter(1)} className="p-3 text-stone-400 hover:text-gold transition-colors active:scale-90">
              <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-50/50 dark:bg-stone-900/50 p-2 rounded-2xl border border-stone-100 dark:border-stone-800 w-full md:w-auto overflow-x-auto no-scrollbar">
          {BIBLE_VERSIONS.map(v => (
            <button 
              key={v.id}
              onClick={() => { setSelectedVersion(v); loadContent(selectedBook, selectedChapter, v); }}
              className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedVersion.id === v.id ? 'bg-gold text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </nav>

      {/* TEXTO SAGRADO */}
      <main className="space-y-8 min-h-[50vh]">
        {loading ? (
          <div className="space-y-6 animate-pulse p-10">
            {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-24 bg-stone-100 dark:bg-stone-900/50 rounded-2xl" />)}
          </div>
        ) : isSearching ? (
          <div className="space-y-8 animate-in fade-in">
             <header className="flex items-center justify-between px-6">
               <h3 className="text-2xl font-serif font-bold">Resultados para "{searchTerm}"</h3>
               <button onClick={() => setIsSearching(false)} className="text-gold text-[10px] font-black uppercase tracking-widest">Fechar Busca</button>
            </header>
            <div className="grid gap-6">
               {searchResults.length > 0 ? searchResults.map((v, i) => (
                 <div key={i} className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-4 hover:border-gold transition-all cursor-pointer" onClick={() => { setSelectedBook(v.book); setSelectedChapter(v.chapter); loadContent(v.book, v.chapter, selectedVersion, v.verse); }}>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-sacred uppercase tracking-widest">{v.book} {v.chapter}:{v.verse}</span>
                       <Icons.ArrowDown className="w-4 h-4 -rotate-90 text-gold/40" />
                    </div>
                    <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">"{v.text}"</p>
                 </div>
               )) : (
                 <div className="text-center py-20 bg-stone-50 dark:bg-stone-900 rounded-[3rem] border border-dashed border-stone-200">
                    <p className="text-xl font-serif italic text-stone-400">Nenhum resultado encontrado para sua busca.</p>
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 relative">
            <div className="max-w-4xl mx-auto">
              <header className="text-center mb-16 space-y-4">
                 <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-8 bg-gold/30" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">{selectedVersion.name}</span>
                    <div className="h-px w-8 bg-gold/30" />
                 </div>
                 <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">
                   {selectedBook} <span className="text-gold">{selectedChapter}</span>
                 </h2>
                 {loadError && <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">Carregado via Scriptorium Local</p>}
              </header>

              <div className="space-y-12">
                {verses.length > 0 ? verses.map((v, i) => (
                  <div 
                    key={i} 
                    ref={el => verseRefs.current[v.verse] = el}
                    className={`group relative flex gap-6 md:gap-10 items-start transition-all py-4 px-2 rounded-2xl ${highlightedVerse === v.verse ? 'bg-gold/10 ring-2 ring-gold/20' : 'hover:bg-gold/[0.02]'}`}
                  >
                    <span className="text-base font-serif font-bold text-gold/60 mt-2 select-none w-8 flex-shrink-0 text-right">{v.verse}</span>
                    <div className="flex-1 space-y-4">
                      <p className="text-2xl md:text-3xl font-serif leading-relaxed text-stone-800 dark:text-stone-100 tracking-tight">
                        {v.text}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => toggleSpeech(v)} className={`p-2 rounded-xl transition-all ${isReading === `${v.book}_${v.chapter}_${v.verse}` ? 'bg-gold text-stone-900' : 'text-stone-300 hover:text-gold hover:bg-gold/10'}`}>
                          <Icons.Audio className="w-5 h-5" />
                        </button>
                        <ActionButtons itemId={`${v.book}_${v.chapter}_${v.verse}`} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 flex flex-col items-center gap-6">
                     <Icons.Cross className="w-12 h-12 text-stone-200" />
                     <p className="text-2xl font-serif italic text-stone-400">Restaurando os arquivos sagrados...</p>
                     <button onClick={() => loadContent(selectedBook, selectedChapter, selectedVersion)} className="text-gold font-black uppercase text-[10px] tracking-widest hover:underline">Tentar novamente</button>
                  </div>
                )}
              </div>

              {/* RODAPÉ DO CAPÍTULO - ANÁLISE TEOLÓGICA COMPLETA */}
              <footer className="mt-24 pt-16 border-t border-stone-50 dark:border-stone-800 space-y-16">
                 <div id="analysis-anchor" />
                 
                 <div className="flex flex-col items-center gap-12">
                   {!analysis && (
                     <button 
                      onClick={loadAnalysis}
                      disabled={loadingAnalysis}
                      className="px-12 py-6 bg-gold text-stone-900 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 transition-all flex items-center gap-4 mx-auto disabled:opacity-50"
                     >
                       {loadingAnalysis ? <div className="w-5 h-5 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-5 h-5" />}
                       {loadingAnalysis ? "Consultando a Tradição..." : "Analisar com Inteligência Teológica"}
                     </button>
                   )}
                   
                   {analysis && (
                      <div className="w-full text-left space-y-12 animate-in slide-in-from-bottom-10">
                           <div className="text-center space-y-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Analytica Profunda</span>
                             <h3 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Síntese de Fé e Razão</h3>
                           </div>

                           <div className="grid md:grid-cols-2 gap-8">
                              {/* Insights Proféticos */}
                              <div className="bg-[#fcf8e8] dark:bg-stone-900/80 p-10 rounded-[3rem] border border-gold/20 shadow-xl space-y-6 relative overflow-hidden group">
                                 <div className="absolute -top-10 -right-10 p-10 opacity-[0.05] group-hover:scale-110 transition-transform pointer-events-none">
                                    <Icons.Feather className="w-48 h-48 text-sacred" />
                                 </div>
                                 <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-sacred text-white rounded-2xl shadow-lg"><Icons.Feather className="w-5 h-5" /></div>
                                    <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-gold">Voz dos Profetas</h4>
                                 </div>
                                 <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed relative z-10">{analysis.propheticInsight}</p>
                              </div>

                              {/* Visão Patrística */}
                              <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6 relative overflow-hidden group">
                                 <div className="absolute -top-10 -right-10 p-10 opacity-[0.05] group-hover:scale-110 transition-transform pointer-events-none">
                                    <Icons.Users className="w-48 h-48 text-gold" />
                                 </div>
                                 <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl shadow-lg"><Icons.Users className="w-5 h-5" /></div>
                                    <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Visão Patrística</h4>
                                 </div>
                                 <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed relative z-10">{analysis.patristicView}</p>
                              </div>

                              {/* Magistério da Igreja */}
                              <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6 md:col-span-2 group">
                                 <div className="flex items-center gap-4">
                                    <div className="p-3 bg-stone-50 dark:bg-stone-800 text-sacred rounded-2xl shadow-md border border-stone-100 dark:border-stone-700"><Icons.Globe className="w-5 h-5" /></div>
                                    <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Ensino do Magistério</h4>
                                 </div>
                                 <div className="grid gap-6">
                                    {analysis.magisteriumStatements && analysis.magisteriumStatements.length > 0 ? analysis.magisteriumStatements.map((stmt, sIdx) => (
                                      <div key={sIdx} className="space-y-3 pl-6 border-l-4 border-gold/30">
                                         <p className="text-lg font-serif italic text-stone-600 dark:text-stone-400">"{stmt.quote}"</p>
                                         <span className="text-[9px] font-black uppercase tracking-widest text-gold">{stmt.source}</span>
                                      </div>
                                    )) : (
                                      <p className="text-sm italic text-stone-400">Consultando documentos oficiais...</p>
                                    )}
                                 </div>
                              </div>

                              {/* Nexo com o Catecismo */}
                              <div className="bg-[#1a1a1a] p-10 rounded-[3rem] text-white shadow-2xl space-y-8 md:col-span-2 relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                                    <Icons.Cross className="w-64 h-64 text-gold" />
                                 </div>
                                 <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-gold text-stone-900 rounded-2xl shadow-xl"><Icons.Book className="w-5 h-5" /></div>
                                    <h4 className="text-2xl font-serif font-bold text-gold tracking-tight">Nexo Catequético (CIC)</h4>
                                 </div>
                                 <div className="grid gap-4 relative z-10">
                                    {analysis.catechismLinks && analysis.catechismLinks.length > 0 ? analysis.catechismLinks.map((link, lIdx) => (
                                      <div key={lIdx} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all cursor-default">
                                         <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-gold text-stone-900 rounded-full text-[8px] font-black uppercase tracking-widest">№ {link.number}</span>
                                         </div>
                                         <p className="text-base font-serif italic text-white/80 leading-relaxed">{link.text}</p>
                                      </div>
                                    )) : (
                                      <p className="text-sm italic text-white/40">Buscando parágrafos relacionados...</p>
                                    )}
                                 </div>
                              </div>
                           </div>

                           <button onClick={() => setAnalysis(null)} className="text-stone-400 hover:text-gold text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto pt-8">
                             <Icons.ArrowDown className="w-4 h-4 rotate-180" /> Ocultar Análise
                           </button>
                      </div>
                   )}
                 </div>

                 {/* Barra de Navegação de Livros e Capítulos ao Final */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Botão de Livro Anterior */}
                    {prevBookName && (
                      <button 
                        onClick={() => changeBook(-1)}
                        className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-stone-50 dark:bg-stone-900/50 hover:bg-gold/10 border border-stone-100 dark:border-stone-800 transition-all text-left group"
                      >
                        <Icons.ArrowDown className="w-6 h-6 rotate-90 text-gold group-hover:-translate-x-2 transition-transform" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Livro Anterior</span>
                          <p className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-200">{prevBookName}</p>
                        </div>
                      </button>
                    )}

                    {/* Botão de Próximo Livro */}
                    {nextBookName && (
                      <button 
                        onClick={() => changeBook(1)}
                        className="flex items-center justify-end gap-6 p-8 rounded-[2.5rem] bg-stone-50 dark:bg-stone-900/50 hover:bg-gold/10 border border-stone-100 dark:border-stone-800 transition-all text-right group"
                      >
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Próximo Livro</span>
                          <p className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-200">{nextBookName}</p>
                        </div>
                        <Icons.ArrowDown className="w-6 h-6 -rotate-90 text-gold group-hover:translate-x-2 transition-transform" />
                      </button>
                    )}

                    <div className="md:col-span-2 flex justify-center gap-4 mt-8 pt-8 border-t border-stone-100 dark:border-stone-800">
                      <button 
                        onClick={() => changeChapter(-1)} 
                        className="flex items-center gap-3 px-8 py-4 bg-stone-50 dark:bg-stone-800 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400 active:scale-95"
                      >
                        Capítulo Anterior
                      </button>
                      <button 
                        onClick={() => changeChapter(1)} 
                        className="flex items-center gap-3 px-8 py-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-lg"
                      >
                        {selectedChapter >= totalChaptersInCurrentBook ? "Próximo Livro" : "Próximo Capítulo"}
                      </button>
                    </div>
                 </div>
              </footer>
            </div>
          </div>
        )}
      </main>

      {/* SELETOR DE LIVRO REPROJETADO */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowBookSelector(false)}>
           <div className="bg-white dark:bg-stone-950 w-full max-w-6xl max-h-[85vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-10 border-b dark:border-stone-900 space-y-8 bg-white dark:bg-stone-900/50">
                 <div className="flex justify-between items-center">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Escolha o Livro</h2>
                    <button onClick={() => setShowBookSelector(false)} className="p-4 bg-stone-100 dark:bg-stone-800 rounded-full active:scale-90"><Icons.Cross className="w-5 h-5 rotate-45" /></button>
                 </div>

                 {/* Busca Dinâmica */}
                 <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative">
                       <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold/40 w-5 h-5" />
                       <input 
                        type="text" 
                        value={bookSearch} 
                        onChange={e => setBookSearch(e.target.value)}
                        placeholder="Nome do livro (ex: Mateus, Isaías...)" 
                        className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-900 rounded-2xl outline-none font-serif italic text-lg focus:border-gold/50 border border-transparent transition-all dark:text-white" 
                       />
                    </div>
                    <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl">
                       {['Antigo Testamento', 'Novo Testamento'].map((t: any) => (
                         <button 
                          key={t} 
                          onClick={() => setActiveTestament(t)} 
                          className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTestament === t ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-gold shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Sugestões Inteligentes */}
                 {!bookSearch && (
                    <div className="flex flex-wrap gap-3 mt-4">
                       {dailySuggestion && (
                          <button onClick={() => handleSelectBook(dailySuggestion)} className="flex items-center gap-2 px-4 py-2 bg-sacred/10 text-sacred rounded-full text-[9px] font-black uppercase tracking-widest border border-sacred/20">
                             <Icons.Star className="w-3 h-3" /> Evangelho: {dailySuggestion}
                          </button>
                       )}
                       {recentBooks.map(b => (
                          <button key={b} onClick={() => handleSelectBook(b)} className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-stone-200 dark:border-stone-700">
                             {b}
                          </button>
                       ))}
                    </div>
                 )}
              </header>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {Object.entries(filteredCanon[activeTestament] || {}).map(([cat, books]: [string, any]) => (
                  <section key={cat} className="mb-10 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60 ml-2">{cat}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {books.map((book: string) => (
                        <button 
                          key={book} 
                          onClick={() => handleSelectBook(book)}
                          className={`p-5 rounded-2xl text-left font-serif font-bold text-lg transition-all border-2 ${selectedBook === book ? 'bg-gold text-stone-900 border-gold shadow-lg scale-105 z-10' : 'bg-white dark:bg-stone-900 border-stone-50 dark:border-stone-800 hover:border-gold/30 hover:shadow-md'}`}
                        >
                          {book}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
           </div>
        </div>
      )}

      {/* SELETOR DE CAPÍTULO REPROJETADO COM FOCO NO ATUAL */}
      {showChapterPicker && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowChapterPicker(false)}>
          <div 
            className="bg-white dark:bg-stone-950 p-10 md:p-14 rounded-[3.5rem] shadow-3xl max-w-4xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar animate-modal-zoom border border-white/10" 
            onClick={e => e.stopPropagation()}
            onLoad={() => {
               // Scroll para o botão ativo
               const activeBtn = document.querySelector('.chapter-active');
               if (activeBtn) activeBtn.scrollIntoView({ block: 'center' });
            }}
          >
             <header className="mb-10 text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">Ir para o capítulo</span>
                <h3 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">{selectedBook}</h3>
                <div className="h-px w-24 bg-gold/30 mx-auto mt-4" />
             </header>
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3" ref={chapterGridRef}>
                {[...Array(totalChaptersInCurrentBook)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setSelectedChapter(i + 1); setShowChapterPicker(false); loadContent(selectedBook, i + 1, selectedVersion); }}
                    className={`aspect-square rounded-2xl flex items-center justify-center font-serif text-2xl transition-all border-2 ${selectedChapter === i+1 ? 'bg-gold text-stone-900 border-gold shadow-2xl scale-110 z-10 chapter-active' : 'bg-white dark:bg-stone-900 border-stone-50 dark:border-stone-800 text-stone-400 hover:text-gold hover:border-gold/30'}`}
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
