
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getVerseCommentary } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
import { Verse } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';

const CANON = getCatholicCanon();

const Bible: React.FC<{ onDeepDive?: (topic: string) => void }> = ({ onDeepDive }) => {
  const [query, setQuery] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [isReading, setIsReading] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(true);
  const [selectedVerseForCommentary, setSelectedVerseForCommentary] = useState<Verse | null>(null);
  const [commentary, setCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsReading(null);
  };

  const toggleSpeech = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    if (isReading === vid) {
      stopAudio();
      return;
    }
    stopAudio();
    setIsReading(vid);
    try {
      const textToRead = `${verse.book}, ${verse.chapter}, ${verse.verse}. ${verse.text}`;
      const base64Audio = await generateSpeech(textToRead);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReading(null);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      stopAudio();
    }
  };

  const loadChapter = async (book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowBookSelector(false);
    setLoading(true);
    setVerses([]);
    stopAudio();
    try {
      const data = await fetchLocalChapter(selectedVersion.id, book, chapter);
      setVerses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setShowBookSelector(false);
    try {
      const result = await searchVerse(query);
      if (result && result.text) {
        setVerses([result]);
        setSelectedBook(result.book);
        setSelectedChapter(result.chapter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCommentary = async (verse: Verse) => {
    setSelectedVerseForCommentary(verse);
    setLoadingCommentary(true);
    setCommentary('');
    try {
      const text = await getVerseCommentary(verse);
      setCommentary(text);
    } catch (err) {
      setCommentary("Erro ao carregar comentários.");
    } finally {
      setLoadingCommentary(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4 md:px-0 animate-in fade-in duration-700">
      
      {/* Modal de Comentários / Exegese */}
      {selectedVerseForCommentary && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-3xl rounded-[3rem] p-10 md:p-14 shadow-3xl border-t-[12px] border-[#8b0000] relative overflow-hidden flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setSelectedVerseForCommentary(null)}
              className="absolute top-8 right-8 p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-[#8b0000] hover:text-white transition-all z-10"
            >
              <Icons.Cross className="w-6 h-6 rotate-45" />
            </button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-4">
              <header className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Luz da Tradição</span>
                <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {selectedVerseForCommentary.book} {selectedVerseForCommentary.chapter}:{selectedVerseForCommentary.verse}
                </h3>
                <p className="text-xl italic font-serif text-stone-500 dark:text-stone-400">"{selectedVerseForCommentary.text}"</p>
              </header>

              <div className="prose dark:prose-invert max-w-none">
                {loadingCommentary ? (
                  <div className="space-y-6 py-10">
                    <div className="h-6 w-full bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
                    <div className="h-6 w-5/6 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
                    <div className="h-6 w-4/6 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
                    <div className="h-40 w-full bg-stone-100 dark:bg-stone-800 rounded-3xl animate-pulse" />
                  </div>
                ) : (
                  <div className="text-lg md:text-xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                    {commentary}
                  </div>
                )}
              </div>
            </div>
            
            <footer className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Sentire Cum Ecclesia • Cathedra Digital</p>
            </footer>
          </div>
        </div>
      )}

      <header className="mb-12 text-center space-y-10">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Scriptura</h2>
        
        {/* Barra de Busca Inteligente */}
        <div className="max-w-3xl mx-auto relative group">
          <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-[#d4af37]" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
            placeholder="Pesquise por tema (ex: Eucaristia) ou citação..."
            className="w-full pl-20 pr-10 py-7 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2.5rem] outline-none font-serif italic text-2xl shadow-xl focus:ring-8 focus:ring-[#d4af37]/5 focus:border-[#d4af37] transition-all"
          />
          {loading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="w-6 h-6 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 justify-center">
           {BIBLE_VERSIONS.map(v => (
             <button 
               key={v.id}
               onClick={() => setSelectedVersion(v)}
               className={`flex-shrink-0 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedVersion.id === v.id ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800 hover:border-[#d4af37]'}`}
             >
               {v.name}
             </button>
           ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        <aside className={`lg:col-span-4 space-y-8 ${!showBookSelector && 'hidden lg:block'}`}>
           <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-2xl border border-stone-100 dark:border-stone-800 h-fit sticky top-32">
              <div className="flex border-2 border-stone-50 dark:border-stone-800 mb-8 p-1.5 bg-stone-50 dark:bg-stone-800 rounded-[2rem]">
                {['Antigo Testamento', 'Novo Testamento'].map(testament => (
                  <button 
                    key={testament}
                    onClick={() => setActiveTestament(testament as any)} 
                    className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTestament === testament ? 'bg-white dark:bg-stone-700 text-[#8b0000] dark:text-[#d4af37] shadow-md scale-[1.02]' : 'text-stone-300'}`}
                  >
                    {testament.split(' ')[0]}
                  </button>
                ))}
              </div>
              
              <div className="h-[550px] overflow-y-auto custom-scrollbar space-y-10 pr-2">
                {Object.entries(CANON[activeTestament]).map(([category, books]) => (
                  <div key={category} className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] border-b-2 border-stone-50 dark:border-stone-800 pb-3 flex items-center gap-2">
                      <Icons.Book className="w-3 h-3" />
                      {category}
                    </h5>
                    <div className="flex flex-col gap-1">
                      {(books as string[]).map(book => (
                        <button 
                          key={book} 
                          onClick={() => { setSelectedBook(book); setSelectedChapter(null); }}
                          className={`text-left px-6 py-4 rounded-2xl transition-all font-serif italic text-xl ${selectedBook === book ? 'bg-[#fcf8e8] dark:bg-stone-800 text-[#8b0000] dark:text-[#d4af37] font-bold border-l-8 border-[#d4af37]' : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                          {book}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </aside>

        <main className={`lg:col-span-8 space-y-10 ${showBookSelector && 'hidden lg:block'}`}>
          {selectedBook && (
            <div className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 animate-in fade-in duration-500">
               <div className="flex items-center justify-between mb-12">
                  <button onClick={() => setShowBookSelector(true)} className="lg:hidden p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                    <Icons.Home className="w-6 h-6 text-[#d4af37]" />
                  </button>
                  <h3 className="text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">{selectedBook}</h3>
                  <div className="w-12 h-12" />
               </div>
               
               <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                  {[...Array(selectedBook === 'Salmos' ? 150 : 50)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => loadChapter(selectedBook, i + 1)}
                      className={`h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${selectedChapter === i + 1 ? 'bg-[#8b0000] text-white shadow-xl scale-110' : 'bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-[#d4af37]'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-8">
            {loading ? (
               <div className="space-y-8 animate-pulse">
                 {[1, 2, 3].map(n => <div key={n} className="h-48 bg-white dark:bg-stone-900 rounded-[3rem]" />)}
               </div>
            ) : verses.map((v, i) => (
              <article key={i} className={`p-10 rounded-[3.5rem] border-l-[12px] bg-white dark:bg-stone-900 shadow-xl transition-all relative group animate-in slide-in-from-bottom-6 ${isReading === `${v.book}_${v.chapter}_${v.verse}` ? 'border-[#8b0000] bg-[#fcf8e8] dark:bg-stone-800 scale-[1.02]' : 'border-stone-100 dark:border-stone-800'}`} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#d4af37]">{v.book} {v.chapter}:{v.verse}</span>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => openCommentary(v)} 
                      className="p-3 bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-[#8b0000] dark:hover:text-[#d4af37] rounded-2xl transition-all active:scale-90"
                      title="Exegese Teológica"
                    >
                      <Icons.Feather className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toggleSpeech(v)} 
                      className={`p-3 rounded-2xl transition-all ${isReading === `${v.book}_${v.chapter}_${v.verse}` ? 'bg-[#8b0000] text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-[#d4af37]'}`}
                    >
                      <Icons.Audio className="w-5 h-5" />
                    </button>
                    <ActionButtons itemId={`${v.book}_${v.chapter}_${v.verse}`} textToCopy={v.text} />
                  </div>
                </div>
                <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug tracking-tight">"{v.text}"</p>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Bible;
