
import React, { useState, useContext } from 'react';
import { Icons } from '../constants';
import { StudyResult } from '../types';
import { LangContext } from '../App';

const StudyMode: React.FC<{ data?: StudyResult | null, onSearch: (topic: string) => void }> = ({ data, onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleTriggerSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      await onSearch(query);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-12 px-2 md:px-4 page-enter">
      <header className={`transition-all duration-700 ${data ? 'mb-8' : 'min-h-[50vh] flex flex-col justify-center pt-20'}`}>
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight leading-none">Investigação Cruzada</h2>
          <p className="text-stone-400 font-serif italic text-2xl md:text-3xl">IA conectando Escritura, Tradição e Magistério</p>
        </div>
        
        <div className="max-w-4xl mx-auto px-2">
          <div className="relative w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="relative group w-full">
              <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 h-8 w-8 text-gold/40 transition-colors group-focus-within:text-gold z-10" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleTriggerSearch()}
                className="block w-full pl-20 pr-16 py-10 border border-stone-200 dark:border-white/10 rounded-[3rem] bg-white dark:bg-[#151310] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-16 focus:ring-gold/5 focus:border-gold transition-all font-serif italic text-2xl md:text-3xl shadow-4xl"
                placeholder="Tema para correlação teológica..." 
              />
            </div>

            <button 
              onClick={handleTriggerSearch}
              disabled={loading}
              className="w-full py-8 bg-sacred hover:bg-stone-900 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-[12px] shadow-4xl active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Processando Analogias..." : "Iniciar Cruzamento de Dados"}
            </button>
          </div>
        </div>
      </header>

      {data && (
        <div className="space-y-16 animate-in fade-in duration-1000">
          {/* Seção de Resultado IA */}
          <section className="bg-white dark:bg-[#151310] p-12 md:p-20 rounded-[5rem] shadow-4xl border-t-[20px] border-sacred relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gold mb-6 block">Symphonia Fidei • Síntese IA</span>
                <h3 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-[1.1] mb-12">{data.topic}</h3>
                <div className="p-10 md:p-16 bg-[#fcf8e8] dark:bg-stone-900/80 rounded-[4rem] border-l-[20px] border-gold shadow-inner">
                  <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-100 leading-snug tracking-tight">"{data.summary}"</p>
                </div>
              </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
               <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-stone-500 px-6">Fundamentação Bíblica</h4>
               {data.bibleVerses?.map((v, i) => (
                 <article key={i} className="p-10 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
                    <p className="text-[10px] font-black text-sacred uppercase tracking-widest mb-4">{v.book} {v.chapter}:{v.verse}</p>
                    <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">"{v.text}"</p>
                 </article>
               ))}
            </div>

            <div className="space-y-8">
               <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-stone-500 px-6">Nexo com o Catecismo</h4>
               {data.catechismParagraphs?.map((p, i) => (
                 <article key={i} className="p-10 bg-[#1a1a1a] text-white rounded-[3rem] border border-white/10 shadow-2xl">
                    <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-4">Parágrafo CIC {p.number}</p>
                    <p className="text-xl font-serif italic text-white/80 leading-relaxed">"{p.content}"</p>
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
