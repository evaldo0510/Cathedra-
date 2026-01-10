
import React, { useState, useContext } from 'react';
import { Icons } from '../constants';
import { StudyResult } from '../types';
import { getAIStudySuggestions } from '../services/gemini';
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
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
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
      <header className={`transition-all duration-700 ${data ? 'mb-4' : 'min-h-[50vh] flex flex-col justify-center'}`}>
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Investigação Teológica</h2>
          <p className="text-stone-400 font-serif italic text-lg md:text-2xl">"Fides quaerens intellectum"</p>
        </div>
        
        <div className="max-w-4xl mx-auto px-2">
          <div className="relative w-full max-w-2xl mx-auto flex flex-col gap-6">
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                <svg className="h-6 w-6 text-yellow-600 transition-colors group-focus-within:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleTriggerSearch()}
                className="block w-full pl-16 pr-14 py-6 border border-gray-700 dark:border-stone-800 rounded-2xl leading-5 bg-gray-900 dark:bg-stone-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-gray-800 focus:border-yellow-500 transition duration-150 ease-in-out font-serif italic text-xl shadow-2xl"
                placeholder="Qual resposta sua alma busca hoje?" 
                aria-label="Buscar na Doutrina"
              />

              <button 
                onClick={handleMagicSuggestion}
                disabled={loadingSuggestions}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gold hover:text-yellow-400 active:scale-90 transition-all"
              >
                {loadingSuggestions ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-6 h-6" />}
              </button>
            </div>

            <button 
              onClick={() => handleTriggerSearch()}
              className="w-full py-6 bg-gold hover:bg-yellow-400 text-stone-900 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl active:scale-95 transition-all"
            >
              Investigar a Verdade
            </button>
          </div>

          {!data && (
            <div className="mt-12 flex flex-wrap justify-center gap-3">
                 {suggestedTopics?.map(topic => (
                   <button 
                    key={topic}
                    onClick={() => handleTriggerSearch(topic)}
                    className="px-6 py-3 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-800 rounded-full text-[10px] font-serif italic transition-all shadow-sm hover:border-gold hover:text-gold"
                   >
                     {topic}
                   </button>
                 ))}
            </div>
          )}
        </div>
      </header>

      {data ? (
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
               {data.bibleVerses?.map((v, i) => (
                 <article key={i} className="p-6 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-50 dark:border-stone-800 shadow-md">
                    <p className="text-[9px] font-black text-sacred uppercase tracking-widest mb-2">{v.book} {v.chapter}:{v.verse}</p>
                    <p className="text-base font-serif italic text-stone-800 dark:text-stone-200 leading-snug">"{v.text}"</p>
                 </article>
               ))}
               {!data.bibleVerses?.length && <p className="text-stone-400 italic text-center p-4">Nenhuma referência direta encontrada.</p>}
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2 ml-4">
                 <Icons.Cross className="w-4 h-4 text-gold" /> Tradição & Catecismo
               </h4>
               {data.catechismParagraphs?.map((p, i) => (
                 <article key={i} className="p-6 bg-[#1a1a1a] text-white rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-[9px] font-black text-gold uppercase tracking-widest mb-2">CIC {p.number}</p>
                    <p className="text-base font-serif italic text-white/80 leading-snug">"{p.content}"</p>
                 </article>
               ))}
               {!data.catechismParagraphs?.length && <p className="text-stone-400 italic text-center p-4">Buscando parágrafos doutrinais...</p>}
            </div>
          </div>
        </div>
      ) : query && (
        <div className="text-center py-20 animate-in fade-in">
           <Icons.Cross className="w-16 h-16 text-stone-200 dark:text-stone-800 mx-auto mb-6 opacity-40" />
           <p className="text-2xl font-serif italic text-stone-400 max-w-md mx-auto">
             Inicie sua busca acima para mergulhar no mistério.
           </p>
        </div>
      )}
    </div>
  );
};

export default StudyMode;
