
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Icons } from '../constants';
import { fetchRealBibleText, generateSpeech, fetchComparisonVerses, getDailyGospel, getCatenaAureaCommentary } from '../services/gemini';
import { fetchExternalBibleText } from '../services/bibleApi';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback, LATIN_BOOK_NAMES } from '../services/bibleLocal';
import { Verse, Language } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();

const LANG_NAMES: Record<Language, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  la: 'Latine',
  it: 'Italiano',
  fr: 'Français',
  de: 'Deutsch'
};

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [viewMode, setViewMode] = useState<'reading' | 'library'>('library');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [secondaryVerses, setSecondaryVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSecondary, setLoadingSecondary] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [secondaryVersion, setSecondaryVersion] = useState<BibleVersion>(BIBLE_VERSIONS[3]); // Vulgata como padrão paralelo
  
  const [isParallelMode, setIsParallelMode] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [contentLang, setContentLang] = useState<Language>(lang);
  const [selectingTarget, setSelectingTarget] = useState<'primary' | 'secondary'>('primary');
  
  const [bookSearch, setBookSearch] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const lastScrollY = useRef(0);
  const chapterRailRef = useRef<HTMLDivElement>(null);

  // Estados para áudio e estudo
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [playingVerseId, setPlayingVerseId] = useState<string | null>(null);
  const [lastChapters, setLastChapters] = useState<Record<string, number>>({});
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const chapterCount = useMemo(() => getChapterCount(selectedBook), [selectedBook]);

  // Lista linear de livros para navegação sequencial
  const allBooksList = useMemo(() => {
    const list: string[] = [];
    Object.values(CANON).forEach(testament => {
      Object.values(testament as any).forEach(books => {
        list.push(...(books as string[]));
      });
    });
    return list;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_last_chapters');
    if (saved) setLastChapters(JSON.parse(saved));
  }, []);

  const updateLastChapter = (book: string, chapter: number) => {
    const next = { ...lastChapters, [book]: chapter };
    setLastChapters(next);
    localStorage.setItem('cathedra_last_chapters', JSON.stringify(next));
  };

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setPlayingVerseId(null);
  }, []);

  const fetchVersesForVersion = async (version: BibleVersion, currentContentLang: Language) => {
    try {
      // 1. Tenta API Externa (Traduções Públicas)
      const apiData = await fetchExternalBibleText(selectedBook, selectedChapter, version.slug);
      if (apiData && apiData.length > 0) return apiData;
      
      // 2. Tenta IA (Traduções Específicas ou Idiomas Customizados)
      const aiData = await fetchRealBibleText(selectedBook, selectedChapter, version.name, currentContentLang);
      if (aiData && aiData.length > 0) return aiData;
      
      return fetchLocalFallback(selectedBook, selectedChapter);
    } catch (err) {
      return fetchLocalFallback(selectedBook, selectedChapter);
    }
  };

  const loadMainContent = useCallback(async () => {
    if (viewMode === 'library') return;
    setLoading(true);
    stopAudio();
    const data = await fetchVersesForVersion(selectedVersion, contentLang);
    setVerses(data);
    setLoading(false);
    updateLastChapter(selectedBook, selectedChapter);
  }, [selectedBook, selectedChapter, selectedVersion, contentLang, viewMode, stopAudio]);

  const loadSecondaryContent = useCallback(async () => {
    if (!isParallelMode || viewMode === 'library') return;
    setLoadingSecondary(true);
    const data = await fetchVersesForVersion(secondaryVersion, contentLang);
    setSecondaryVerses(data);
    setLoadingSecondary(false);
  }, [selectedBook, selectedChapter, secondaryVersion, contentLang, isParallelMode, viewMode]);

  useEffect(() => { loadMainContent(); }, [loadMainContent]);
  useEffect(() => { loadSecondaryContent(); }, [loadSecondaryContent]);

  // Lógica de Scroll e UI
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const winScroll = currentScrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? (winScroll / height) * 100 : 0);
      setIsScrollingUp(currentScrollY < lastScrollY.current || currentScrollY < 100);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNextChapter = () => {
    if (selectedChapter < chapterCount) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      const idx = allBooksList.indexOf(selectedBook);
      if (idx < allBooksList.length - 1) {
        setSelectedBook(allBooksList[idx + 1]);
        setSelectedChapter(1);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      const idx = allBooksList.indexOf(selectedBook);
      if (idx > 0) {
        const prevBook = allBooksList[idx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(getChapterCount(prevBook));
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(lastChapters[book] || 1);
    setViewMode('reading');
    setShowBookSelector(false);
    setBookSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayVerse = async (v: Verse, id: string) => {
    if (playingVerseId === id) { stopAudio(); return; }
    stopAudio();
    setPlayingVerseId(id);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const base64Data = await generateSpeech(v.text);
      if (base64Data) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Data), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => { setPlayingVerseId(null); audioSourceRef.current = null; };
        audioSourceRef.current = source;
        source.start(0);
      } else { setPlayingVerseId(null); }
    } catch (err) { setPlayingVerseId(null); }
  };

  const isVulgataMode = selectedVersion.isLatin || contentLang === 'la';

  // Sub-componente: Visão da Biblioteca (Grid de Livros)
  const LibraryView = () => (
    <div className="space-y-16 animate-in fade-in duration-700 pt-10">
      <header className="text-center space-y-6 max-w-4xl mx-auto">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Scriptuarium</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl">O Cânon Completo das Sagradas Escrituras</p>
        <div className="relative group max-w-xl mx-auto mt-10">
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/40" />
          <input 
            type="text" 
            placeholder="Pesquisar livro (ex: João, Salmos, Ioannis)..."
            value={bookSearch}
            onChange={e => setBookSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-xl text-stone-800 dark:text-white font-serif italic text-xl outline-none focus:border-gold/50 transition-all"
          />
        </div>
      </header>

      <div className="space-y-20">
        {Object.entries(CANON).map(([testament, categories]) => {
          const hasMatchesInTestament = Object.values(categories as any).some((books: any) => 
            books.some((b: string) => b.toLowerCase().includes(bookSearch.toLowerCase()) || (LATIN_BOOK_NAMES[b] && LATIN_BOOK_NAMES[b].toLowerCase().includes(bookSearch.toLowerCase())))
          );
          if (bookSearch && !hasMatchesInTestament) return null;

          return (
            <section key={testament} className="space-y-12">
              <div className="flex items-center gap-6">
                <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{testament}</h3>
                <div className="h-px flex-1 bg-gold/20" />
              </div>
              <div className="grid gap-12">
                {Object.entries(categories as any).map(([category, books]) => {
                  const filteredBooks = (books as string[]).filter(b => 
                    b.toLowerCase().includes(bookSearch.toLowerCase()) || 
                    (LATIN_BOOK_NAMES[b] && LATIN_BOOK_NAMES[b].toLowerCase().includes(bookSearch.toLowerCase()))
                  );
                  if (filteredBooks.length === 0) return null;

                  return (
                    <div key={category} className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-sacred" />
                        {category}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredBooks.map(book => (
                          <button 
                            key={book}
                            onClick={() => handleSelectBook(book)}
                            className="p-6 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-md hover:border-gold hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                          >
                            <span className="text-[9px] font-black uppercase text-stone-300 group-hover:text-gold block mb-2">{lastChapters[book] ? `Cap. ${lastChapters[book]}` : 'Librum'}</span>
                            <h5 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 group-hover:text-gold">{book}</h5>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`max-w-7xl mx-auto pb-48 space-y-4 page-enter relative px-2 md:px-4 transition-all duration-1000 ${isVulgataMode ? 'vulgata-theme' : ''}`}>
      
      {/* Barra de Progresso Superior */}
      {viewMode === 'reading' && (
        <div className="fixed top-0 left-0 w-full h-1.5 z-[200] bg-stone-100 dark:bg-stone-950 overflow-hidden">
          <div className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)] transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}

      {/* Navegação Flutuante Mobile */}
      {viewMode === 'reading' && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[160] flex items-center gap-1 bg-[#1a1917]/95 backdrop-blur-3xl px-2 py-2 rounded-full border border-white/10 shadow-3xl lg:hidden transition-transform duration-500 ${isScrollingUp ? 'translate-y-0' : 'translate-y-32'}`}>
            <button onClick={handlePrevChapter} className="p-3 text-gold/60 hover:text-gold"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <button onClick={() => setViewMode('library')} className="px-4 py-2 text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
              <Icons.Book className="w-3 h-3 text-gold" />
              {selectedBook}
            </button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <button onClick={handleNextChapter} className="p-3 text-gold/60 hover:text-gold"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
        </div>
      )}

      {/* Header de Estudo */}
      {viewMode === 'reading' && (
        <nav className={`sticky top-4 z-[140] bg-[#1a1917]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-3xl overflow-hidden ring-1 ring-white/10 transition-all duration-500 ${isScrollingUp ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button onClick={() => setViewMode('library')} className="p-3 bg-white/5 hover:bg-gold hover:text-stone-900 rounded-xl transition-all text-gold group" title="Voltar para Scriptuarium">
                  <Icons.ArrowDown className="w-5 h-5 rotate-90" />
                </button>
                
                <div className="flex items-center bg-stone-900 rounded-2xl border border-white/10 p-1">
                    <button onClick={() => setShowBookSelector(true)} className="flex items-center gap-3 px-4 md:px-6 py-2 hover:bg-white/5 rounded-xl transition-all group">
                      <Icons.Book className="w-4 h-4 text-gold" />
                      <span className="font-serif font-bold text-sm md:text-base text-white group-hover:text-gold">
                        {isVulgataMode ? LATIN_BOOK_NAMES[selectedBook] || selectedBook : selectedBook}
                      </span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button onClick={() => setShowChapterSelector(true)} className="flex items-center gap-2 px-4 md:px-6 py-2 hover:bg-white/5 rounded-xl transition-all group">
                      <span className="text-[10px] font-black uppercase text-stone-500">Cap.</span>
                      <span className="font-serif font-bold text-lg text-gold">{selectedChapter}</span>
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => { setSelectingTarget('primary'); setShowVersionSelector(true); }} className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${isParallelMode ? 'bg-stone-800/50 border-gold/40 text-gold' : 'bg-stone-800/30 border-white/5 text-stone-400'}`}>
                      {selectedVersion.name}
                    </button>
                    {isParallelMode && (
                      <button onClick={() => { setSelectingTarget('secondary'); setShowVersionSelector(true); }} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-sacred/20 border border-sacred/40 text-white text-[10px] font-black uppercase tracking-widest">
                        {secondaryVersion.name}
                      </button>
                    )}
                    <button onClick={() => setShowLanguageModal(true)} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-stone-800/50 border border-white/5 text-gold text-[10px] font-black uppercase tracking-widest hover:bg-gold/10 transition-all">
                      <Icons.Globe className="w-3 h-3" />
                      {contentLang.toUpperCase()}
                    </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={() => setIsParallelMode(!isParallelMode)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border ${isParallelMode ? 'bg-gold text-stone-900 border-gold' : 'bg-stone-800/50 border-white/5 text-stone-400 hover:text-white'}`}>
                    <Icons.Layout className="w-4 h-4" />
                    {isParallelMode ? 'Sinótico' : 'Estudo'}
                </button>
                <div className="flex bg-stone-900/50 p-1 rounded-2xl border border-white/5">
                    <button onClick={handlePrevChapter} className="p-3 text-stone-500 hover:text-gold transition-colors"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
                    <div className="w-px h-6 bg-white/5 self-center" />
                    <button onClick={handleNextChapter} className="p-3 text-stone-500 hover:text-gold transition-colors"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/20 border-t border-white/5 px-4 py-3">
             <div ref={chapterRailRef} className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-2">
                {Array.from({ length: chapterCount }).map((_, i) => {
                  const ch = i + 1;
                  const isSelected = selectedChapter === ch;
                  return (
                    <button key={ch} onClick={() => setSelectedChapter(ch)} className={`flex-shrink-0 min-w-[44px] h-11 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative group/btn ${isSelected ? 'bg-gold text-stone-900 shadow-xl scale-110' : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10'}`}>
                      <span className="font-serif font-black text-sm">{ch}</span>
                    </button>
                  );
                })}
             </div>
          </div>
        </nav>
      )}

      {/* Conteúdo Principal */}
      <main className="relative">
        {viewMode === 'library' ? <LibraryView /> : (
          <div className="space-y-12 mt-8">
            <div className={`grid gap-4 md:gap-8 transition-all duration-700 ${isParallelMode ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              <section className={`bg-white dark:bg-[#1a1917] p-6 md:p-16 rounded-[3rem] shadow-3xl border border-stone-100 dark:border-white/5 relative overflow-hidden ${loading ? 'animate-pulse' : ''}`}>
                 <header className="mb-12 border-b border-stone-100 dark:border-white/5 pb-8 flex justify-between items-center">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">{selectedVersion.name} • {contentLang.toUpperCase()}</span>
                       <h2 className="text-3xl md:text-5xl font-serif font-bold dark:text-stone-100 mt-1">{isVulgataMode ? LATIN_BOOK_NAMES[selectedBook] || selectedBook : selectedBook} {selectedChapter}</h2>
                    </div>
                 </header>
                 <div className="space-y-10">
                    {verses.map((v, i) => {
                      const id = `v1_${v.verse}`;
                      const isSelected = selectedVerseKey === id;
                      return (
                        <div key={i} onClick={() => setSelectedVerseKey(isSelected ? null : id)} className={`group relative border-b border-stone-50 dark:border-white/5 pb-8 last:border-0 cursor-pointer transition-all duration-300 ${isSelected ? 'bg-stone-50/50 dark:bg-white/5 rounded-3xl p-4 md:-mx-8 md:px-8' : ''}`}>
                           <div className="flex gap-4 md:gap-6 items-start">
                              <span className={`text-[10px] font-serif font-black transition-colors ${isSelected ? 'text-gold' : 'text-stone-300 dark:text-stone-700'}`}>{v.verse}</span>
                              <div className="flex-1 space-y-4">
                                 <p className={`font-serif leading-relaxed transition-all duration-500 ${isSelected ? 'text-stone-900 dark:text-white font-medium' : 'text-stone-800 dark:text-stone-200'} ${isParallelMode ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'}`}>
                                    {v.text}
                                 </p>
                                 {isSelected && (
                                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                                        <button onClick={(e) => { e.stopPropagation(); handlePlayVerse(v, id); }} className={`p-3 rounded-xl transition-all flex items-center gap-2 ${playingVerseId === id ? 'bg-sacred text-white' : 'bg-gold/10 text-gold'}`}>
                                          {playingVerseId === id ? <Icons.Stop className="w-4 h-4" /> : <Icons.Audio className="w-4 h-4" />}
                                          <span className="text-[9px] font-black uppercase tracking-widest">Escutar</span>
                                        </button>
                                        <ActionButtons itemId={`v_${v.book}_${v.chapter}_${v.verse}`} type="verse" title={`${v.book} ${v.chapter}:${v.verse}`} content={v.text} className="bg-stone-50 dark:bg-stone-800 rounded-xl" />
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </section>

              {isParallelMode && (
                <section className={`bg-[#fdfcf8] dark:bg-[#121211] p-6 md:p-16 rounded-[3rem] shadow-3xl border border-sacred/10 animate-in slide-in-from-right-8 duration-700 ${loadingSecondary ? 'animate-pulse' : ''}`}>
                   <header className="mb-12 border-b border-sacred/10 pb-8">
                      <span className="text-[10px] font-black uppercase tracking-widest text-sacred opacity-80">{secondaryVersion.name} • {contentLang.toUpperCase()}</span>
                      <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-300 mt-1">Comparatio</h2>
                   </header>
                   <div className="space-y-10">
                      {secondaryVerses.map((v, i) => (
                        <div key={i} className="group relative border-b border-sacred/5 pb-8 last:border-0">
                           <div className="flex gap-4 md:gap-6 items-start">
                              <span className="text-[10px] font-serif font-black text-sacred/30">{v.verse}</span>
                              <p className="font-serif italic leading-relaxed text-xl md:text-2xl text-stone-700 dark:text-stone-400">{v.text}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
              )}
            </div>

            <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-6">
              <button onClick={handlePrevChapter} className="group px-10 py-6 bg-stone-100 dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 transition-all hover:border-gold hover:shadow-xl text-left active:scale-95">
                <div className="flex items-center gap-4">
                  <Icons.ArrowDown className="w-5 h-5 rotate-90 text-stone-400 group-hover:text-gold" />
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Caput Prius</span>
                    <h4 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-200">Capítulo Anterior</h4>
                  </div>
                </div>
              </button>
              <button onClick={handleNextChapter} className="group px-16 py-8 bg-gold rounded-[3rem] border border-gold transition-all hover:bg-yellow-400 hover:scale-105 hover:shadow-2xl text-left shadow-lg active:scale-95">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900/60">Sequens Caput</span>
                    <h4 className="text-2xl font-serif font-bold text-stone-900">Próximo Capítulo</h4>
                  </div>
                  <Icons.ArrowDown className="w-6 h-6 -rotate-90 text-stone-900" />
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE SELEÇÃO DE IDIOMA DO CONTEÚDO */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowLanguageModal(false)}>
           <div className="bg-stone-900 w-full max-w-md rounded-[3rem] border border-white/10 overflow-hidden animate-modal-zoom shadow-4xl" onClick={e => e.stopPropagation()}>
              <header className="p-8 border-b border-white/5 bg-black/20">
                 <h3 className="text-2xl font-serif font-bold text-gold">Idioma do Texto</h3>
                 <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Escolha a língua das passagens</p>
              </header>
              <div className="p-6 grid gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {(Object.keys(LANG_NAMES) as Language[]).map(l => (
                   <button key={l} onClick={() => { setContentLang(l); setShowLanguageModal(false); }} className={`p-5 rounded-2xl text-left border transition-all flex items-center justify-between group ${contentLang === l ? 'bg-gold text-stone-900 border-gold shadow-lg' : 'bg-white/5 border-white/5 text-white/60 hover:border-gold/40'}`}>
                      <span className="font-serif font-bold text-lg">{LANG_NAMES[l]}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{l}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* SELETOR DE VERSÕES MODAL */}
      {showVersionSelector && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowVersionSelector(false)}>
           <div className="bg-stone-900 w-full max-w-xl rounded-[3rem] border border-white/10 overflow-hidden animate-modal-zoom shadow-4xl" onClick={e => e.stopPropagation()}>
              <header className="p-8 border-b border-white/5 bg-black/20 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-serif font-bold text-gold">Escolher Versão</h3>
                    <p className="text-[9px] font-black uppercase text-stone-500 mt-1">Selecionando para {selectingTarget === 'primary' ? 'Coluna Principal' : 'Coluna Comparativa'}</p>
                 </div>
                 <button onClick={() => setShowVersionSelector(false)} className="p-2 text-stone-500 hover:text-white"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
              </header>
              <div className="p-6 grid gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {BIBLE_VERSIONS.map(v => (
                   <button key={v.id} onClick={() => { if (selectingTarget === 'primary') setSelectedVersion(v); else setSecondaryVersion(v); setShowVersionSelector(false); }} className={`p-6 rounded-2xl text-left border transition-all flex items-center justify-between group ${(selectingTarget === 'primary' ? selectedVersion.id : secondaryVersion.id) === v.id ? 'bg-gold text-stone-900 border-gold shadow-lg' : 'bg-white/5 border-white/5 text-stone-400 hover:border-gold'}`}>
                      <div className="space-y-1">
                         <p className="font-serif font-bold text-lg">{v.name}</p>
                         <p className="text-[10px] opacity-60 uppercase tracking-widest">{v.description}</p>
                      </div>
                      {v.isIA && <Icons.Feather className="w-4 h-4 text-gold group-hover:text-stone-900" />}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* SELETOR DE CAPÍTULOS RÁPIDO */}
      {showChapterSelector && (
         <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4" onClick={() => setShowChapterSelector(false)}>
            <div className="bg-[#0c0a09] w-full max-w-4xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-12 border-b border-white/5 bg-stone-900/50 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold opacity-50">Escolher Caput</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">{selectedBook}</h2>
                  </div>
                  <button onClick={() => setShowChapterSelector(false)} className="p-4 hover:bg-white/5 rounded-full text-stone-500 transition-colors"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
               </header>
               <div className="p-12 overflow-y-auto custom-scrollbar grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {Array.from({ length: chapterCount }).map((_, i) => (
                    <button key={i} onClick={() => { setSelectedChapter(i + 1); setShowChapterSelector(false); }} className={`aspect-square rounded-2xl font-serif font-bold text-xl flex items-center justify-center transition-all border ${selectedChapter === i + 1 ? 'bg-gold text-stone-900 border-gold shadow-xl scale-110' : 'bg-stone-900/50 border-white/5 text-stone-400 hover:border-gold/40'}`}>
                      {i + 1}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* SELETOR DE LIVROS MODAL (PARA MODO LEITURA) */}
      {showBookSelector && (
         <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8" onClick={() => setShowBookSelector(false)}>
            <div className="bg-[#0c0a09] w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-stone-900/50 gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-gold tracking-tight">Scriptuarium</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Navegação Canônica</p>
                  </div>
                  <div className="relative flex-1 max-w-xl">
                     <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold/40 w-6 h-6" />
                     <input type="text" placeholder="Buscar por livro ou gênero..." value={bookSearch} autoFocus onChange={e => setBookSearch(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] outline-none text-white focus:border-gold transition-all font-serif italic text-xl shadow-inner" />
                  </div>
                  <button onClick={() => setShowBookSelector(false)} className="p-4 hover:bg-white/5 rounded-full text-stone-500 transition-colors"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
               </header>
               <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar space-y-16">
                  {Object.entries(CANON).map(([testament, categories]) => {
                    const searchLower = bookSearch.toLowerCase();
                    const testamentHasMatches = Object.values(categories as any).some((books: any) => 
                      books.some((b: string) => b.toLowerCase().includes(searchLower) || (LATIN_BOOK_NAMES[b] && LATIN_BOOK_NAMES[b].toLowerCase().includes(searchLower)))
                    );
                    if (bookSearch && !testamentHasMatches) return null;

                    return (
                      <section key={testament} className="space-y-10">
                         <div className="flex items-center gap-6">
                            <h3 className="text-2xl md:text-4xl font-serif font-bold text-gold/50">{testament}</h3>
                            <div className="h-px flex-1 bg-white/5" />
                         </div>
                         <div className="grid gap-12">
                            {Object.entries(categories as any).map(([category, books]) => {
                              const filteredBooks = (books as string[]).filter(b => 
                                b.toLowerCase().includes(searchLower) || 
                                (LATIN_BOOK_NAMES[b] && LATIN_BOOK_NAMES[b].toLowerCase().includes(searchLower))
                              );
                              if (filteredBooks.length === 0) return null;
                              return (
                                <div key={category} className="space-y-6">
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-sacred flex items-center gap-3">
                                     <div className="w-1.5 h-1.5 rounded-full bg-sacred" />
                                     {category}
                                   </h4>
                                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                      {filteredBooks.map(b => (
                                        <button key={b} onClick={() => handleSelectBook(b)} className={`p-5 rounded-2xl font-serif font-bold text-base md:text-lg text-left border transition-all relative overflow-hidden group ${selectedBook === b ? 'bg-gold text-stone-900 border-gold shadow-lg scale-105 z-10' : 'bg-stone-900/50 border-white/5 text-stone-400 hover:border-gold/40 hover:text-white'}`}>
                                          <span className="relative z-10">{b}</span>
                                          {selectedBook === b && <Icons.Star className="absolute top-2 right-2 w-3 h-3 fill-current" />}
                                        </button>
                                      ))}
                                   </div>
                                </div>
                              );
                            })}
                         </div>
                      </section>
                    );
                  })}
               </div>
            </div>
         </div>
      )}

      <style>{`
        .vulgata-theme { background-color: #fdfcf8 !important; }
        .vulgata-theme h2 { color: #8b0000 !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Bible;
