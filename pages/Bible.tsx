
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icons, Logo } from '../constants';
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
  
  // Wallpaper State
  const [wallpaperVerse, setWallpaperVerse] = useState<Verse | null>(null);
  const [wallpaperTheme, setWallpaperTheme] = useState<'light' | 'dark'>('light');
  const wallpaperCanvasRef = useRef<HTMLCanvasElement>(null);

  // Navigation UI State
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollStripRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Monitoramento de Progresso de Leitura
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      setScrollProgress((window.scrollY / totalHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filtro de Busca de Livros
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
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsReading(null);
    }
    
    localStorage.setItem('cathedra_last_read', JSON.stringify({ book, chapter, versionId: version.id }));

    try {
      const data = await fetchLocalChapter(version.id, book, chapter);
      setVerses(data);
      window.scrollTo({ top: 0, behavior: 'auto' });
      
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

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedBook || !selectedChapter || loading || showBookSelector || showChapterPicker) return;
      if (e.key === 'ArrowLeft' && selectedChapter > 1) {
        loadChapter(selectedBook, selectedChapter - 1);
      } else if (e.key === 'ArrowRight') {
        loadChapter(selectedBook, selectedChapter + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBook, selectedChapter, loading, showBookSelector, showChapterPicker, loadChapter]);

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

  const changeVersion = (version: BibleVersion) => {
    setSelectedVersion(version);
    if (selectedBook && selectedChapter) {
      loadChapter(selectedBook, selectedChapter, version);
    } else {
      setShowVersionPicker(false);
    }
  };

  const drawWallpaper = useCallback(() => {
    const canvas = wallpaperCanvasRef.current;
    if (!canvas || !wallpaperVerse) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920;

    const isDark = wallpaperTheme === 'dark';

    // Background
    ctx.fillStyle = isDark ? '#0c0a09' : '#fdfcf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Textures
    ctx.globalAlpha = isDark ? 0.03 : 0.05;
    ctx.fillStyle = '#d4af37';
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Borders
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 20;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    ctx.lineWidth = 2;
    ctx.strokeRect(75, 75, canvas.width - 150, canvas.height - 150);

    // Header Branding
    ctx.fillStyle = '#d4af37';
    ctx.font = '900 35px Inter';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '18px';
    ctx.fillText('CATHEDRA DIGITAL', canvas.width / 2, 200);

    // Logo Icon
    ctx.font = '50px serif';
    ctx.fillText('☦', canvas.width / 2, 280);

    // Dynamic Font Sizing for "Complete" verses
    const text = `"${wallpaperVerse.text}"`;
    let fontSize = 75;
    if (text.length > 200) fontSize = 55;
    else if (text.length > 150) fontSize = 65;

    ctx.fillStyle = isDark ? '#fdfcf8' : '#1a1a1a';
    ctx.font = `italic ${fontSize}px serif`;
    ctx.textAlign = 'center';
    
    const words = text.split(' ');
    let line = '';
    let y = 650;
    const maxWidth = 850;
    const lineHeight = fontSize * 1.35;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // Bottom Reference
    ctx.fillStyle = '#8b0000';
    ctx.font = 'bold 55px serif';
    ctx.letterSpacing = '5px';
    ctx.fillText(`${wallpaperVerse.book.toUpperCase()} ${wallpaperVerse.chapter}:${wallpaperVerse.verse}`, canvas.width / 2, canvas.height - 250);

    // Footer Motto
    ctx.fillStyle = '#d4af37';
    ctx.font = '30px serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('VERBUM DOMINI', canvas.width / 2, canvas.height - 180);
  }, [wallpaperVerse, wallpaperTheme]);

  useEffect(() => {
    if (wallpaperVerse) drawWallpaper();
  }, [wallpaperVerse, wallpaperTheme, drawWallpaper]);

  // Fix for Error in file pages/Bible.tsx on line 244: Cannot find name 'toggleSpeech'.
  const toggleSpeech = async (v: Verse) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    
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
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const base64 = await generateSpeech(v.text);
      if (base64) {
        const audioData = decodeBase64(base64);
        const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsReading(null);
          audioSourceRef.current = null;
        };
        audioSourceRef.current = source;
        source.start(0);
      } else {
        setIsReading(null);
      }
    } catch (err) {
      console.error("Speech error:", err);
      setIsReading(null);
    }
  };

  // Fix for Error in file pages/Bible.tsx on line 303: Type '{ key: any; v: any; }' is not assignable to type '{ v: Verse; isSearch?: boolean; }'.
  // Property 'key' does not exist on type '{ v: Verse; isSearch?: boolean; }'.
  // Added key prop to VerseItem interface to satisfy TypeScript when defined locally.
  const VerseItem = ({ v, isSearch = false }: { v: Verse, isSearch?: boolean, key?: any }) => {
    const vid = `${v.book}_${v.chapter}_${v.verse}`;
    const isExpanded = expandedCommentary === vid;
    const isThisVerseReading = isReading === vid;
    const commentary = inlineCommentaryData[vid];

    return (
      <div className="space-y-4">
        <article className={`p-8 md:p-12 rounded-[2.5rem] border-l-[12px] shadow-lg bg-white dark:bg-stone-900 transition-all duration-500 ${isThisVerseReading ? 'border-gold bg-gold/5 scale-[1.01]' : isSearch ? 'border-gold/30' : 'border-stone-100 dark:border-stone-800'}`}>
           <div className="flex justify-between items-center mb-6">
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isThisVerseReading ? 'text-gold' : 'text-stone-400'}`}>
                {v.book} {v.chapter}:{v.verse}
              </span>
              <div className="flex gap-2">
                 <button onClick={() => toggleSpeech(v)} className={`p-3 rounded-xl transition-all relative ${isThisVerseReading ? 'bg-gold text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold'}`} title="Ouvir">
                   <Icons.Audio className="w-5 h-5" />
                 </button>
                 <ActionButtons 
                    itemId={vid} 
                    textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} 
                    fullData={v} 
                    onGenerateWallpaper={(data) => setWallpaperVerse(data)}
                 />
              </div>
           </div>
           <p className={`text-xl md:text-3xl font-serif italic leading-relaxed text-stone-800 dark:text-stone-100`}>
             "{v.text}"
           </p>
        </article>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-48 space-y-6 page-enter px-2 md:px-0">
      
      {/* BARRA DE PROGRESSO DE LEITURA */}
      <div className="fixed top-0 left-0 h-1.5 bg-gold z-[200] transition-all duration-300" style={{ width: `${scrollProgress}%` }} />

      {/* NAVBAR DE NAVEGAÇÃO REFINADA */}
      <nav className="sticky top-4 z-[140] bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border border-stone-100 dark:border-stone-800 p-4 rounded-[2.5rem] shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button onClick={() => setShowBookSelector(true)} className="flex items-center gap-3 bg-[#1a1a1a] text-gold px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-800 transition-all active:scale-95 flex-1 md:flex-none">
              <Icons.Book className="w-5 h-5" />
              <span className="font-serif font-bold text-xl truncate">{selectedBook || 'Selecionar Livro'}</span>
            </button>
            
            <div className="flex items-center gap-1">
              <button onClick={() => selectedBook && selectedChapter && loadChapter(selectedBook, selectedChapter - 1)} disabled={selectedChapter === 1} className="p-3 bg-stone-50 dark:bg-stone-900 text-gold rounded-xl disabled:opacity-20"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
              <button onClick={() => setShowChapterPicker(true)} className="px-5 py-3 bg-[#fcf8e8] dark:bg-stone-900 border border-gold/20 rounded-xl font-serif font-bold text-xl">{selectedChapter}</button>
              <button onClick={() => selectedBook && selectedChapter && loadChapter(selectedBook, selectedChapter + 1)} className="p-3 bg-stone-50 dark:bg-stone-900 text-gold rounded-xl"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
            </div>
          </div>
          
          <button onClick={() => setShowVersionPicker(true)} className="px-4 py-4 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-all">
            {selectedVersion.name}
          </button>
        </div>
      </nav>

      {/* RESULTADOS / VERSÍCULOS */}
      <main className="space-y-6">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-64 bg-stone-50 dark:bg-stone-900 rounded-[2.5rem]" />)}
          </div>
        ) : (
          <>
            <div className="text-center py-10 opacity-30">
               <h3 className="text-5xl font-serif font-bold italic">{selectedBook} {selectedChapter}</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-2">Capítulo Sagrado</p>
            </div>
            {verses.map((v, i) => <VerseItem key={i} v={v} />)}
          </>
        )}
      </main>

      {/* NAVEGAÇÃO RÁPIDA DE RODAPÉ */}
      {!loading && selectedBook && selectedChapter && (
        <div className="fixed bottom-32 left-0 right-0 z-[140] pointer-events-none flex justify-center px-6">
           <div className="bg-stone-950/90 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-3xl pointer-events-auto flex gap-4">
              <button 
                onClick={() => loadChapter(selectedBook, selectedChapter - 1)}
                disabled={selectedChapter === 1}
                className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-gold hover:bg-gold hover:text-stone-900 transition-all disabled:opacity-10"
              >
                <Icons.ArrowDown className="w-6 h-6 -rotate-90" />
              </button>
              <button 
                onClick={() => setShowChapterPicker(true)}
                className="px-6 font-serif font-bold text-white text-xl"
              >
                Cap. {selectedChapter}
              </button>
              <button 
                onClick={() => loadChapter(selectedBook, selectedChapter + 1)}
                className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-gold hover:bg-gold hover:text-stone-900 transition-all"
              >
                <Icons.ArrowDown className="w-6 h-6 rotate-90" />
              </button>
           </div>
        </div>
      )}

      {/* WALLPAPER GENERATOR MODAL */}
      {wallpaperVerse && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6" onClick={() => setWallpaperVerse(null)}>
          <div className="max-w-md w-full flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
             <header className="text-center space-y-1">
                <h3 className="text-3xl font-serif font-bold text-gold">Sacrum Murus</h3>
                <p className="text-stone-400 italic text-sm">Versículo Completo para Tela de Bloqueio</p>
             </header>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-2">
                <button 
                  onClick={() => setWallpaperTheme('light')} 
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${wallpaperTheme === 'light' ? 'bg-white text-stone-900 shadow-xl' : 'text-stone-500'}`}
                >
                  Lumen
                </button>
                <button 
                  onClick={() => setWallpaperTheme('dark')} 
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${wallpaperTheme === 'dark' ? 'bg-[#d4af37] text-stone-900 shadow-xl' : 'text-stone-500'}`}
                >
                  Nox
                </button>
             </div>

             <div className="relative w-full aspect-[9/16] rounded-[2.5rem] overflow-hidden shadow-3xl border border-white/10 bg-white group">
                <canvas ref={wallpaperCanvasRef} className="w-full h-full" />
                <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
             </div>

             <div className="flex gap-4 w-full">
                <button onClick={() => {
                  const canvas = wallpaperCanvasRef.current;
                  if (!canvas) return;
                  const link = document.createElement('a');
                  link.download = `cathedra-${wallpaperVerse.book}-${wallpaperVerse.chapter}.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                }} className="flex-1 py-5 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                  <Icons.Download className="w-5 h-5" />
                  Salvar Obra
                </button>
                <button onClick={() => setWallpaperVerse(null)} className="px-8 py-5 bg-white/5 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10">
                  Fechar
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAIS (SELECTORS) - OMNI SELECTOR DE LIVROS */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500 overflow-hidden">
          <header className="p-8 md:p-12 flex justify-between items-center flex-shrink-0">
             <div>
               <h2 className="text-4xl md:text-6xl font-serif font-bold text-gold tracking-tight">Cânon Sagrado</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mt-2">Navegação Teológica Profissional</p>
             </div>
             <button onClick={() => setShowBookSelector(false)} className="p-4 bg-white/5 rounded-full text-white"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
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
                                        className="text-left px-6 py-4 rounded-2xl bg-white/5 hover:bg-gold text-stone-300 hover:text-stone-900 font-serif italic text-xl transition-all"
                                       >
                                          {book}
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
    </div>
  );
};

export default Bible;
