
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getVerseCommentary, getCatenaAureaCommentary } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { LangContext } from '../App';

const CANON = getCatholicCanon();
const GOSPELS = ["Mateus", "Marcos", "Lucas", "João"];

const ALL_BOOKS = [
  ...Object.values(CANON["Antigo Testamento"]).flat(),
  ...Object.values(CANON["Novo Testamento"]).flat()
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
  
  // Filtros de busca avançada
  const [searchBook, setSearchBook] = useState('');
  const [searchChapter, setSearchChapter] = useState('');
  const [searchVerseNum, setSearchVerseNum] = useState('');

  const [selectedVerseForCommentary, setSelectedVerseForCommentary] = useState<Verse | null>(null);
  const [commentaryType, setCommentaryType] = useState<'pilgrim' | 'catena'>('pilgrim');
  const [commentaryData, setCommentaryData] = useState<{ text: string }>({ text: "" });
  const [loadingCommentary, setLoadingCommentary] = useState(false);

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
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setShowChapterPicker(false);
    setSearchResults([]);
    setLoading(true);
    setVerses([]);
    
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
    if (!query && !searchBook && !searchChapter) return;

    setLoading(true);
    setSearchResults([]);
    setIsAdvancedSearchOpen(false);

    try {
      const results = await searchVerse(
        query, 
        searchBook || undefined, 
        searchChapter ? parseInt(searchChapter) : undefined, 
        searchVerseNum ? parseInt(searchVerseNum) : undefined, 
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
    setSearchBook('');
    setSearchChapter('');
    setSearchVerseNum('');
  };

  // Melhoria: Busca global ignorando abas se houver texto
  const globalFilteredCanon = useMemo(() => {
    const term = bookSearch.toLowerCase().trim();
    if (!term) return { [activeTestament]: CANON[activeTestament] };

    const results: Record<string, any> = {};
    
    ['Antigo Testamento', 'Novo Testamento'].forEach((testament) => {
      const testamentData = CANON[testament as keyof typeof CANON];
      const filteredTestament: Record<string, string[]> = {};
      
      Object.entries(testamentData).forEach(([category, books]) => {
        const filtered = (books as string[]).filter(b => b.toLowerCase().includes(term));
        if (filtered.length > 0) filteredTestament[category] = filtered;
      });

      if (Object.keys(filteredTestament).length > 0) {
        results[testament] = filteredTestament;
      }
    });

    return results;
  }, [activeTestament, bookSearch]);

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

  const openCommentary = async (verse: Verse, type: 'pilgrim' | 'catena') => {
    setSelectedVerseForCommentary(verse);
    setCommentaryType(type);
    setLoadingCommentary(true);
    try {
      let text = "";
      if (type === 'pilgrim') text = await getVerseCommentary(verse, lang);
      else {
        const res = await getCatenaAureaCommentary(verse, lang);
        text = res.content;
      }
      setCommentaryData({ text });
    } catch (e) { setCommentaryData({ text: "N/A" }); }
    finally { setLoadingCommentary(false); }
  };

  const VerseItem: React.FC<{ v: Verse, isSearch?: boolean }> = ({ v, isSearch = false }) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}_${isSearch ? 'search' : 'browse'}`;
    return (
      <article className={`p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border-l-[8px] md:border-l-[20px] shadow-lg bg-white dark:bg-stone-900 transition-all ${isReading === vid ? 'border-gold bg-gold/5' : isSearch ? 'border-gold/30' : 'border-stone-100 dark:border-stone-800'}`}>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-8">
            <span className="text-[9px] md:text-[12px] font-black uppercase tracking-[0.3em] text-gold">{v.book} {v.chapter}:{v.verse}</span>
            <div className="flex gap-2">
               {GOSPELS.includes(v.book) && (
                 <button onClick={() => openCommentary(v, 'catena')} className="p-3 bg-gold/10 text-sacred rounded-xl hover:bg-gold hover:text-stone-900 transition-all"><Icons.Book className="w-4 h-4 md:w-5 md:h-5" /></button>
               )}
               <button onClick={() => openCommentary(v, 'pilgrim')} className="p-3 bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-gold rounded-xl"><Icons.Feather className="w-4 h-4 md:w-5 md:h-5" /></button>
               <button onClick={() => toggleSpeech(v)} className={`p-3 rounded-xl transition-all ${isReading === vid ? 'bg-gold text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-300'}`}><Icons.Audio className="w-4 h-4 md:w-5 md:h-5" /></button>
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
              <button 
                onClick={() => setShowChapterPicker(!showChapterPicker)}
                className="px-4 md:px-6 py-3 md:py-4 bg-[#fcf8e8] dark:bg-stone-800 rounded-2xl border border-gold/20 flex items-center gap-2 hover:border-gold transition-all"
              >
                <span className="font-serif font-bold text-sm md:text-xl text-stone-800 dark:text-gold">{selectedChapter}</span>
                <Icons.ArrowDown className={`w-3 h-3 ${showChapterPicker ? 'rotate-180' : ''} transition-transform`} />
              </button>
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

        {isAdvancedSearchOpen && (
          <div className="p-4 md:p-6 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
             <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">Livro</label>
                <select 
                  value={searchBook}
                  onChange={e => setSearchBook(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-serif outline-none"
                >
                  <option value="">Qualquer livro</option>
                  {ALL_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">Capítulo</label>
                <input 
                  type="number"
                  value={searchChapter}
                  onChange={e => setSearchChapter(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full px-4 py-2 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-serif outline-none"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">Versículo</label>
                <input 
                  type="number"
                  value={searchVerseNum}
                  onChange={e => setSearchVerseNum(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full px-4 py-2 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-serif outline-none"
                />
             </div>
             <div className="flex items-end">
                <button 
                  onClick={handleBibleSearch}
                  className="w-full py-2 bg-gold text-stone-900 rounded-xl font-black uppercase tracking-widest text-[8px] shadow-lg hover:bg-sacred hover:text-white transition-all"
                >
                  Investigar
                </button>
             </div>
          </div>
        )}
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

      {/* BOOK SELECTION OVERLAY (REPROJETADO) */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/98 backdrop-blur-2xl p-4 md:p-12 overflow-y-auto">
          <header className="max-w-6xl mx-auto flex items-center justify-between mb-6 md:mb-12">
            <div>
              <h2 className="text-3xl md:text-7xl font-serif font-bold text-gold tracking-tight">Cânon Sagrado</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500 mt-1">73 Livros da Tradição Católica</p>
            </div>
            <button onClick={() => setShowBookSelector(false)} className="p-4 bg-white/5 rounded-full hover:bg-sacred text-white transition-all active:scale-90">
              <Icons.Cross className="w-6 h-6 rotate-45" />
            </button>
          </header>

          <div className="max-w-6xl mx-auto space-y-6 md:space-y-12">
            {/* BARRA DE BUSCA GLOBAL */}
            <div className="relative group">
               <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/30 group-focus-within:text-gold transition-colors" />
               <input 
                 type="text" 
                 autoFocus
                 value={bookSearch}
                 onChange={e => setBookSearch(e.target.value)}
                 placeholder="Procure por Gênesis, João, Salmos..."
                 className="w-full pl-16 pr-8 py-5 md:py-8 bg-white/5 border-2 border-white/10 rounded-[2rem] md:rounded-[3rem] text-xl md:text-4xl font-serif italic text-white outline-none focus:border-gold transition-all"
               />
            </div>

            {/* ABAS DE TESTAMENTO (Apenas visíveis se não estiver buscando) */}
            {!bookSearch.trim() && (
              <div className="flex gap-4 md:gap-6 border-b border-white/5 pb-4 md:pb-10 overflow-x-auto no-scrollbar">
                 {['Antigo Testamento', 'Novo Testamento'].map(t => (
                   <button 
                    key={t} 
                    onClick={() => setActiveTestament(t as any)} 
                    className={`text-xs md:text-xl font-black uppercase tracking-widest transition-all whitespace-nowrap pb-2 border-b-2 ${activeTestament === t ? 'text-gold border-gold' : 'text-stone-600 border-transparent'}`}
                   >
                     {t}
                   </button>
                 ))}
              </div>
            )}

            {/* LISTAGEM DE LIVROS AGRUPADA */}
            <div className="space-y-16 pb-20">
               {Object.entries(globalFilteredCanon).map(([testamentName, categories]) => (
                 <div key={testamentName} className="space-y-10">
                    {bookSearch.trim() && (
                      <h3 className="text-xl md:text-3xl font-serif font-bold text-gold/60 border-l-4 border-gold/40 pl-4">{testamentName}</h3>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                      {Object.entries(categories as any).map(([cat, books]) => (
                        <div key={cat} className="space-y-4">
                           <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-stone-500 border-b border-white/5 pb-2">{cat}</h4>
                           <div className="flex flex-col gap-1 md:gap-2">
                              {(books as string[]).map(book => (
                                <button 
                                  key={book} 
                                  onClick={() => loadChapter(book, 1)} 
                                  className="text-left text-lg md:text-2xl font-serif italic text-stone-300 hover:text-gold hover:translate-x-2 transition-all duration-300 py-1"
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
               
               {Object.keys(globalFilteredCanon).length === 0 && (
                 <div className="text-center py-20">
                    <Icons.Search className="w-16 h-16 text-stone-700 mx-auto mb-4 opacity-20" />
                    <p className="text-xl font-serif italic text-stone-500">Nenhum livro encontrado para "{bookSearch}"</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER PICKER MODAL (MANTER IGUAL MAS COM AJUSTE DE Z-INDEX) */}
      {showChapterPicker && selectedBook && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowChapterPicker(false)}>
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl border border-stone-100 dark:border-stone-800 max-w-xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedBook}</h3>
               <button onClick={() => setShowChapterPicker(false)}><Icons.Cross className="w-5 h-5 rotate-45 text-stone-300" /></button>
             </div>
             <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
                {[...Array(150)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => loadChapter(selectedBook, i + 1)}
                    className={`h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all active:scale-90 ${selectedChapter === i + 1 ? 'bg-gold text-stone-900 shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold'}`}
                  >
                    {i + 1}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* COMMENTARY MODAL (MANTER IGUAL) */}
      {selectedVerseForCommentary && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedVerseForCommentary(null)}>
           <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-3xl border-t-[8px] border-gold relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedVerseForCommentary(null)} className="absolute top-6 right-6 text-stone-300 hover:text-sacred transition-colors"><Icons.Cross className="w-5 h-5 rotate-45" /></button>
              <div className="space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">{commentaryType === 'catena' ? 'Catena Aurea' : 'Meditatio'}</h4>
                 <h3 className="text-2xl md:text-4xl font-serif font-bold">{selectedVerseForCommentary.book} {selectedVerseForCommentary.chapter}:{selectedVerseForCommentary.verse}</h3>
                 <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-4">
                    {loadingCommentary ? <p className="animate-pulse">Buscando Luz...</p> : <p className="text-lg md:text-2xl font-serif italic leading-relaxed text-stone-700 dark:text-stone-200">{commentaryData.text}</p>}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Bible;
