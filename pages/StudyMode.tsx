
import React, { useState, useContext, useEffect } from 'react';
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
  const [history, setHistory] = useState<StudyResult[]>([]);
  
  // Sincroniza o histórico com o localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('cathedra_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Erro ao carregar histórico:", e);
      }
    }
  }, [data]);

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

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja apagar seu memorial de investigações teológicas?")) {
      localStorage.removeItem('cathedra_history');
      setHistory([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-12 px-2 md:px-0 page-enter">
      <header className={`transition-all duration-700 ${data ? 'mb-4' : 'min-h-[40vh] flex flex-col justify-center pt-10'}`}>
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Investigação Teológica</h2>
          <p className="text-stone-400 font-serif italic text-lg md:text-2xl">"Fides quaerens intellectum"</p>
        </div>
        
        <div className="max-w-4xl mx-auto px-2">
          <div className="relative w-full max-w-2xl mx-auto flex flex-col gap-6">
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                <Icons.Search className="h-6 w-6 text-gold/50 transition-colors group-focus-within:text-gold" />
              </div>
              
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleTriggerSearch()}
                className="block w-full pl-16 pr-14 py-6 border border-stone-200 dark:border-stone-800 rounded-3xl leading-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-gold/5 focus:border-gold transition duration-150 ease-in-out font-serif italic text-xl shadow-2xl"
                placeholder="Qual resposta sua alma busca hoje?" 
                aria-label="Buscar na Doutrina"
              />

              <button 
                onClick={handleMagicSuggestion}
                disabled={loadingSuggestions}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gold hover:text-yellow-400 active:scale-90 transition-all"
                title="Sugestão da IA"
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
            <div className="mt-12 space-y-16 animate-in fade-in duration-1000 slide-in-from-bottom-4">
              {/* Memorial de Investigações */}
              {history.length > 0 && (
                <div className="space-y-8 pt-8 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <Icons.History className="w-5 h-5 text-gold" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Memorial de Investigações</h4>
                    </div>
                    <button 
                      onClick={clearHistory}
                      className="text-[9px] font-black uppercase text-stone-300 hover:text-sacred transition-colors"
                    >
                      Limpar Memorial
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {history.map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleTriggerSearch(item.topic)}
                        className="group relative bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl text-left transition-all hover:border-gold hover:shadow-2xl active:scale-[0.98] overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                          <Icons.Layout className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gold/60">Estudo Salvo</span>
                          </div>
                          <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-gold transition-colors">{item.topic}</h5>
                          <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm line-clamp-2 leading-relaxed">
                            "{item.summary}"
                          </p>
                          <div className="pt-4 flex items-center gap-2 text-stone-300 group-hover:text-gold transition-colors">
                            <span className="text-[9px] font-black uppercase tracking-widest">Retomar Investigação</span>
                            <Icons.ArrowDown className="w-3 h-3 -rotate-90" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugestões Rápidas */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 text-center">Temas para Meditação</h4>
                <div className="flex flex-wrap justify-center gap-3">
                    {suggestedTopics?.map(topic => (
                      <button 
                        key={topic}
                        onClick={() => handleTriggerSearch(topic)}
                        className="px-6 py-3 bg-white dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-800 rounded-full text-[10px] font-serif italic transition-all shadow-sm hover:border-gold hover:text-gold hover:bg-gold/5"
                      >
                        {topic}
                      </button>
                    ))}
                </div>
              </div>
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
