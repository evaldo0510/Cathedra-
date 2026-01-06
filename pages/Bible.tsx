
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getCatenaAureaCommentary } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
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
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [expandedCommentary, setExpandedCommentary] = useState<string | null>(null);
  const [inlineCommentaryData, setInlineCommentaryData] = useState<Record<string, { content: string, fathers: string[], loading: boolean }>>({});

  const scrollStripRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Filtro de Busca de Livros Otimizado
  const filteredCanon = useMemo(() => {
    const term = bookSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!term) return CANON;

    const newCanon: any = { "Antigo Testamento": {}, "Novo Testamento": {} };
    Object.entries(CANON).forEach(([testament, categories]) => {
      Object.entries(categories).forEach(([category, books]) => {
        const filtered = books.filter(b => 
          b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term)
        );
        if (filtered.length > 0) newCanon[testament][category] = filtered;
      });
    });
    return newCanon;
  }, [bookSearch]);

  const loadChapter = useCallback(async (book: string, chapter: number, version: BibleVersion = selectedVersion) => {
    if (chapter < 1) return;
    setLoading(true);
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setShowChapterPicker(false);
    setShowVersionPicker(false);
    setSearchResults([]);
    setExpandedCommentary(null);
    setVerses([]);
    setBookSearch('');
    
    // Parar áudio se mudar de capítulo ou versão
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsReading(null);
    }
    
    localStorage.setItem('cathedra_last_read', JSON.stringify({ book, chapter, versionId: version.id }));

    try {
      const data = await fetchLocalChapter(version.id, book, chapter);
      setVerses(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (scrollStripRef.current) {
        const activeBtn = scrollStripRef.current.querySelector(`[data-chapter="${chapter}"]`);
        if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion]);

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
  }, []);

  const changeVersion = (version: BibleVersion) => {
    setSelectedVersion(version);
    if (selectedBook && selectedChapter) {
      loadChapter(selectedBook, selectedChapter, version);
    } else {
      setShowVersionPicker(false);
    }
  };

  const handleBibleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await searchVerse(query, undefined, undefined, undefined, lang);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const toggleSpeech = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    if (isReading === vid) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
      setIsReading(null);
      return;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsReading(vid);
    try {
      const base64Audio = await generateSpeech(`${verse.book} ${verse.chapter}:${verse.verse}. ${verse.text}`);
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsReading(current => current === vid ? null : current);
      };
      source.start();
      audioSourceRef.current = source;
    } catch (err) { 
      setIsReading(null); 
    }
  };

  const VerseItem = ({ v, isSearch = false }: { v: Verse, isSearch?: boolean, key?: any }) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    const isExpanded = expandedCommentary === vid;
    const isThisVerseReading = isReading === vid;
    const commentary = inlineCommentaryData[vid];

    return (
      <div className="space-y-4">
        <article className={`p-6 md:p-10 rounded-[2.5rem] border-l-[12px] shadow-lg bg-white dark:bg-stone-900 transition-all duration-500 ${isThisVerseReading ? 'border-gold bg-gold/5 scale-[1.01]' : isSearch ? 'border-gold/30' : 'border-stone-100 dark:border-stone-800'}`}>
           <div className="flex justify-between items-center mb-6">
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isThisVerseReading ? 'text-gold' : 'text-stone-400'}`}>
                {v.book} {v.chapter}:{v.verse}
              </span>
              <div className="flex gap-2">
                 <button onClick={() => toggleInlineCommentary(v)} className={`p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-sacred text-white shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:bg-gold/10 hover:text-gold'}`} title="Comentário Patrístico">
                   <Icons.Book className="w-5 h-5" />
                 </button>
                 <button onClick={() => toggleSpeech(v)} className={`p-2.5 rounded-xl transition-all relative ${isThisVerseReading ? 'bg-gold text-stone-900 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:bg-gold/10 hover:text-gold'}`} title={isThisVerseReading ? "Parar Leitura" : "Ouvir Versículo"}>
                   {isThisVerseReading ? (
                     <><div className="absolute inset-0 bg-gold rounded-xl animate-ping opacity-20" /><Icons.Stop className="w-5 h-5 relative z-10" /></>
                   ) : (
                     <Icons.Audio className="w-5 h-5" />
                   )}
                 </button>
                 <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} />
              </div>
           </div>
           <p className={`text-xl md:text-3xl font-serif italic leading-relaxed transition-colors duration-500 ${isThisVerseReading ? 'text-stone-900 dark:text-gold' : 'text-stone-800 dark:text-stone-100'}`}>
             "{v.text}"
           </p>
        </article>
        {isExpanded && (
          <div className="mx-6 p-8 bg-[#fcf8e8] dark:bg-stone-950 rounded-[2rem] border border-gold/20 shadow-inner animate-in slide-in-from-top-2">
             {commentary?.loading ? (
               <div className="flex items-center gap-4 animate-pulse"><div className="w-4 h-4 bg-gold rounded-full" /><p className="text-[10px] font-black uppercase tracking-widest text-gold/60">Consultando a Tradição...</p></div>
             ) : (
               <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gold">Tesouro Patrístico</p>
                  <p className="text-lg md:text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">{commentary?.content}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {commentary?.fathers.map(f => (<span key={f} className="px-3 py-1 bg-white dark:bg-stone-800 text-[8px] font-black uppercase tracking-widest text-gold rounded-lg border border-gold/10">{f}</span>))}
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-6 page-enter px-2 md:px-0">
      
      {/* NAVBAR DE NAVEGAÇÃO REFINADA */}
      <nav className="sticky top-0 z-[140] bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border border-stone-100 dark:border-stone-800 p-4 rounded-[2.5rem] shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Botão de Seleção de Versão */}
            <button 
              onClick={() => setShowVersionPicker(true)}
              className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-gold/60 px-4 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-gold transition-all"
            >
              <Icons.Globe className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedVersion.name}</span>
            </button>

            <button 
              onClick={() => setShowBookSelector(true)} 
              className="flex items-center gap-3 bg-[#1a1a1a] text-gold px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-800 transition-all active:scale-95 flex-1 md:flex-none"
            >
              <Icons.Book className="w-5 h-5" />
              <span className="font-serif font-bold text-xl truncate">{selectedBook || 'Selecionar Livro'}</span>
              <Icons.ArrowDown className="w-3 h-3 opacity-30" />
            </button>
            
            <div className="flex items-center gap-1">
              <button onClick={() => selectedBook && selectedChapter && loadChapter(selectedBook, selectedChapter - 1)} disabled={selectedChapter === 1} className="p-3 bg-stone-50 dark:bg-stone-900 text-gold rounded-xl disabled:opacity-20"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
              <button onClick={() => setShowChapterPicker(true)} className="px-5 py-3 bg-[#fcf8e8] dark:bg-stone-900 border border-gold/20 rounded-xl font-serif font-bold text-xl text-stone-800 dark:text-gold">{selectedChapter}</button>
              <button onClick={() => selectedBook && selectedChapter && loadChapter(selectedBook, selectedChapter + 1)} className="p-3 bg-stone-50 dark:bg-stone-900 text-gold rounded-xl"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
            </div>
          </div>

          <form onSubmit={handleBibleSearch} className="relative flex-1 w-full">
             <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
             <input 
               type="text" 
               value={query} 
               onChange={e => setQuery(e.target.value)} 
               placeholder="Busca avançada na Escritura..." 
               className="w-full pl-10 pr-4 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl outline-none font-serif italic text-lg dark:text-white" 
             />
          </form>
        </div>

        {selectedBook && (
          <div ref={scrollStripRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-1 border-t border-stone-50 dark:border-stone-900 pt-3">
             {[...Array(150)].map((_, i) => {
               const c = i + 1;
               const active = selectedChapter === c;
               return (
                 <button 
                  key={i} 
                  data-chapter={c}
                  onClick={() => loadChapter(selectedBook, c)}
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-serif text-lg transition-all border ${active ? 'bg-gold text-stone-900 border-gold shadow-lg font-bold scale-110' : 'bg-transparent text-stone-400 border-stone-100 dark:border-stone-800 hover:border-gold/30'}`}
                 >
                   {c}
                 </button>
               );
             })}
          </div>
        )}
      </nav>

      {/* RESULTADOS / VERSÍCULOS */}
      <main className="space-y-6">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-40 bg-stone-50 dark:bg-stone-900 rounded-[2.5rem]" />)}
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((v, i) => <VerseItem key={i} v={v} isSearch />)
        ) : (
          verses.map((v, i) => <VerseItem key={i} v={v} />)
        )}
      </main>

      {/* OMNI-SELECTOR DE LIVROS */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500 overflow-hidden">
          <header className="p-8 md:p-12 flex justify-between items-center flex-shrink-0">
             <div>
               <h2 className="text-4xl md:text-6xl font-serif font-bold text-gold tracking-tight">Cânon Sagrado</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mt-2">Navegação Teológica Profissional</p>
             </div>
             <button onClick={() => setShowBookSelector(false)} className="p-4 bg-white/5 rounded-full hover:bg-sacred text-white transition-all"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
          </header>

          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col p-6 md:p-12 pt-0 overflow-hidden">
             <div className="relative mb-10 flex-shrink-0">
                <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-gold/20" />
                <input 
                  type="text" 
                  autoFocus 
                  value={bookSearch} 
                  onChange={e => setBookSearch(e.target.value)} 
                  placeholder="Pesquisar por nome ou abreviação..." 
                  className="w-full pl-20 pr-8 py-8 bg-white/5 border-2 border-white/10 rounded-[2.5rem] text-2xl md:text-4xl font-serif italic text-white outline-none focus:border-gold transition-all" 
                />
             </div>

             {!bookSearch && (
               <div className="flex gap-10 border-b border-white/10 mb-10 flex-shrink-0">
                  {['Antigo Testamento', 'Novo Testamento'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setActiveTestament(t as any)} 
                      className={`text-sm md:text-2xl font-black uppercase tracking-[0.3em] pb-6 border-b-4 transition-all ${activeTestament === t ? 'text-gold border-gold' : 'text-stone-600 border-transparent'}`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
             )}

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-20">
                <div className="space-y-16">
                   {Object.entries(filteredCanon).map(([testament, categories]: [string, any]) => {
                     if (!bookSearch && testament !== activeTestament) return null;
                     if (Object.keys(categories).length === 0) return null;
                     
                     return (
                       <div key={testament} className="space-y-12 animate-in slide-in-from-bottom-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                             {Object.entries(categories).map(([catName, books]: [string, any]) => (
                               <div key={catName} className="space-y-6">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-500 border-l-2 border-gold/40 pl-4">{catName}</h4>
                                  <div className="flex flex-col gap-2">
                                     {books.map((book: string) => (
                                       <button 
                                        key={book} 
                                        onClick={() => loadChapter(book, 1)} 
                                        className="text-left px-6 py-4 rounded-2xl bg-white/5 hover:bg-gold text-stone-300 hover:text-stone-900 font-serif italic text-xl transition-all flex justify-between items-center group"
                                       >
                                          <span>{book}</span>
                                          <Icons.ArrowDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
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

      {/* SELETOR DE CAPÍTULOS */}
      {showChapterPicker && selectedBook && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowChapterPicker(false)}>
          <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[3.5rem] shadow-3xl border border-gold/10 max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gold">Capítulo</p>
                   <h3 className="text-3xl font-serif font-bold">{selectedBook}</h3>
                </div>
                <button onClick={() => setShowChapterPicker(false)} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
             </div>
             <div className="grid grid-cols-5 md:grid-cols-8 gap-3 overflow-y-auto custom-scrollbar pr-2 pb-6">
                {[...Array(150)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => loadChapter(selectedBook, i + 1)} 
                    className={`h-14 md:h-16 rounded-2xl flex items-center justify-center font-serif text-xl border transition-all ${selectedChapter === i+1 ? 'bg-gold text-stone-900 border-gold shadow-lg font-bold' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-transparent hover:border-gold/30'}`}
                  >
                    {i + 1}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* SELETOR DE VERSÕES (TRADITIONES) */}
      {showVersionPicker && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowVersionPicker(false)}>
          <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[3.5rem] shadow-3xl border border-gold/10 max-w-2xl w-full animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gold">Versão da Escritura</p>
                   <h3 className="text-3xl font-serif font-bold">Traditiones</h3>
                </div>
                <button onClick={() => setShowVersionPicker(false)} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
             </div>
             
             <div className="grid gap-4">
                {BIBLE_VERSIONS.map(v => (
                  <button 
                    key={v.id}
                    onClick={() => changeVersion(v)}
                    className={`text-left p-6 rounded-3xl border transition-all flex flex-col gap-2 ${selectedVersion.id === v.id ? 'bg-gold/10 border-gold shadow-lg' : 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 hover:border-gold/30'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-serif font-bold text-2xl ${selectedVersion.id === v.id ? 'text-stone-900 dark:text-gold' : 'text-stone-700 dark:text-stone-100'}`}>{v.name}</span>
                      {selectedVersion.id === v.id && <div className="w-3 h-3 bg-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,1)]" />}
                    </div>
                    <p className="text-sm font-serif italic text-stone-400 leading-snug">{v.description}</p>
                  </button>
                ))}
             </div>

             <footer className="mt-8 pt-8 border-t border-stone-50 dark:border-stone-800">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 text-center italic">"Verbum Domini Manet In Aeternum"</p>
             </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bible;
