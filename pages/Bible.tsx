
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { generateSpeech, fetchRealBibleText, getChapterAnalysis, searchBible } from '../services/gemini';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback } from '../services/bibleLocal';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { LangContext } from '../App';

const CANON = getCatholicCanon();

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

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const totalChaptersInCurrentBook = useMemo(() => getChapterCount(selectedBook), [selectedBook]);

  const loadContent = useCallback(async (book: string, chapter: number, version: BibleVersion, verseToScroll?: number) => {
    setLoading(true);
    setLoadError(false);
    setAnalysis(null);
    setVerses([]);
    setIsSearching(false);
    setSearchResults([]);
    setHighlightedVerse(verseToScroll || null);
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsReading(null);
    }

    try {
      // Tenta buscar da IA (Gemini)
      const data = await fetchRealBibleText(book, chapter, version.name, lang);
      if (data && data.length > 0) {
        setVerses(data);
      } else {
        throw new Error("No verses returned");
      }
    } catch (err) {
      console.warn("AI Bible Fetch failed, using Scriptorium Fallback:", err);
      // Se a IA falhar, usamos o Fallback Local (Scriptorium) para nunca deixar o usuário vazio
      const fallback = fetchLocalFallback(book, chapter);
      setVerses(fallback);
      setLoadError(true);
    } finally {
      setLoading(false);
      localStorage.setItem('cathedra_last_read', JSON.stringify({ book, chapter, versionId: version.id }));
      if (verseToScroll) {
        setTimeout(() => {
          verseRefs.current[verseToScroll]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [lang]);

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
      Object.values(CANON).forEach(testament => {
        Object.values(testament).forEach(cat => {
          const found = cat.find(b => b.toLowerCase().startsWith(bookName.toLowerCase()));
          if (found) actualBook = found;
        });
      });

      setSelectedBook(actualBook);
      setSelectedChapter(chapter);
      loadContent(actualBook, chapter, selectedVersion, verse);
      setSearchTerm('');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
                placeholder="Busca rápida ou referência (ex: Jo 3, 16)" 
                className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-800 rounded-3xl outline-none font-serif italic text-lg border border-transparent focus:border-gold/50 transition-all dark:text-white"
              />
           </div>
           <button type="submit" className="px-8 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">
              Ir
           </button>
        </form>
      </section>

      {/* NAVEGAÇÃO DE LIVRO E CAPÍTULO */}
      <nav className="sticky top-0 z-[140] bg-[#fdfcf8]/90 dark:bg-[#0c0a09]/90 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="flex w-full md:w-auto gap-3">
          <button 
            onClick={() => setShowBookSelector(true)} 
            className="flex-1 md:flex-none flex items-center justify-between gap-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 px-8 py-4 rounded-[1.5rem] shadow-xl transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Icons.Book className="w-5 h-5" />
              <span className="font-serif font-bold text-xl md:text-2xl tracking-tight">{selectedBook}</span>
            </div>
            <Icons.ArrowDown className="w-3 h-3 opacity-50" />
          </button>
          
          <button 
            onClick={() => setShowChapterPicker(true)} 
            className="px-8 py-4 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[1.5rem] font-serif font-bold text-xl md:text-2xl text-stone-800 dark:text-gold shadow-md"
          >
            {selectedChapter}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-stone-50/50 dark:bg-stone-900/50 p-2 rounded-2xl border border-stone-100 dark:border-stone-800 w-full md:w-auto overflow-x-auto no-scrollbar">
          {BIBLE_VERSIONS.map(v => (
            <button 
              key={v.id}
              onClick={() => { setSelectedVersion(v); loadContent(selectedBook, selectedChapter, v); }}
              className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedVersion.id === v.id ? 'bg-gold text-stone-900 shadow-lg' : 'text-stone-400'}`}
            >
              {v.name}
            </button>
          ))}
        </div>

        <div className="hidden md:flex flex-1 justify-end gap-2">
          <button onClick={() => changeChapter(-1)} disabled={selectedChapter <= 1} className="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl text-stone-400 hover:text-gold disabled:opacity-20 transition-colors">
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
          </button>
          <button onClick={() => changeChapter(1)} disabled={selectedChapter >= totalChaptersInCurrentBook} className="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl text-stone-400 hover:text-gold disabled:opacity-20 transition-colors">
            <Icons.ArrowDown className="w-5 h-5 -rotate-90" />
          </button>
        </div>
      </nav>

      {/* TEXTO SAGRADO */}
      <main className="space-y-8 min-h-[50vh]">
        {loading ? (
          <div className="space-y-6 animate-pulse p-10">
            {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-20 bg-stone-100 dark:bg-stone-900/50 rounded-2xl" />)}
          </div>
        ) : isSearching ? (
          <div className="space-y-8 animate-in fade-in">
             <header className="flex items-center justify-between px-6">
               <h3 className="text-2xl font-serif font-bold">Resultados para "{searchTerm}"</h3>
               <button onClick={() => setIsSearching(false)} className="text-gold text-[10px] font-black uppercase tracking-widest">Fechar Busca</button>
            </header>
            <div className="grid gap-6">
               {searchResults.map((v, i) => (
                 <div key={i} className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-4 hover:border-gold transition-all cursor-pointer" onClick={() => { setSelectedBook(v.book); setSelectedChapter(v.chapter); loadContent(v.book, v.chapter, selectedVersion, v.verse); }}>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-sacred uppercase tracking-widest">{v.book} {v.chapter}:{v.verse}</span>
                       <Icons.ArrowDown className="w-4 h-4 -rotate-90 text-gold/40" />
                    </div>
                    <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">"{v.text}"</p>
                 </div>
               ))}
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
                    className={`group relative flex gap-6 md:gap-10 items-start transition-all py-4 px-2 rounded-2xl ${highlightedVerse === v.verse ? 'bg-gold/10 ring-2 ring-gold/20' : ''}`}
                  >
                    <span className="text-base font-serif font-bold text-gold/60 mt-2 select-none w-6 flex-shrink-0 text-right">{v.verse}</span>
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
                     <p className="text-2xl font-serif italic text-stone-400">O texto deste capítulo está sendo restaurado.</p>
                     <button onClick={() => loadContent(selectedBook, selectedChapter, selectedVersion)} className="text-gold font-black uppercase text-[10px] tracking-widest">Tentar novamente</button>
                  </div>
                )}
              </div>

              {/* RODAPÉ DO CAPÍTULO - ONDE ENTRA A ANÁLISE */}
              <footer className="mt-24 pt-16 border-t border-stone-50 dark:border-stone-800 flex flex-col items-center gap-12">
                 <div id="analysis-anchor" />
                 <button 
                  onClick={loadAnalysis}
                  disabled={loadingAnalysis}
                  className="px-12 py-6 bg-gold text-stone-900 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 transition-all flex items-center gap-4 mx-auto"
                 >
                   {loadingAnalysis ? <div className="w-5 h-5 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-5 h-5" />}
                   {loadingAnalysis ? "Consultando a Tradição..." : "Analisar com Inteligência Teológica"}
                 </button>
                 
                 {analysis && (
                    <div className="w-full text-left space-y-12 animate-in slide-in-from-bottom-10">
                         <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-[#fcf8e8] dark:bg-stone-900/80 p-12 rounded-[3.5rem] border border-gold/20 shadow-xl space-y-6">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-sacred text-white rounded-2xl"><Icons.Feather className="w-5 h-5" /></div>
                                  <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-gold">Voz dos Profetas</h4>
                               </div>
                               <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">{analysis.propheticInsight}</p>
                            </div>
                            <div className="bg-white dark:bg-stone-900 p-12 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl"><Icons.Users className="w-5 h-5" /></div>
                                  <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Visão Patrística</h4>
                               </div>
                               <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">{analysis.patristicView}</p>
                            </div>
                         </div>
                    </div>
                 )}

                 <div className="flex gap-4">
                   <button 
                    onClick={() => changeChapter(-1)} 
                    disabled={selectedChapter <= 1}
                    className="flex items-center gap-3 px-8 py-4 bg-stone-50 dark:bg-stone-800 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400 disabled:opacity-20"
                   >
                     Capítulo Anterior
                   </button>
                   <button 
                    onClick={() => changeChapter(1)} 
                    disabled={selectedChapter >= totalChaptersInCurrentBook}
                    className="flex items-center gap-3 px-8 py-4 bg-stone-50 dark:bg-stone-800 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400 disabled:opacity-20"
                   >
                     Próximo Capítulo
                   </button>
                 </div>
              </footer>
            </div>
          </div>
        )}
      </main>

      {/* SELETOR DE LIVRO */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowBookSelector(false)}>
           <div className="bg-white dark:bg-stone-950 w-full max-w-6xl max-h-[85vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className="p-10 border-b dark:border-stone-900 space-y-8 bg-white dark:bg-stone-900/50">
                 <div className="flex justify-between items-center">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Escolha o Livro</h2>
                    <button onClick={() => setShowBookSelector(false)} className="p-4 bg-stone-100 dark:bg-stone-800 rounded-full active:scale-90"><Icons.Cross className="w-5 h-5 rotate-45" /></button>
                 </div>
                 <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative">
                       <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold/40 w-5 h-5" />
                       <input 
                        type="text" 
                        value={bookSearch} 
                        onChange={e => setBookSearch(e.target.value)}
                        placeholder="Nome do livro sagrado..." 
                        className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-900 rounded-2xl outline-none font-serif italic text-lg" 
                       />
                    </div>
                    <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl">
                       {['Antigo Testamento', 'Novo Testamento'].map((t: any) => (
                         <button 
                          key={t} 
                          onClick={() => setActiveTestament(t)} 
                          className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTestament === t ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-gold shadow-md' : 'text-stone-400'}`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                 </div>
              </header>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {Object.entries(filteredCanon[activeTestament] || {}).map(([cat, books]: [string, any]) => (
                  <section key={cat} className="mb-10 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60 ml-2">{cat}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {books.map((book: string) => (
                        <button 
                          key={book} 
                          onClick={() => { setSelectedBook(book); setSelectedChapter(1); setShowBookSelector(false); loadContent(book, 1, selectedVersion); }}
                          className={`p-5 rounded-2xl text-left font-serif font-bold text-lg transition-all border-2 ${selectedBook === book ? 'bg-gold text-stone-900 border-gold shadow-lg' : 'bg-white dark:bg-stone-900 border-stone-50 dark:border-stone-800 hover:border-gold/30'}`}
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

      {/* SELETOR DE CAPÍTULO */}
      {showChapterPicker && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowChapterPicker(false)}>
          <div className="bg-white dark:bg-stone-950 p-10 md:p-14 rounded-[3.5rem] shadow-3xl max-w-4xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar animate-modal-zoom border border-white/10" onClick={e => e.stopPropagation()}>
             <header className="mb-10 text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">Selecionar Capítulo</span>
                <h3 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">{selectedBook}</h3>
             </header>
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {[...Array(totalChaptersInCurrentBook)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setSelectedChapter(i + 1); setShowChapterPicker(false); loadContent(selectedBook, i + 1, selectedVersion); }}
                    className={`aspect-square rounded-2xl flex items-center justify-center font-serif text-2xl transition-all border-2 ${selectedChapter === i+1 ? 'bg-gold text-stone-900 border-gold shadow-2xl scale-110 z-10' : 'bg-white dark:bg-stone-900 border-stone-50 dark:border-stone-800 text-stone-400'}`}
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
