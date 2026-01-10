
import React, { useState, useEffect, useCallback, useContext } from 'react';
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
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [comparisonVerses, setComparisonVerses] = useState<Record<number, any>>({});

  const loadContent = useCallback(async (book: string, chapter: number, version: BibleVersion, currentLang: Language) => {
    setLoading(true);
    setComparisonVerses({});
    
    try {
      // 1. Tentar API Externa (Manuscrito Digital)
      const apiData = await fetchExternalBibleText(book, chapter, version.slug);
      
      if (apiData && apiData.length > 0) {
        setVerses(apiData);
        setSourceType('codex');
      } else {
        // 2. Fallback Inteligente (IA para versões modernas ou católicas restritas)
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

  const isVulgataMode = selectedVersion.isLatin || lang === 'la';

  return (
    <div className={`max-w-7xl mx-auto pb-48 space-y-12 page-enter relative px-4 transition-all duration-1000 ${isVulgataMode ? 'vulgata-theme' : ''}`}>
      {/* BARRA DE NAVEGAÇÃO SUPERIOR */}
      <nav className="sticky top-4 z-[140] bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl p-4 md:p-6 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
             <button onClick={() => setShowBookSelector(true)} className={`flex flex-col items-start gap-0.5 px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all ${isVulgataMode ? 'bg-[#1a1a1a] text-gold' : 'bg-stone-900 dark:bg-gold text-gold dark:text-stone-900'}`}>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{isVulgataMode ? 'LIBRUM' : 'LIVRO'}</span>
                <div className="flex items-center gap-3">
                  <Icons.Book className="w-5 h-5" />
                  <span className="font-serif font-bold text-xl">{isVulgataMode ? LATIN_BOOK_NAMES[selectedBook] || selectedBook : selectedBook} {selectedChapter}</span>
                </div>
             </button>

             <button onClick={() => setShowVersionSelector(true)} className="flex flex-col items-start gap-0.5 px-8 py-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-lg hover:border-gold transition-all group">
                <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Interpretatio</span>
                <div className="flex items-center gap-3">
                   <Icons.Layout className="w-4 h-4 text-gold" />
                   <span className="font-serif font-bold text-lg dark:text-white">{selectedVersion.name}</span>
                   {selectedVersion.isCatholic && <Icons.Cross className="w-3 h-3 text-sacred" />}
                </div>
             </button>
          </div>

          <div className="flex items-center gap-6">
             {/* STATUS DA FONTE */}
             <div className="flex flex-col items-end border-r border-stone-100 dark:border-stone-800 pr-6">
                <span className="text-[7px] font-black uppercase text-stone-400 mb-1">Status da Fonte</span>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${sourceType === 'codex' ? 'bg-emerald-500' : 'bg-gold'}`} />
                   <span className={`text-[9px] font-bold uppercase ${sourceType === 'codex' ? 'text-emerald-500' : 'text-gold'}`}>
                      {sourceType === 'codex' ? 'Ex Fontibus (Codex)' : 'Exegese Gerativa'}
                   </span>
                </div>
             </div>
             
             <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl">
                <button onClick={() => selectedChapter > 1 && setSelectedChapter(selectedChapter - 1)} className="p-3 text-stone-400 hover:text-gold"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
                <button onClick={() => selectedChapter < getChapterCount(selectedBook) && setSelectedChapter(selectedChapter + 1)} className="p-3 text-stone-400 hover:text-gold"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
             </div>
          </div>
        </div>
      </nav>

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
                <div className="flex flex-col items-center gap-2 mt-6">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">{selectedVersion.description}</p>
                   <div className="h-px w-20 bg-gold/20" />
                </div>
             </header>

             <div className="space-y-10">
                {verses.map((v, i) => (
                  <div key={i} className="group">
                    <div className="flex gap-10 items-start p-8 rounded-[3rem] hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-all relative">
                       <span className={`text-sm font-serif font-bold mt-2 w-8 flex-shrink-0 text-right ${isVulgataMode ? 'text-sacred' : 'text-gold/40'}`}>{v.verse}</span>
                       <div className="flex-1 space-y-6">
                          <p className={`font-serif leading-relaxed text-stone-800 dark:text-stone-200 tracking-tight text-2xl md:text-4xl ${isVulgataMode ? 'italic' : ''}`}>
                             {v.text}
                          </p>
                          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => toggleSynoptic(v.verse)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${comparisonVerses[v.verse] ? 'bg-sacred text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-gold'}`}>Sinopse IA</button>
                             <ActionButtons itemId={`bible_${v.book}_${v.chapter}_${v.verse}`} type="verse" title={`${v.book} ${v.chapter}:${v.verse}`} content={v.text} />
                          </div>
                       </div>
                    </div>

                    {comparisonVerses[v.verse] && (
                       <div className="mt-6 ml-16 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-6 duration-500">
                          {Object.entries(comparisonVerses[v.verse]).map(([ver, text]: [string, any]) => (
                             <div key={ver} className="p-8 bg-[#fcf8e8] dark:bg-stone-800/40 rounded-[2.5rem] border border-gold/10 space-y-3">
                                <span className="text-[8px] font-black uppercase tracking-widest text-sacred">{ver}</span>
                                <p className="text-base font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">"{text}"</p>
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

      {/* MODAL SELETOR DE LIVRO */}
      {showBookSelector && (
         <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowBookSelector(false)}>
            <div className="bg-white dark:bg-stone-950 w-full max-w-6xl max-h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
               <header className="p-12 border-b dark:border-stone-900 bg-stone-50/50 dark:bg-stone-900/50 flex justify-between items-center">
                  <h2 className="text-5xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Scriptuarium</h2>
                  <button onClick={() => setShowBookSelector(false)} className="p-4 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
               </header>
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                  {Object.entries(CANON).map(([testament, categories]) => (
                     <div key={testament} className="mb-16">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-gold mb-10 text-center">{testament}</h3>
                        <div className="space-y-12">
                           {Object.entries(categories).map(([cat, books]) => (
                              <section key={cat}>
                                 <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-6 ml-2">{cat}</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {books.map(b => (
                                       <button key={b} onClick={() => { setSelectedBook(b); setSelectedChapter(1); setShowBookSelector(false); }} className={`p-5 rounded-2xl font-serif font-bold text-lg text-left transition-all border-2 ${selectedBook === b ? 'bg-gold text-stone-900 border-gold shadow-lg scale-105' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/30'}`}>
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

      <style>{`
        .vulgata-theme { background-color: #fdfcf8 !important; }
        .vulgata-theme h2 { color: #8b0000 !important; }
      `}</style>
    </div>
  );
};

export default Bible;
