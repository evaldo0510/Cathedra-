
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Icons } from '../constants';
import { StudyResult } from '../types';
import { decodeBase64, decodeAudioData } from '../utils/audio';
import { generateSpeech, getAIStudySuggestions } from '../services/gemini';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const DEFAULT_TOPICS = [
  "A Natureza Divina de Jesus Cristo",
  "O Sacramento da Eucaristia no CIC",
  "A Doutrina da Justificação em Trento",
  "O papel de Maria na Redenção",
  "A Infalibilidade Papal e o Vaticano I",
  "O Mistério da Santíssima Trindade"
];

const StudyMode: React.FC<{ data?: StudyResult | null, onSearch: (topic: string) => void }> = ({ data, onSearch }) => {
  const { lang, t } = useContext(LangContext);
  const [query, setQuery] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleTriggerSearch = (term?: string) => {
    const finalTerm = term || query;
    if (!finalTerm.trim()) return;
    onSearch(finalTerm);
  };

  const handleMagicSuggestion = async () => {
    setLoadingSuggestions(true);
    try {
      const suggestions = await getAIStudySuggestions(lang);
      if (suggestions && suggestions.length > 0) {
        setSuggestedTopics(suggestions);
        // Escolhe uma sugestão aleatória e já inicia a busca
        const randomTopic = suggestions[Math.floor(Math.random() * suggestions.length)];
        setQuery(randomTopic);
        onSearch(randomTopic);
      }
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const startNewInvestigation = () => {
    setQuery('');
    onSearch(""); 
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsReading(false);
  };

  const handleReadSummary = async () => {
    if (isReading) {
      stopAudio();
      return;
    }
    if (!data?.summary) return;
    setIsReading(true);
    try {
      const base64 = await generateSpeech(data.summary);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const bytes = decodeBase64(base64);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReading(false);
      source.start();
      audioSourceRef.current = source;
    } catch (err) {
      setIsReading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 space-y-12 px-4 md:px-0 page-enter">
      {/* Search Header */}
      <header className={`transition-all duration-700 ${data ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center'}`}>
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight leading-none">
            Investigação Teológica
          </h2>
          <p className="text-stone-400 font-serif italic text-xl md:text-2xl">
            "Fides quaerens intellectum — A fé que busca o entendimento."
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full scale-110 opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleTriggerSearch()}
                  placeholder="Ex: Primado de Pedro, Natureza da Graça..."
                  className="w-full px-10 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2.5rem] outline-none font-serif italic text-2xl shadow-xl focus:border-[#d4af37] transition-all dark:text-white"
                />
                <button 
                  onClick={handleMagicSuggestion}
                  disabled={loadingSuggestions}
                  title="Inspiratio AI: Sugerir um tema agora"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-gold hover:bg-gold/10 rounded-full transition-all disabled:opacity-50"
                >
                  {loadingSuggestions ? (
                    <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                    </svg>
                  )}
                </button>
              </div>
              <button 
                onClick={() => handleTriggerSearch()}
                className="px-12 py-6 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-[#8b0000] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Icons.Search className="w-5 h-5" />
                <span>Investigar</span>
              </button>
            </div>
          </div>

          {!data && (
            <div className="mt-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 mb-8">Sugestões de Aprofundamento</p>
               <div className="flex flex-wrap justify-center gap-3">
                 {suggestedTopics.map(topic => (
                   <button 
                    key={topic}
                    onClick={() => handleTriggerSearch(topic)}
                    className="px-6 py-3 bg-white dark:bg-stone-800 text-stone-500 hover:text-gold hover:border-gold border border-stone-100 dark:border-stone-700 rounded-full text-xs font-serif italic transition-all shadow-sm animate-in zoom-in-95"
                   >
                     {topic}
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>
      </header>

      {/* Results View */}
      {data && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Main Synthesis */}
          <section className="bg-white dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] md:rounded-[5rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Icons.Layout className="w-96 h-96 text-gold" />
            </div>
            
            <div className="relative z-10 space-y-10">
              <header className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#d4af37]">Síntese Teológica Magistral</span>
                  <h3 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-4 leading-tight tracking-tight">{data.topic}</h3>
                </div>
                <div className="flex gap-3">
                   <button 
                    onClick={handleReadSummary}
                    className={`p-6 rounded-full transition-all shadow-xl ${isReading ? 'bg-[#8b0000] text-white animate-pulse' : 'bg-[#d4af37] text-stone-900'}`}
                    title="Ouvir Síntese"
                   >
                    <Icons.Audio className="w-7 h-7" />
                   </button>
                   <button 
                    onClick={startNewInvestigation}
                    className="p-6 rounded-full bg-stone-50 dark:bg-stone-800 text-stone-300 hover:text-gold shadow-lg"
                    title="Nova Investigação"
                   >
                    <Icons.Cross className="w-7 h-7 rotate-45" />
                   </button>
                </div>
              </header>

              <div className="p-10 md:p-14 bg-[#fcf8e8] dark:bg-stone-800/40 rounded-[3rem] border-l-[16px] border-[#d4af37] shadow-inner">
                <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">
                  "{data.summary}"
                </p>
              </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Bible Section */}
            <div className="space-y-8">
               <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-300 flex items-center gap-4 ml-6">
                 <Icons.Book className="w-5 h-5 text-sacred" /> Escritura Sagrada
               </h4>
               <div className="space-y-6">
                  {data.bibleVerses.map((v, i) => (
                    <article key={i} className="p-10 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-50 dark:border-stone-800 shadow-xl hover:shadow-sacred/5 transition-all group">
                       <div className="flex justify-between items-center mb-6">
                         <span className="text-[10px] font-black text-sacred uppercase tracking-widest">{v.book} {v.chapter}:{v.verse}</span>
                         <ActionButtons itemId={`study_v_${i}`} textToCopy={`${v.book} ${v.chapter}:${v.verse} - ${v.text}`} />
                       </div>
                       <p className="text-xl md:text-2xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug">"{v.text}"</p>
                    </article>
                  ))}
               </div>
            </div>

            {/* Catechism Section */}
            <div className="space-y-8">
               <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-300 flex items-center gap-4 ml-6">
                 <Icons.Cross className="w-5 h-5 text-gold" /> Catecismo (CIC)
               </h4>
               <div className="space-y-6">
                  {data.catechismParagraphs.map((p, i) => (
                    <article key={i} className="p-10 bg-stone-50 dark:bg-stone-800/50 rounded-[3rem] border border-stone-100 dark:border-stone-700 shadow-inner flex flex-col md:flex-row gap-8 items-start group">
                       <div className="bg-[#1a1a1a] text-gold px-6 py-2 rounded-full text-[10px] font-black shadow-md flex-shrink-0">§ {p.number}</div>
                       <p className="text-lg md:text-xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed">"{p.content}"</p>
                    </article>
                  ))}
               </div>
            </div>
          </div>

          {/* Magisterium & Saints Section */}
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Magisterium */}
            <div className="lg:col-span-8 space-y-8">
               <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-300 flex items-center gap-4 ml-6">
                 <Icons.Globe className="w-5 h-5 text-sacred" /> Magistério da Igreja
               </h4>
               <div className="grid gap-6">
                  {data.magisteriumDocs.map((doc, i) => (
                    <article key={i} className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl flex flex-col md:flex-row gap-8 items-center group">
                       <div className="flex-1 space-y-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gold">{doc.source}</span>
                          <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{doc.title}</h5>
                          <p className="text-base font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed">"{doc.content}"</p>
                       </div>
                       <div className="p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl opacity-20 group-hover:opacity-100 transition-opacity">
                          <Icons.Feather className="w-8 h-8 text-gold" />
                       </div>
                    </article>
                  ))}
               </div>
            </div>

            {/* Saints Quotes */}
            <div className="lg:col-span-4 space-y-8">
               <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-300 flex items-center gap-4 ml-6">
                 <Icons.Users className="w-5 h-5 text-gold" /> Sententia Sanctorum
               </h4>
               <div className="space-y-6">
                  {data.saintsQuotes.map((s, i) => (
                    <article key={i} className="p-10 bg-[#1a1a1a] dark:bg-stone-50 rounded-[3rem] text-gold dark:text-stone-900 shadow-2xl relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="relative z-10 space-y-4 text-center">
                          <Icons.Feather className="w-6 h-6 mx-auto opacity-30" />
                          <p className="text-xl font-serif italic leading-snug">"{s.quote}"</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">— {s.saint}</p>
                       </div>
                    </article>
                  ))}
               </div>
            </div>
          </div>
          
          {/* External Sources */}
          {data.sources && data.sources.length > 0 && (
            <footer className="pt-12 border-t border-stone-100 dark:border-stone-800 flex flex-col items-center gap-6">
               <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-300">Fontes de Verificação</p>
               <div className="flex flex-wrap justify-center gap-4">
                  {data.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-stone-50 dark:bg-stone-800 rounded-full hover:bg-[#d4af37] hover:text-white transition-all group">
                       <Icons.Globe className="w-4 h-4 text-gold group-hover:text-white" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{s.title}</span>
                    </a>
                  ))}
               </div>
            </footer>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyMode;
