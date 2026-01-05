
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
  "O papel de Maria na Redenção"
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
        const randomTopic = suggestions[Math.floor(Math.random() * suggestions.length)];
        setQuery(randomTopic);
        onSearch(randomTopic);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingSuggestions(false); }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-8 px-2 md:px-0 page-enter">
      {/* Search Header */}
      <header className={`transition-all duration-700 ${data ? 'mb-4' : 'min-h-[50vh] flex flex-col justify-center'}`}>
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Investigação</h2>
          <p className="text-stone-400 font-serif italic text-lg md:text-2xl italic">"Fides quaerens intellectum"</p>
        </div>
        
        <div className="max-w-4xl mx-auto px-2">
          <div className="relative flex flex-col gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleTriggerSearch()}
                  placeholder="Ex: Primado de Pedro..."
                  className="w-full pl-6 pr-14 py-5 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-3xl outline-none font-serif text-lg shadow-lg focus:border-gold transition-all dark:text-white"
                />
                <button 
                  onClick={handleMagicSuggestion}
                  disabled={loadingSuggestions}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 text-gold active:scale-90 transition-all"
                >
                  {loadingSuggestions ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-6 h-6" />}
                </button>
              </div>
              <button 
                onClick={() => handleTriggerSearch()}
                className="w-full py-5 bg-[#1a1a1a] dark:bg-[#d4af37] text-gold dark:text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
              >
                Pesquisar
              </button>
          </div>

          {!data && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
                 {suggestedTopics.map(topic => (
                   <button 
                    key={topic}
                    onClick={() => handleTriggerSearch(topic)}
                    className="px-4 py-2 bg-white dark:bg-stone-800 text-stone-500 border border-stone-100 dark:border-stone-700 rounded-full text-[10px] font-serif italic transition-all shadow-sm"
                   >
                     {topic}
                   </button>
                 ))}
            </div>
          )}
        </div>
      </header>

      {/* Results View */}
      {data && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <section className="bg-white dark:bg-stone-900 p-6 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100 dark:border-stone-800">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Síntese Teológica</span>
              <h3 className="text-2xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-2">{data.topic}</h3>
              <div className="p-6 bg-[#fcf8e8] dark:bg-stone-800/40 rounded-2xl border-l-8 border-[#d4af37] mt-6">
                <p className="text-lg md:text-3xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">"{data.summary}"</p>
              </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2 ml-4">
                 <Icons.Book className="w-4 h-4 text-sacred" /> Escritura
               </h4>
               {data.bibleVerses.map((v, i) => (
                 <article key={i} className="p-6 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-50 dark:border-stone-800 shadow-md">
                    <p className="text-[9px] font-black text-sacred uppercase tracking-widest mb-2">{v.book} {v.chapter}:{v.verse}</p>
                    <p className="text-base font-serif italic text-stone-800 dark:text-stone-200 leading-snug">"{v.text}"</p>
                 </article>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMode;
