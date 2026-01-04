
import React, { useState } from 'react';
import { Icons } from '../constants';
import { getThomisticSynthesis, getCatenaAureaCommentary } from '../services/gemini';
import { Verse } from '../types';

interface ThomisticSynthesis {
  title: string;
  objections: string[];
  sedContra: string;
  respondeo: string;
  replies: string[];
}

const GOSPELS = ["Mateus", "Marcos", "Lucas", "João"];

const Aquinas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'disputatio' | 'catena'>('disputatio');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [synthesis, setSynthesis] = useState<ThomisticSynthesis | null>(null);

  // Catena Aurea State
  const [selectedGospel, setSelectedGospel] = useState("Mateus");
  const [catenaChapter, setCatenaChapter] = useState("1");
  const [catenaVerse, setCatenaVerse] = useState("1");
  const [catenaResult, setCatenaResult] = useState<{ content: string; fathers: string[]; sources: any[] } | null>(null);

  const handleDisputatio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSynthesis(null);
    try {
      const result = await getThomisticSynthesis(query);
      setSynthesis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCatenaSearch = async () => {
    setLoading(true);
    setCatenaResult(null);
    try {
      const verse: Verse = { book: selectedGospel, chapter: parseInt(catenaChapter), verse: parseInt(catenaVerse), text: "" };
      const result = await getCatenaAureaCommentary(verse);
      setCatenaResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32 px-4 md:px-0">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="p-6 bg-[#fcf8e8] dark:bg-stone-900 rounded-full border border-[#d4af37]/30 shadow-sacred">
              <Icons.Feather className="w-16 h-16 text-[#8b0000] dark:text-[#d4af37]" />
           </div>
        </div>
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Biblioteca do Aquinate</h2>
        <div className="flex justify-center gap-4 mt-8">
           <button 
             onClick={() => setActiveTab('disputatio')}
             className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'disputatio' ? 'bg-[#8b0000] text-white shadow-lg' : 'bg-white dark:bg-stone-800 text-stone-400'}`}
           >
             Summa Disputatio
           </button>
           <button 
             onClick={() => setActiveTab('catena')}
             className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catena' ? 'bg-gold text-stone-900 shadow-lg' : 'bg-white dark:bg-stone-800 text-stone-400'}`}
           >
             Catena Aurea
           </button>
        </div>
      </header>

      {activeTab === 'disputatio' ? (
        <div className="space-y-16">
          <section className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-stone-100 dark:border-stone-800">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37] mb-8">Investigação Escolástica</h3>
            <form onSubmit={handleDisputatio} className="flex flex-col md:flex-row gap-6">
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ex: A existência de Deus, A natureza da Alma..." 
                className="flex-1 px-10 py-8 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-[2.5rem] outline-none text-2xl font-serif italic shadow-inner dark:text-white"
              />
              <button type="submit" disabled={loading} className="px-12 py-8 bg-[#1a1a1a] dark:bg-gold text-gold dark:text-stone-900 font-black rounded-[2.5rem] hover:bg-[#8b0000] hover:text-white transition-all shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-4">
                 {loading ? <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <> <Icons.Feather className="w-5 h-5" /> <span>Disputar</span></>}
              </button>
            </form>
          </section>

          {synthesis && (
            <article className="sacred-background parchment p-12 md:p-24 rounded-[5rem] border border-[#d4af37]/20 shadow-2xl space-y-16 animate-in slide-in-from-bottom-10 duration-700">
               <header className="text-center border-b border-[#d4af37]/10 pb-12">
                  <span className="text-[12px] font-black uppercase tracking-[1em] text-[#8b0000]">Quaestio Disputata</span>
                  <h3 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-6 leading-tight">Artigo: {synthesis.title}</h3>
               </header>
               <div className="space-y-12">
                  <section className="space-y-6">
                     <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000]">I. Videtur Quod</h4>
                     {synthesis.objections.map((obj, i) => (
                       <div key={i} className="flex gap-6 items-start">
                          <span className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center font-bold flex-shrink-0 text-sm">{i+1}</span>
                          <p className="text-xl md:text-2xl font-serif italic text-stone-600 dark:text-stone-400 leading-relaxed">"{obj}"</p>
                       </div>
                     ))}
                  </section>
                  <section className="bg-[#fcf8e8] dark:bg-stone-800 p-8 md:p-12 rounded-[3rem] border-l-[12px] border-gold shadow-sm">
                     <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000] dark:text-gold mb-6">II. Sed Contra</h4>
                     <p className="text-2xl md:text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 leading-relaxed italic">"{synthesis.sedContra}"</p>
                  </section>
                  <section className="space-y-6">
                     <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">III. Respondeo</h4>
                     <p className="text-2xl md:text-4xl font-serif text-stone-900 dark:text-stone-100 leading-snug tracking-tight">{synthesis.respondeo}</p>
                  </section>
               </div>
            </article>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {/* CATENA AUREA UI */}
          <section className="bg-[#fcf8e8] dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-gold/30">
            <header className="mb-8 flex items-center gap-4">
               <div className="p-3 bg-gold rounded-xl"><Icons.Book className="w-6 h-6 text-stone-900" /></div>
               <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-gold">Cadeia de Ouro (Catena Aurea)</h3>
            </header>
            
            <div className="grid md:grid-cols-4 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Evangelho</label>
                  <select 
                    value={selectedGospel}
                    onChange={(e) => setSelectedGospel(e.target.value)}
                    className="w-full px-6 py-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none font-serif text-lg"
                  >
                    {GOSPELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Capítulo</label>
                  <input 
                    type="number" 
                    value={catenaChapter}
                    onChange={(e) => setCatenaChapter(e.target.value)}
                    className="w-full px-6 py-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none font-serif text-lg" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Versículo</label>
                  <input 
                    type="number" 
                    value={catenaVerse}
                    onChange={(e) => setCatenaVerse(e.target.value)}
                    className="w-full px-6 py-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none font-serif text-lg" 
                  />
               </div>
               <div className="flex items-end">
                  <button 
                    onClick={handleCatenaSearch}
                    disabled={loading}
                    className="w-full py-4 bg-gold text-stone-900 font-black rounded-2xl hover:bg-[#8b0000] hover:text-white transition-all shadow-xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                  >
                    {loading ? <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <Icons.Search className="w-4 h-4" />}
                    <span>Consultar</span>
                  </button>
               </div>
            </div>
          </section>

          {catenaResult && (
            <article className="bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] border border-gold/20 shadow-3xl animate-in slide-in-from-bottom-10">
               <header className="mb-10 text-center space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Compilação Patrística</span>
                  <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {selectedGospel} {catenaChapter}:{catenaVerse}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                     {catenaResult.fathers.map(father => (
                       <span key={father} className="px-4 py-1.5 bg-[#fcf8e8] dark:bg-stone-800 text-[#8b0000] dark:text-gold rounded-full text-[8px] font-black uppercase tracking-widest border border-gold/10">
                         {father}
                       </span>
                     ))}
                  </div>
               </header>
               
               <div className="prose dark:prose-invert max-w-none">
                  <p className="text-xl md:text-3xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                    {catenaResult.content}
                  </p>
               </div>

               {catenaResult.sources && catenaResult.sources.length > 0 && (
                 <footer className="mt-12 pt-8 border-t border-stone-100 dark:border-stone-800">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-4">Verificação de Fonte Digital:</p>
                    <div className="flex flex-wrap gap-4">
                       {catenaResult.sources.map((s, idx) => (
                         <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-gold underline truncate max-w-xs">{s.title}</a>
                       ))}
                    </div>
                 </footer>
               )}
            </article>
          )}
        </div>
      )}
    </div>
  );
};

export default Aquinas;
