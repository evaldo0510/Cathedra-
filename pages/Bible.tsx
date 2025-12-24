
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { searchVerse, generateSpeech, getDogmaticLinksForVerses } from '../services/gemini';
import { getCatholicCanon, fetchLocalChapter, BIBLE_VERSIONS, BibleVersion } from '../services/bibleLocal';
import { Verse, Dogma } from '../types';
import ActionButtons from '../components/ActionButtons';
import { decodeBase64, decodeAudioData } from '../utils/audio';

interface BibleProps {
  onDeepDive?: (topic: string) => void;
}

const BOOK_CHAPTERS: Record<string, number> = {
  'Gênesis': 50, 'Êxodo': 40, 'Levítico': 27, 'Números': 36, 'Deuteronômio': 34, 'Josué': 24, 'Juízes': 21, 'Rute': 4,
  '1 Samuel': 31, '2 Samuel': 24, '1 Reis': 22, '2 Reis': 25, '1 Crônicas': 29, '2 Crônicas': 36, 'Esdras': 10, 'Neemias': 13,
  'Tobias': 14, 'Judite': 16, 'Ester': 10, '1 Macabeus': 16, '2 Macabeus': 15, 'Jó': 42, 'Salmos': 150, 'Provérbios': 31,
  'Eclesiastes': 12, 'Cântico dos Cânticos': 8, 'Sabedoria': 19, 'Eclesiástico': 51, 'Isaías': 66, 'Jeremias': 52,
  'Lamentações': 5, 'Baruc': 6, 'Ezequiel': 48, 'Daniel': 14, 'Oseias': 14, 'Joel': 3, 'Amós': 9, 'Abdias': 1, 'Jonas': 4,
  'Miqueias': 7, 'Naum': 3, 'Habacuc': 3, 'Sofonias': 3, 'Ageu': 2, 'Zacarias': 14, 'Malaquias': 3,
  'Mateus': 28, 'Marcos': 16, 'Lucas': 24, 'João': 21, 'Atos dos Apóstolos': 28, 'Romanos': 16, '1 Coríntios': 16,
  '2 Coríntios': 13, 'Gálatas': 6, 'Efésios': 6, 'Filipenses': 4, 'Colossenses': 4, '1 Tessalonicenses': 5,
  '2 Tessalonicenses': 3, '1 Timóteo': 6, '2 Timóteo': 4, 'Tito': 3, 'Filémon': 1, 'Hebreus': 13, 'Tiago': 5,
  '1 Pedro': 5, '2 Pedro': 3, '1 João': 5, '2 João': 1, '3 João': 1, 'Judas': 1, 'Apocalipse': 22
};

const CANON = getCatholicCanon();

const Bible: React.FC<BibleProps> = ({ onDeepDive }) => {
  const [query, setQuery] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTestament, setActiveTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Novo Testamento');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [dogmaticLinks, setDogmaticLinks] = useState<Record<number, Dogma[]>>({});
  const [selectedDogma, setSelectedDogma] = useState<Dogma | null>(null);
  
  // Audio states
  const [isReading, setIsReading] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [isContinuousReading, setIsContinuousReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readingInterval, setReadingInterval] = useState(1000); // 1s default
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const versesRef = useRef<Verse[]>([]);
  const currentIndexRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    const handleHighlight = () => {
      setHighlights(JSON.parse(localStorage.getItem('cathedra_highlights') || '[]'));
    };
    window.addEventListener('highlight-change', handleHighlight);
    handleHighlight();
    return () => {
      window.removeEventListener('highlight-change', handleHighlight);
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsReading(null);
    setAudioLoading(null);
    setIsContinuousReading(false);
    setIsPaused(false);
    currentIndexRef.current = 0;
  };

  const playVerseAudio = async (verse: Verse, onComplete?: () => void) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    setAudioLoading(vid);
    try {
      const textToRead = `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse}. ${verse.text}`;
      const base64Audio = await generateSpeech(textToRead);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsReading(null);
        if (onComplete) onComplete();
      };

      setAudioLoading(null);
      setIsReading(vid);
      source.start();
      audioSourceRef.current = source;
      
      const el = document.getElementById(`verse-card-${vid}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error("Erro no áudio:", err);
      stopAudio();
    }
  };

  const toggleSpeech = async (verse: Verse) => {
    const vid = `${verse.book}_${verse.chapter}_${verse.verse}`;
    if (isReading === vid || audioLoading === vid) {
      stopAudio();
      return;
    }
    stopAudio();
    await playVerseAudio(verse);
  };

  const playNext = async () => {
    if (!isContinuousReading || isPaused) return;
    
    if (currentIndexRef.current >= versesRef.current.length) {
      stopAudio();
      return;
    }

    const nextVerse = versesRef.current[currentIndexRef.current];
    await playVerseAudio(nextVerse, () => {
      currentIndexRef.current += 1;
      timeoutRef.current = window.setTimeout(() => {
        if (isContinuousReading && !isPaused) {
          playNext();
        }
      }, readingInterval);
    });
  };

  const startContinuousReading = async (startIndex: number = 0) => {
    if (isContinuousReading) {
      stopAudio();
      return;
    }
    
    stopAudio();
    setIsContinuousReading(true);
    setIsPaused(false);
    currentIndexRef.current = startIndex;
    playNext();
  };

  const pauseReading = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPaused(true);
    setIsReading(null);
  };

  const resumeReading = () => {
    setIsPaused(false);
    playNext();
  };

  const skipVerse = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    currentIndexRef.current += 1;
    if (currentIndexRef.current < versesRef.current.length) {
      playNext();
    } else {
      stopAudio();
    }
  };

  const handleSearch = async (manualQuery?: string) => {
    const q = manualQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setVerses([]);
    setDogmaticLinks({});
    stopAudio();
    try {
      const result = await searchVerse(q);
      if (result && result.text) {
        setVerses([result]);
        setSelectedBook(result.book);
        setSelectedChapter(result.chapter);
        // Analisa dogmas para o resultado da busca
        const links = await getDogmaticLinksForVerses([result]);
        setDogmaticLinks(links);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setLoading(true);
    setVerses([]);
    setDogmaticLinks({});
    stopAudio();
    try {
      const data = await fetchLocalChapter(selectedVersion.id, book, chapter);
      setVerses(data);
      // Busca vínculos dogmáticos de forma assíncrona após carregar versos
      getDogmaticLinksForVerses(data).then(links => setDogmaticLinks(links));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-1000 pb-32">
      <header className="mb-12 text-center space-y-6">
        <h2 className="text-7xl md:text-8xl font-serif font-bold text-stone-900 tracking-tight text-shadow-sacred">Sacra Scriptura</h2>
        
        <div className="flex justify-center gap-4 mt-8">
           {BIBLE_VERSIONS.map(v => (
             <button 
               key={v.id}
               onClick={() => {
                 setSelectedVersion(v);
                 if (selectedBook && selectedChapter) loadChapter(selectedBook, selectedChapter);
               }}
               className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedVersion.id === v.id ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-lg' : 'bg-white text-stone-400 border-stone-100 hover:border-[#d4af37]'}`}
             >
               {v.name}
             </button>
           ))}
        </div>
      </header>

      {/* Modal de Dogma */}
      {selectedDogma && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#fdfcf8] max-w-2xl w-full rounded-[4rem] p-12 md:p-16 shadow-3xl border-t-[12px] border-[#8b0000] space-y-10 relative overflow-hidden">
              <button 
                onClick={() => setSelectedDogma(null)}
                className="absolute top-8 right-8 p-4 bg-stone-100 rounded-full hover:bg-[#8b0000] hover:text-white transition-all shadow-md group"
              >
                <Icons.Cross className="w-6 h-6 rotate-45 group-hover:rotate-0 transition-transform" />
              </button>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="p-4 bg-[#fcf8e8] rounded-2xl shadow-inner">
                   <Icons.Cross className="w-10 h-10 text-[#8b0000]" />
                </div>
                <div>
                   <h3 className="text-4xl font-serif font-bold text-stone-900 leading-tight tracking-tight">{selectedDogma.title}</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37] mt-1">Verdade Infalível de Fé</p>
                </div>
              </div>

              <div className="space-y-6">
                 <p className="text-2xl md:text-3xl font-serif italic text-stone-800 leading-relaxed border-l-4 border-[#d4af37]/20 pl-8">
                    "{selectedDogma.definition}"
                 </p>
                 <div className="flex flex-wrap items-center gap-4 pt-8">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-100 px-5 py-2 rounded-full">
                       {selectedDogma.council} ({selectedDogma.year})
                    </span>
                    {selectedDogma.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold text-[#8b0000]/60 uppercase tracking-tighter">#{tag}</span>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Barra de Controle de Leitura Contínua */}
      {isContinuousReading && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-[#1a1a1a] p-6 rounded-[3rem] shadow-sacred border border-[#d4af37]/30 flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500">
           <div className="flex items-center gap-4 px-6 border-r border-white/10">
              <div className="w-3 h-3 bg-[#d4af37] rounded-full animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Leitura Contínua</span>
                <span className="text-[8px] text-white/40 uppercase tracking-tighter">Versículo {currentIndexRef.current + 1} de {verses.length}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={isPaused ? resumeReading : pauseReading}
                className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
                title={isPaused ? "Retomar" : "Pausar"}
              >
                {isPaused ? (
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                ) : (
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                )}
              </button>
              
              <button 
                onClick={skipVerse}
                className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
                title="Pular para o próximo"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>

              <button 
                onClick={stopAudio}
                className="p-4 bg-[#8b0000] rounded-full text-white hover:bg-red-700 transition-all active:scale-90"
                title="Encerrar"
              >
                <Icons.Cross className="w-6 h-6 rotate-45" />
              </button>
           </div>

           <div className="flex flex-col gap-2 px-6 border-l border-white/10">
              <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Pausa: {readingInterval/1000}s</span>
              <input 
                type="range" 
                min="500" 
                max="5000" 
                step="500" 
                value={readingInterval}
                onChange={(e) => setReadingInterval(Number(e.target.value))}
                className="w-24 accent-[#d4af37] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
           </div>
        </div>
      )}

      <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-stone-100 mb-16 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37] to-[#d4af37]/10 opacity-30" />
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col md:flex-row gap-6 relative z-10">
          <div className="flex-1 relative">
            <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-[#d4af37]/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar versículo ou tema (Ex: João 3:16)"
              className="w-full pl-20 pr-10 py-8 bg-stone-50 border border-stone-100 rounded-[2.5rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none font-serif italic text-2xl md:text-3xl shadow-inner transition-all placeholder:text-stone-300"
            />
          </div>
          <button type="submit" disabled={loading} className="px-16 py-8 bg-[#1a1a1a] text-[#d4af37] font-black rounded-[2.5rem] hover:bg-[#8b0000] hover:text-white transition-all shadow-xl uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 group/btn">
            {loading ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Icons.Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Consultar</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-12 gap-16">
        <aside className="lg:col-span-4 space-y-10">
           <div className="bg-white p-8 rounded-[4rem] shadow-xl border border-stone-100 h-fit sticky top-8">
              <div className="flex border-b border-stone-100 mb-8 p-1.5 bg-stone-50 rounded-full">
                {Object.keys(CANON).map(testament => (
                  <button 
                    key={testament}
                    onClick={() => setActiveTestament(testament as any)} 
                    className={`flex-1 py-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeTestament === testament ? 'bg-white text-[#8b0000] shadow-md border border-stone-100' : 'text-stone-300 hover:text-stone-500'}`}
                  >
                    {testament === 'Antigo Testamento' ? 'Antigo' : 'Novo'}
                  </button>
                ))}
              </div>
              
              <div className="h-[650px] overflow-y-auto custom-scrollbar pr-4 space-y-10">
                {Object.entries(CANON[activeTestament]).map(([category, books]) => (
                  <div key={category} className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37] border-b border-stone-50 pb-3 pl-2 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                      {category}
                    </h5>
                    <div className="grid grid-cols-1 gap-3">
                      {(books as string[]).map(book => (
                        <button 
                          key={book} 
                          onClick={() => setSelectedBook(book)}
                          className={`text-left px-8 py-5 rounded-2xl transition-all font-serif italic text-2xl ${selectedBook === book ? 'bg-[#fcf8e8] text-[#8b0000] font-bold border-l-8 border-[#d4af37] shadow-lg scale-[1.02]' : 'text-stone-500 hover:bg-stone-50 hover:pl-10'}`}
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

        <main className="lg:col-span-8">
          {selectedBook ? (
            <div className="space-y-16 animate-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white p-16 rounded-[4.5rem] shadow-2xl border border-stone-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                   <Icons.Book className="w-64 h-64" />
                </div>
                
                <header className="mb-12 flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="p-6 bg-[#fcf8e8] rounded-3xl shadow-sm">
                      <Icons.Book className="w-12 h-12 text-[#d4af37]" />
                    </div>
                    <div>
                      <h3 className="text-6xl font-serif font-bold text-stone-900 tracking-tight">{selectedBook}</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37] mt-2">Capítulo {selectedChapter || '?'}</p>
                    </div>
                  </div>
                  
                  {verses.length > 0 && !isContinuousReading && (
                    <button 
                      onClick={() => startContinuousReading()}
                      className="flex items-center gap-3 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] transition-all shadow-lg bg-[#1a1a1a] text-[#d4af37] hover:scale-105"
                    >
                      <Icons.Audio className="w-5 h-5" />
                      <span>Ouvir Capítulo</span>
                    </button>
                  )}
                </header>
                
                <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
                  {[...Array(BOOK_CHAPTERS[selectedBook])].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => loadChapter(selectedBook, i + 1)}
                      className={`h-20 rounded-3xl flex items-center justify-center font-bold text-2xl transition-all ${selectedChapter === i + 1 ? 'bg-[#8b0000] text-white shadow-xl scale-110 z-10' : 'bg-stone-50 text-stone-300 hover:bg-[#fcf8e8] hover:text-[#d4af37] hover:shadow-md hover:scale-105'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-12">
                {loading ? (
                   <div className="space-y-12">
                     {[1, 2, 3].map(n => (
                       <div key={n} className="bg-white p-20 rounded-[4rem] animate-pulse border border-stone-50 shadow-sm space-y-8">
                          <div className="h-4 w-32 bg-stone-100 rounded" />
                          <div className="space-y-4">
                             <div className="h-10 bg-stone-50 rounded-2xl w-full" />
                             <div className="h-10 bg-stone-50 rounded-2xl w-5/6" />
                          </div>
                       </div>
                     ))}
                   </div>
                ) : verses.length > 0 ? (
                  <div className="space-y-12">
                    {verses.map((v, i) => {
                      const vid = `${v.book}_${v.chapter}_${v.verse}`;
                      const playing = isReading === vid;
                      const loadingAudio = audioLoading === vid;
                      const isHighlighted = highlights.includes(vid);
                      const relatedDogmas = dogmaticLinks[v.verse];
                      
                      return (
                        <article 
                          key={vid} 
                          id={`verse-card-${vid}`}
                          className={`p-16 md:p-20 rounded-[4.5rem] border-l-[24px] shadow-2xl transition-all relative group animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-both ${playing ? 'bg-[#fcf8e8] border-[#8b0000] scale-[1.02] z-20 shadow-sacred/20' : isHighlighted ? 'bg-[#fcf8e8] border-[#d4af37]' : 'bg-white border-stone-100 hover:border-[#d4af37]/30'}`}
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="absolute top-12 right-12 flex items-center gap-6">
                             {relatedDogmas && relatedDogmas.length > 0 && (
                               <div className="flex flex-wrap gap-2 max-w-[200px] justify-end">
                                 {relatedDogmas.map((dogma, dIdx) => (
                                   <button 
                                     key={dIdx}
                                     onClick={() => setSelectedDogma(dogma)}
                                     className="flex items-center gap-2 px-4 py-2 bg-[#fcf8e8] border border-[#d4af37]/30 rounded-full hover:bg-[#d4af37] hover:text-white transition-all shadow-md group/dogma"
                                     title={dogma.title}
                                   >
                                      <Icons.Cross className="w-4 h-4 text-[#8b0000] group-hover/dogma:text-white transition-colors" />
                                      <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline truncate max-w-[80px]">{dogma.title}</span>
                                   </button>
                                 ))}
                               </div>
                             )}
                             <button 
                               onClick={() => toggleSpeech(v)}
                               className={`p-5 rounded-full transition-all shadow-xl flex-shrink-0 ${playing || loadingAudio ? 'bg-[#8b0000] text-white animate-pulse' : 'text-stone-200 bg-stone-50 hover:bg-[#d4af37] hover:text-white hover:scale-110'}`}
                               disabled={!!audioLoading && audioLoading !== vid}
                             >
                               {loadingAudio ? (
                                 <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                               ) : (
                                 <Icons.Audio className={`w-7 h-7 ${playing ? 'animate-bounce' : ''}`} />
                               )}
                             </button>
                             <ActionButtons itemId={vid} textToCopy={`${v.book} ${v.chapter}:${v.verse} (${selectedVersion.name}) - ${v.text}`} className="bg-stone-50/50 p-2 rounded-3xl" />
                          </div>
                          
                          <header className="mb-10 flex items-center gap-4">
                             <span className={`text-[13px] font-black uppercase tracking-[0.6em] transition-colors ${playing || isHighlighted ? 'text-[#8b0000]' : 'text-[#d4af37]'}`}>
                               {v.book} {v.chapter}:{v.verse}
                             </span>
                             <span className="text-[10px] font-bold text-stone-200 uppercase tracking-widest">{selectedVersion.id}</span>
                          </header>
                          
                          <p className={`text-4xl md:text-5xl font-serif italic leading-snug transition-all duration-700 tracking-tight ${playing ? 'text-[#8b0000]' : 'text-stone-800'}`}>
                             "{v.text}"
                          </p>
                          
                          <footer className="mt-16 pt-10 border-t border-stone-50/50 flex flex-wrap gap-8 justify-between items-center">
                             <button 
                               onClick={() => onDeepDive?.(`${v.book} ${v.chapter}:${v.verse}`)}
                               className="text-[11px] font-black uppercase tracking-[0.4em] text-[#8b0000] hover:bg-[#8b0000] hover:text-white px-8 py-4 rounded-full border border-[#8b0000]/10 transition-all active:scale-95"
                             >
                               Explorar Tradição Relacionada →
                             </button>
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-white/40 rounded-[5rem] border-2 border-dashed border-stone-200 shadow-inner">
                     <Icons.Book className="w-24 h-24 text-stone-200 mb-8 opacity-20" />
                     <h3 className="text-3xl font-serif italic text-stone-300">Escolha um capítulo para iniciar a leitura orante.</h3>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[750px] flex flex-col items-center justify-center text-center p-24 bg-white/30 backdrop-blur-sm rounded-[6rem] border-2 border-dashed border-stone-200 shadow-inner group">
               <div className="relative mb-16">
                  <div className="absolute inset-0 bg-[#d4af37]/10 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative z-10 p-12 bg-white rounded-full shadow-3xl border border-stone-50 group-hover:rotate-12 transition-transform duration-700">
                    <Icons.Cross className="w-48 h-48 text-stone-100" />
                  </div>
               </div>
               <h3 className="text-5xl font-serif italic text-stone-300 mb-8 tracking-tighter">Mergulhe nas Sagradas Letras</h3>
               <p className="text-stone-400 font-serif text-2xl max-w-lg leading-relaxed italic">
                 "A leitura da Sagrada Escritura deve ser feita com o mesmo espírito com que foi escrita."
               </p>
               <cite className="mt-6 text-[11px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Dei Verbum • Constituição Dogmática</cite>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Bible;
