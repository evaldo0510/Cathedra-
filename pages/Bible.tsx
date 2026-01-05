
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

const Bible: React.FC<{ onDeepDive?: (topic: string) => void }> = ({ onDeepDive }) => {
  const { lang, t } = useContext(LangContext);
  const [query, setQuery] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'canon' | 'favorites'>('canon');
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  
  const [selectedVerseForCommentary, setSelectedVerseForCommentary] = useState<Verse | null>(null);
  const [commentaryType, setCommentaryType] = useState<'pilgrim' | 'catena'>('pilgrim');
  const [commentaryData, setCommentaryData] = useState<{ text: string, fathers?: string[] }>({ text: "" });
  const [loadingCommentary, setLoadingCommentary] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const renderSafeText = (text: any) => {
    if (typeof text === 'string') return text;
    if (text && typeof text === 'object') {
      const values = Object.values(text);
      return values.find(v => typeof v === 'string') || JSON.stringify(text);
    }
    return '';
  };

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
    setViewMode('canon');
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

  const filteredCanon = useMemo(() => {
    const testamentData = CANON[activeTestament];
    if (!bookSearch.trim()) return testamentData;
    
    const term = bookSearch.toLowerCase();
    const result: Record<string, string[]> = {};
    
    Object.entries(testamentData).forEach(([category, books]) => {
      const filtered = (books as string[]).filter(b => b.toLowerCase().includes(term));
      if (filtered.length > 0) result[category] = filtered;
    });
    
    return result;
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

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-10 page-enter">
      
      {/* SCRIPTORIUM NAVIGATOR */}
      <nav className="sticky top-0 z-[140] bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl border border-stone-100 dark:border-stone-800 p-6 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setShowBookSelector(true)}
            className="flex items-center gap-4 bg-[#1a1a1a] text-[#d4af37] px-8 py-4 rounded-[2rem] shadow-xl hover:bg-[#8b0000] hover:text-white transition-all active:scale-95 group w-full md:w-auto"
          >
            <Icons.Book className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="font-serif font-bold text-2xl truncate">{selectedBook || t('select_book')}</span>
            <Icons.ArrowDown className="w-4 h-4 opacity-50" />
          </button>
          
          {selectedBook && (
            <button 
              onClick={() => setShowChapterPicker(!showChapterPicker)}
              className="px-6 py-4 bg-[#fcf8e8] dark:bg-stone-800 rounded-[2rem] border border-gold/20 flex items-center gap-3 hover:border-gold transition-all"
            >
              <span className="font-serif font-bold text-xl text-stone-800 dark:text-gold">{t('chapter')} {selectedChapter}</span>
              <Icons.ArrowDown className={`w-4 h-4 transition-transform duration-500 ${showChapterPicker ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <div className="relative flex-1 max-w-xl w-full">
           <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
           <input 
             type="text" 
             value={query}
             onChange={e => setQuery(e.target.value)}
             placeholder={t('search_placeholder')}
             className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] focus:border-gold outline-none font-serif italic text-lg transition-all"
           />
        </div>

        <div className="flex gap-2">
           <button onClick={() => loadChapter(selectedBook!, selectedChapter! - 1)} disabled={!selectedChapter || selectedChapter <= 1} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full disabled:opacity-20"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
           <button onClick={() => loadChapter(selectedBook!, selectedChapter! + 1)} disabled={!selectedBook} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full disabled:opacity-20"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
        </div>
      </nav>

      {/* BOOK SELECTION OVERLAY */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-stone-950/95 backdrop-blur-md animate-in fade-in duration-300 p-8 md:p-20 overflow-y-auto">
          <header className="max-w-6xl mx-auto flex items-center justify-between mb-16">
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-gold tracking-tight">{t('bible')}</h2>
            <button onClick={() => setShowBookSelector(false)} className="p-5 bg-white/10 rounded-full hover:bg-sacred text-white transition-all">
              <Icons.Cross className="w-8 h-8 rotate-45" />
            </button>
          </header>

          <div className="max-w-6xl mx-auto space-y-12">
            <div className="relative max-w-2xl">
               <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-gold/30" />
               <input 
                 type="text" 
                 autoFocus
                 value={bookSearch}
                 onChange={e => setBookSearch(e.target.value)}
                 placeholder="Digite o nome do livro..."
                 className="w-full pl-20 pr-10 py-8 bg-white/5 border-2 border-white/10 rounded-[3rem] text-4xl font-serif italic text-white outline-none focus:border-gold transition-all"
               />
            </div>

            <div className="flex gap-6 border-b border-white/10 pb-10">
               {['Antigo Testamento', 'Novo Testamento'].map(t => (
                 <button key={t} onClick={() => setActiveTestament(t as any)} className={`text-xl font-black uppercase tracking-widest transition-all ${activeTestament === t ? 'text-gold border-b-4 border-gold pb-2' : 'text-stone-500'}`}>{t}</button>
               ))}
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-12">
               {Object.entries(filteredCanon).map(([cat, books]) => (
                 <div key={cat} className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-gold/40 border-b border-white/5 pb-2">{cat}</h4>
                    <div className="flex flex-col gap-3">
                       {(books as string[]).map(book => (
                         <button key={book} onClick={() => loadChapter(book, 1)} className="text-left text-2xl md:text-3xl font-serif italic text-stone-300 hover:text-gold transition-colors">{book}</button>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER PICKER */}
      {showChapterPicker && selectedBook && (
        <section className="bg-white dark:bg-stone-900 p-10 rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 animate-in zoom-in-95">
           <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-8">{t('chapter')} - {selectedBook}</h3>
           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-12 gap-4">
              {[...Array(50)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => loadChapter(selectedBook, i + 1)}
                  className={`h-16 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${selectedChapter === i + 1 ? 'bg-gold text-stone-900 shadow-xl' : 'bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-gold'}`}
                >
                  {i + 1}
                </button>
              ))}
           </div>
        </section>
      )}

      {/* VERSES LIST */}
      <main className="space-y-8">
        {loading ? (
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-64 bg-white dark:bg-stone-900 rounded-[4rem]" />)}
          </div>
        ) : verses.map((v, i) => {
          const vid = `${v.book}_${v.chapter}_${v.verse}`;
          return (
            <article key={i} className={`p-12 md:p-16 rounded-[4.5rem] border-l-[24px] shadow-xl bg-white dark:bg-stone-900 transition-all group ${isReading === vid ? 'border-gold bg-[#fcf8e8] dark:bg-stone-800' : 'border-stone-100 dark:border-stone-800'}`}>
               <div className="flex justify-between items-center mb-12">
                  <span className="text-[12px] font-black uppercase tracking-[0.5em] text-gold">{v.book} {v.chapter}:{v.verse}</span>
                  <div className="flex gap-4">
                     {GOSPELS.includes(v.book) && (
                       <button onClick={() => openCommentary(v, 'catena')} className="p-5 bg-gold/10 text-sacred rounded-[1.5rem] hover:bg-gold transition-all"><Icons.Book className="w-6 h-6" /></button>
                     )}
                     <button onClick={() => openCommentary(v, 'pilgrim')} className="p-5 bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-gold rounded-[1.5rem]"><Icons.Feather className="w-6 h-6" /></button>
                     <button onClick={() => toggleSpeech(v)} className={`p-5 rounded-[1.5rem] transition-all ${isReading === vid ? 'bg-gold text-stone-900' : 'bg-stone-50 dark:bg-stone-800 text-stone-300'}`}><Icons.Audio className="w-6 h-6" /></button>
                     <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} fullData={v} className="bg-stone-50/50 dark:bg-stone-800/50 p-2 rounded-[1.5rem]" />
                  </div>
               </div>
               <p className="text-3xl md:text-6xl font-serif italic leading-snug tracking-tight text-stone-800 dark:text-stone-100">
                  "{renderSafeText(v.text)}"
               </p>
            </article>
          );
        })}
      </main>

      {/* COMMENTARY MODAL */}
      {selectedVerseForCommentary && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedVerseForCommentary(null)}>
           <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-3xl rounded-[3rem] p-12 shadow-3xl border-t-[12px] border-gold relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedVerseForCommentary(null)} className="absolute top-8 right-8 text-stone-300 hover:text-sacred"><Icons.Cross className="w-8 h-8 rotate-45" /></button>
              <div className="space-y-8">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">{commentaryType === 'catena' ? 'Catena Aurea' : 'Meditatio'}</h4>
                 <h3 className="text-4xl font-serif font-bold">{selectedVerseForCommentary.book} {selectedVerseForCommentary.chapter}:{selectedVerseForCommentary.verse}</h3>
                 <div className="prose dark:prose-invert max-w-none">
                    {loadingCommentary ? <p className="animate-pulse">{t('loading')}</p> : <p className="text-2xl font-serif italic leading-relaxed">{renderSafeText(commentaryData.text)}</p>}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Bible;
