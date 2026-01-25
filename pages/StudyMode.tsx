
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

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-16 px-2 md:px-4 page-enter">
      <header className={`transition-all duration-700 ${data ? 'mb-8' : 'min-h-[50vh] flex flex-col justify-center pt-20'}`}>
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight leading-none">Investigação Teológica</h2>
          <p className="text-stone-400 font-serif italic text-2xl md:text-3xl">"Fides quaerens intellectum"</p>
        </div>
        
        <div className="max-w-4xl mx-auto px-2">
          <div className="relative w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none z-10">
                <Icons.Search className="h-8 w-8 text-gold/40 transition-colors group-focus-within:text-gold" />
              </div>
              
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleTriggerSearch()}
                className="block w-full pl-20 pr-16 py-10 border border-stone-200 dark:border-white/10 rounded-[3rem] bg-white dark:bg-[#151310] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-16 focus:ring-gold/5 focus:border-gold transition-all font-serif italic text-2xl md:text-3xl shadow-4xl"
                placeholder="O que sua alma busca hoje?" 
              />

              <button 
                onClick={handleMagicSuggestion}
                disabled={loadingSuggestions}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-gold hover:text-yellow-400 active:scale-90 transition-all"
                title="Inspiração da IA"
              >
                {loadingSuggestions ? <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" /> : <Icons.Feather className="w-8 h-8" />}
              </button>
            </div>

            <button 
              onClick={() => handleTriggerSearch()}
              className="w-full py-8 bg-gold hover:bg-white text-stone-900 rounded-[3rem] font-black uppercase tracking-[0.4em] text-[12px] shadow-4xl active:scale-95 transition-all"
            >
              Consultar o Depósito da Fé
            </button>
          </div>

          {!data && (
            <div className="mt-16 space-y-12 text-center">
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Temas Sugeridos</h4>
              <div className="flex flex-wrap justify-center gap-3">
                  {suggestedTopics?.map(topic => (
                    <button 
                      key={topic}
                      onClick={() => handleTriggerSearch(topic)}
                      className="px-8 py-4 bg-white dark:bg-stone-900/50 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-white/5 rounded-full text-xs font-serif italic transition-all shadow-xl hover:border-gold hover:text-gold hover:bg-gold/5"
                    >
                      {topic}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {data && (
        <div className="space-y-16 animate-in fade-in duration-1000">
          <section className="bg-white dark:bg-[#151310] p-12 md:p-20 rounded-[5rem] shadow-4xl border border-stone-100 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-20 opacity-[0.02] group-hover:scale-110 transition-transform duration-[3000ms]">
                <Icons.Feather className="w-96 h-96 text-gold" />
              </div>
              <div className="relative z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gold mb-6 block">Investigatio Synthetica</span>
                <h3 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-[1.1] mb-12">{data.topic}</h3>
                <div className="p-10 md:p-16 bg-[#fcf8e8] dark:bg-stone-900/80 rounded-[4rem] border-l-[20px] border-gold shadow-inner">
                  <p className="text-2xl md:text-5xl font-serif italic text-stone-800 dark:text-stone-100 leading-snug tracking-tight">"{data.summary}"</p>
                </div>
              </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* ESCRITURA */}
            <div className="space-y-8">
               <div className="flex items-center gap-4 px-6">
                 <div className="p-3 bg-sacred/10 rounded-2xl"><Icons.Book className="w-6 h-6 text-sacred" /></div>
                 <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-stone-500">Sacra Scriptura</h4>
                 <div className="h-px flex-1 bg-stone-100 dark:bg-white/5" />
               </div>
               <div className="grid gap-6">
                 {data.bibleVerses?.map((v, i) => (
                   <article key={i} className="p-10 bg-white dark:bg-stone-900 rounded-[3.5rem] border border-stone-50 dark:border-white/5 shadow-2xl hover:border-sacred/30 transition-colors">
                      <p className="text-[10px] font-black text-sacred uppercase tracking-widest mb-4">{v.book} {v.chapter}:{v.verse}</p>
                      <p className="text-xl md:text-2xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">"{v.text}"</p>
                   </article>
                 ))}
               </div>
            </div>

            {/* TRADIÇÃO / CIC */}
            <div className="space-y-8">
               <div className="flex items-center gap-4 px-6">
                 <div className="p-3 bg-gold/10 rounded-2xl"><Icons.Cross className="w-6 h-6 text-gold" /></div>
                 <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-stone-500">Sancta Traditio</h4>
                 <div className="h-px flex-1 bg-stone-100 dark:bg-white/5" />
               </div>
               <div className="grid gap-6">
                 {data.catechismParagraphs?.map((p, i) => (
                   <article key={i} className="p-10 bg-[#1a1a1a] text-white rounded-[3.5rem] border border-white/10 shadow-4xl hover:border-gold/40 transition-colors">
                      <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-4">Codex CIC {p.number}</p>
                      <p className="text-xl md:text-2xl font-serif italic text-white/80 leading-relaxed">"{p.content}"</p>
                   </article>
                 ))}
               </div>
            </div>
          </div>

          {/* MAGISTÉRIO E SANTOS */}
          {data.magisteriumDocs && data.magisteriumDocs.length > 0 && (
            <section className="space-y-8">
               <div className="flex items-center gap-4 px-6">
                 <div className="p-3 bg-gold/10 rounded-2xl"><Icons.Globe className="w-6 h-6 text-gold" /></div>
                 <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-stone-500">Magisterium Ecclesiae</h4>
                 <div className="h-px flex-1 bg-stone-100 dark:bg-white/5" />
               </div>
               <div className="grid md:grid-cols-2 gap-8">
                 {data.magisteriumDocs.map((doc, i) => (
                   <div key={i} className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] border border-stone-100 dark:border-white/5 shadow-2xl">
                      <div className="flex justify-between items-start mb-6">
                        <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{doc.title}</h5>
                        <span className="text-[10px] font-black text-gold">{doc.year}</span>
                      </div>
                      <p className="text-lg font-serif italic text-stone-400 leading-relaxed mb-6">"{doc.summary}"</p>
                      <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">{doc.source}</span>
                   </div>
                 ))}
               </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyMode;
