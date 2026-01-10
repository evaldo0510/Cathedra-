
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Icons } from '../constants';
import { fetchRealBibleText, fetchComparisonVerses } from '../services/gemini';
import { fetchExternalBibleText } from '../services/bibleApi';
import { getCatholicCanon, BIBLE_VERSIONS, BibleVersion, getChapterCount, fetchLocalFallback, LATIN_BOOK_NAMES } from '../services/bibleLocal';
import { Verse, Language } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const CANON = getCatholicCanon();

const Bible: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<'codex' | 'ai' | 'local'>('codex');
  
  const [selectedBook, setSelectedBook] = useState<string>("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  
  const [comparisonVerses, setComparisonVerses] = useState<Record<number, any>>({});

  const loadContent = useCallback(async (book: string, chapter: number, version: BibleVersion, currentLang: Language) => {
    setLoading(true);
    setComparisonVerses({});
    
    try {
      const apiData = await fetchExternalBibleText(book, chapter, version.slug);
      if (apiData && apiData.length > 0) {
        setVerses(apiData);
        setSourceType('codex');
      } else {
        const aiData = await fetchRealBibleText(book, chapter, version.name, currentLang);
        if (aiData && aiData.length > 0) {
          setVerses(aiData);
          setSourceType('ai');
        } else {
          setVerses(fetchLocalFallback(book, chapter));
          setSourceType('local');
        }
      }
    } catch (err) {
      setVerses(fetchLocalFallback(book, chapter));
      setSourceType('local');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent(selectedBook, selectedChapter, selectedVersion, lang);
  }, [selectedBook, selectedChapter, selectedVersion, lang, loadContent]);

  const toggleSynoptic = async (verse: number) => {
    if (comparisonVerses[verse]) {
       const next = {...comparisonVerses};
       delete next[verse];
       setComparisonVerses(next);
       return;
    }
    try {
       const data = await fetchComparisonVerses(selectedBook, selectedChapter, verse, ['Vulgata', 'Almeida', 'Jerusalém'], lang);
       setComparisonVerses({ ...comparisonVerses, [verse]: data });
    } catch (e) { console.error(e); }
  };

  const filteredCanon = useMemo(() => {
    if (!bookSearch) return CANON;
    const search = bookSearch.toLowerCase();
    const newCanon: any = {};
    
    Object.entries(CANON).forEach(([testament, categories]) => {
      const filteredCategories: any = {};
      Object.entries(categories as any).forEach(([cat, books]) => {
        const matchedBooks = (books as string[]).filter(b => b.toLowerCase().includes(search));
        if (matchedBooks.length > 0) filteredCategories[cat] = matchedBooks;
      });
      if (Object.keys(filteredCategories).length > 0) newCanon[testament] = filteredCategories;
    });
    
    return newCanon;
  }, [bookSearch]);

  const isVulgataMode = selectedVersion.isLatin || lang === 'la';

  return (
    <div className={`max-w-7xl mx-auto pb-48 space-y-12 page-enter relative px-4 transition-all duration-1000 ${isVulgataMode ? 'vulgata-theme' : ''}`}>
      
      {/* BARRA DE NAVEGAÇÃO SUPERIOR REESTILIZADA */}
      <nav className="sticky top-4 z-[140] bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl p-4 md:p-6 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
             {/* SELETOR DE LIVRO */}
             <button onClick={() => setShowBookSelector(true)} className={`flex flex-col items-start gap-0.5 px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all ${isVulgataMode ? 'bg-[#1a1a1a] text-gold' : 'bg-stone-900 dark:bg-gold text-gold dark:text-stone-900'}`}>
                <span className="text-[7px] font-black uppercase tracking-widest opacity-50">Librum</span>
                <div className="flex items-center gap-2">
                  <Icons.Book className="w-4 h-4" />
                  <span className="font-serif font-bold text-lg">{isVulgataMode ? LATIN_BOOK_NAMES[selectedBook] || selectedBook : selectedBook}</span>
                </div>
             </button>

             {/* SELETOR DE CAPÍTULO */}
             <button onClick={() => setShowChapterSelector(true)} className="flex flex-col items-start gap-0.5 px-6 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-md hover:border-gold transition-all">
                <span className="text-[7px] font-black uppercase tracking-widest text-stone-400">Caput</span>
                <div className="flex items-center gap-2">
                   <Icons.Layout className="w-4 h-4 text-gold" />
                   <span className="font-serif font-bold text-lg dark:text-white">{selectedChapter}</span>
                </div>
             </button>

             {/* SELETOR DE VERSÃO */}
             <button onClick={() => setShowVersionSelector(true)} className="flex flex-col items-start gap-0.5 px-6 py-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:border-gold transition-all group">
                <span className="text-[7px] font-black uppercase tracking-widest text-stone-400">Versio</span>
                <div className="flex items-center gap-2">
                   <Icons.Globe className="w-4 h-4 text-sacred" />
                   <span className="font-serif font-bold text-lg dark:text-stone-300">{selectedVersion.name}</span>
                </div>
             </button>
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end border-r border-stone-100 dark:border-stone-800 pr-6">
                <span className="text-[7px] font-black uppercase text-stone-400 mb-1">Fons Autoris</span>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${sourceType === 'codex' ? 'bg-emerald-500' : 'bg-gold'}`} />
                   <span className={`text-[9px] font-bold uppercase ${sourceType === 'codex' ? 'text-emerald-500' : 'text-gold'}`}>
                      {sourceType === 'codex' ? 'Codex Digital' : 'Exegese IA'}
                   </span>
                </div>
             </div>
             
             <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl">
                <button onClick={() => selectedChapter > 1 && setSelectedChapter(selectedChapter - 1)} className="p-3 text-stone-400 hover:text-gold transition-colors"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
                <div className="w-px h-8 bg-stone-200 dark:bg-stone-800 self-center" />
                <button onClick={() => selectedChapter < getChapterCount(selectedBook) && setSelectedChapter(selectedChapter + 1)} className="p-3 text-stone-400 hover:text-gold transition-colors"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
             </div>
          </div>
        </div>
      </nav>

      {/* CONTEÚDO DA BÍBLIA */}
      <main className="space-y-12">
        {loading ? (
          <div className="space-y-8 animate-pulse p-10 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-24 bg-stone-100 dark:bg-stone-900/50 rounded-3xl" />)}
          </div>
        ) : (
          <div className={`bg-white dark:bg-stone-900 p-6 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 max-w-5xl mx-auto transition-all ${isVulgataMode ? 'bg-[#fdfcf8] border-gold/30' : ''}`}>
             <header className="text-center space-y-4 mb-20 relative">
                <Icons.Cross className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-20 h-20 opacity-[0.03] text-stone-400" />
                <span className={`text-[11px] font-black uppercase tracking-[1em] mb-4 block ${isVulgataMode ? 'text-sacred' : 'text-stone-300'}`}>
                  {isVulgataMode ? 'BIBLIA SACRA VULGATA' : 'SACRA SCRIPTURA'}
                </span>
                <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">
                  {isVulgataMode ? LATIN_BOOK_NAMES[selectedBook] || selectedBook : selectedBook} <span className="text-gold">{selectedChapter}</span>
                </h2>
             </header>

             <div className="space-y-12">
                {verses.map((v, i) => (
                  <div key={i} className="group">
                    <div className="flex gap-8 items-start p-6 rounded-[2.5rem] hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-all relative">
                       {/* NÚMERO DO VERSÍCULO - GATILHO PARA COMPARAÇÃO */}
                       <button 
                        onClick={() => toggleSynoptic(v.verse)}
                        className={`text-sm font-serif font-bold mt-2 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${comparisonVerses[v.verse] ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-gold/40 hover:bg-gold hover:text-white'}`}
                       >
                         {v.verse}
                       </button>

                       <div className="flex-1 space-y-6">
                          <p className={`font-serif leading-relaxed text-stone-800 dark:text-stone-200 tracking-tight text-2xl md:text-4xl ${isVulgataMode ? 'italic' : ''}`}>
                             {v.text}
                          </p>
                          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => toggleSynoptic(v.verse)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${comparisonVerses[v.verse] ? 'bg-sacred text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-gold'}`}>Sinopse & Comparação</button>
                             <ActionButtons itemId={`bible_${v.book}_${v.chapter}_${v.verse}`} type="verse" title={`${v.book} ${v.chapter}:${v.verse}`} content={v.text} />
                          </div>
                       </div>
                    </div>

                    {/* COMPARAÇÃO SINÓTICA LADO A LADO */}
                    {comparisonVerses[v.verse] && (
                       <div className="mt-6 ml-16 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-6 duration-500">
                          {Object.entries(comparisonVerses[v.verse]).map(([ver, text]: [string, any]) => (
                             <div key={ver} className="p-6 bg-[#fcf8e8] dark:bg-stone-800/40 rounded-[2rem] border border-gold/10 flex flex-col justify-between group/comp">
                                <p className="text-base font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">"{text}"</p>
                                <span className="text-[8px] font-black uppercase tracking-widest text-sacred/40 mt-4 group-hover/comp:text-sacred transition-colors">{ver}</span>
                             </div>
                          ))}
                       </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* MODAL SELETOR DE LIVRO COM BUSCA */}
      {showBookSelector && (
         <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowBookSelector(false)}>
            <div className="bg-white dark:bg-stone-950 w-full max-w-6xl max-h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-8 border-b dark:border-stone-900 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
                    <button onClick={() => setShowBookSelector(false)} className="p-4 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
                  </div>
                  <div className="relative">
                    <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar livro... (Ex: Êxodo, Lucas, Salmos)" 
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 outline-none font-serif italic text-xl focus:border-gold transition-all"
                      autoFocus
                    />
                  </div>
               </header>
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                  {Object.entries(filteredCanon).map(([testament, categories]) => (
                     <div key={testament} className="mb-16">
                        <div className="flex items-center gap-6 mb-10">
                          <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-gold whitespace-nowrap">{testament}</h3>
                          <div className="h-px flex-1 bg-gold/10" />
                        </div>
                        <div className="space-y-12">
                           {Object.entries(categories as any).map(([cat, books]) => (
                              <section key={cat}>
                                 <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-6 ml-2">{cat}</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {(books as string[]).map(b => (
                                       <button key={b} onClick={() => { setSelectedBook(b); setSelectedChapter(1); setShowBookSelector(false); setBookSearch(''); }} className={`p-4 rounded-xl font-serif font-bold text-lg text-left transition-all border-2 ${selectedBook === b ? 'bg-gold text-stone-900 border-gold shadow-lg' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/30'}`}>
                                          {isVulgataMode ? LATIN_BOOK_NAMES[b]?.split(' ').pop() || b : b}
                                       </button>
                                    ))}
                                 </div>
                              </section>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* MODAL SELETOR DE CAPÍTULO (GRID) */}
      {showChapterSelector && (
         <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowChapterSelector(false)}>
            <div className="bg-white dark:bg-stone-950 w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-8 border-b dark:border-stone-900 flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-serif font-bold">{selectedBook}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Selecione o Capítulo</p>
                  </div>
                  <button onClick={() => setShowChapterSelector(false)} className="p-4 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"><Icons.Cross className="w-5 h-5 rotate-45" /></button>
               </header>
               <div className="p-10 grid grid-cols-5 md:grid-cols-8 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {Array.from({ length: getChapterCount(selectedBook) }).map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setSelectedChapter(i + 1); setShowChapterSelector(false); }}
                      className={`aspect-square flex items-center justify-center rounded-xl font-serif font-bold text-xl transition-all border-2 ${selectedChapter === i + 1 ? 'bg-sacred text-white border-sacred' : 'bg-stone-50 dark:bg-stone-900 border-transparent hover:border-gold'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* MODAL SELETOR DE VERSÃO */}
      {showVersionSelector && (
         <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowVersionSelector(false)}>
            <div className="bg-white dark:bg-stone-950 w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-12 border-b dark:border-stone-900 bg-stone-50/50 dark:bg-stone-900/50 flex justify-between items-center">
                  <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Bibliotheca Interpretum</h2>
                  <button onClick={() => setShowVersionSelector(false)} className="p-4 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
               </header>
               <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {BIBLE_VERSIONS.map(v => (
                    <button 
                      key={v.id} 
                      onClick={() => { setSelectedVersion(v); setShowVersionSelector(false); }}
                      className={`p-8 rounded-[2.5rem] text-left transition-all border-2 flex flex-col gap-2 relative overflow-hidden ${selectedVersion.id === v.id ? 'bg-stone-900 text-gold border-gold' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/30'}`}
                    >
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{v.lang}</span>
                          <div className="flex gap-2">
                             {v.isIA && <Icons.Feather className="w-3 h-3 text-gold" />}
                             {v.isCatholic && <Icons.Cross className="w-3 h-3 text-sacred" />}
                          </div>
                       </div>
                       <h4 className="text-2xl font-serif font-bold">{v.name}</h4>
                       <p className="text-sm italic text-stone-400 leading-tight">{v.description}</p>
                    </button>
                  ))}
               </div>
            </div>
         </div>
      )}

      <style>{`
        .vulgata-theme { background-color: #fdfcf8 !important; }
        .vulgata-theme h2 { color: #8b0000 !important; }
      `}</style>
    </div>
  );
};

export default Bible;
