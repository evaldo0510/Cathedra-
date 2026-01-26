
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { fetchThomisticArticle } from '../services/gemini';
import { ThomisticArticle, AquinasWork } from '../types';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';

const WORKS: AquinasWork[] = [
  { 
    id: 'st', 
    title: 'Summa Theologiae', 
    category: 'summa', 
    description: 'A síntese definitiva da teologia sistemática cristã.', 
    parts: ['I', 'I-II', 'II-II', 'III', 'Suppl'] 
  },
  { 
    id: 'qd', 
    title: 'Quaestiones Disputatae', 
    category: 'disputed', 
    description: 'Investigações dialéticas fundamentais sobre a Verdade e o Mal.', 
    parts: ['De Veritate', 'De Potentia', 'De Malo'] 
  },
  { 
    id: 'scg', 
    title: 'Summa contra Gentiles', 
    category: 'summa', 
    description: 'Tratado apologético sobre a verdade da fé racional.', 
    parts: ['Lib. I', 'Lib. II', 'Lib. III', 'Lib. IV'] 
  }
];

const AquinasOpera: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [selectedWork, setSelectedWork] = useState<AquinasWork | null>(WORKS[0]);
  const [selectedPart, setSelectedPart] = useState<string>(WORKS[0].parts[0]);
  const [refInput, setRefInput] = useState('q. 2 a. 3'); 
  const [article, setArticle] = useState<ThomisticArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(1.2); 

  const loadArticle = async () => {
    if (!selectedWork || !refInput) return;
    setLoading(true);
    setArticle(null);
    try {
      const fullRef = `${selectedPart} ${refInput}`;
      const data = await fetchThomisticArticle(selectedWork.title, fullRef, lang);
      setArticle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-48 animate-in fade-in duration-700 px-4">
      <header className="text-center space-y-4 pt-10">
        <div className="flex justify-center">
           <div className="p-6 bg-stone-900 rounded-[2.5rem] shadow-sacred border-4 border-gold/30">
              <Icons.Feather className="w-10 h-10 text-gold" />
           </div>
        </div>
        <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter leading-none">Opera Omnia</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl font-serif">S. Thomae Aquinatis • Doctoris Angelici</p>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-sacred ml-4 mb-4">Bibliotheca</h3>
           <div className="grid gap-3">
              {WORKS.map(work => (
                <button 
                  key={work.id}
                  onClick={() => { setSelectedWork(work); setSelectedPart(work.parts[0]); }}
                  className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all ${selectedWork?.id === work.id ? 'bg-stone-900 text-white border-gold shadow-2xl scale-[1.02]' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
                >
                   <h4 className="font-serif font-bold text-lg group-hover:text-gold">{work.title}</h4>
                   <p className="text-[9px] italic font-serif text-stone-500 mt-1">{work.description}</p>
                </button>
              ))}
           </div>
        </aside>

        <main className="lg:col-span-3 space-y-10">
           <section className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-8">
              <div className="flex flex-wrap justify-center gap-2">
                 {selectedWork?.parts.map(part => (
                   <button 
                     key={part}
                     onClick={() => setSelectedPart(part)}
                     className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPart === part ? 'bg-gold text-stone-900 shadow-md scale-105' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:bg-gold/10'}`}
                   >
                     {part}
                   </button>
                 ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                   <label className="text-[8px] font-black uppercase text-stone-400 ml-4">Referência (Ex: q. 1 a. 1)</label>
                   <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gold font-serif font-bold text-lg">{selectedPart}</div>
                      <input 
                        type="text" 
                        value={refInput}
                        onChange={e => setRefInput(e.target.value)}
                        className="w-full pl-32 pr-6 py-5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-3xl outline-none font-serif italic text-2xl focus:border-gold transition-all"
                        onKeyPress={e => e.key === 'Enter' && loadArticle()}
                      />
                   </div>
                </div>
                <button 
                  onClick={loadArticle}
                  disabled={loading}
                  className="px-10 py-5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <><Icons.Search className="w-5 h-5" /> <span>Consultar</span></>}
                </button>
              </div>
           </section>

           {article ? (
             <article className="parchment dark:bg-[#151310] p-10 md:p-20 rounded-[4rem] shadow-4xl border border-gold/10 space-y-16 animate-in slide-in-from-bottom-6" style={{ fontSize: `${fontSize}rem` }}>
                <header className="text-center space-y-6 border-b border-gold/10 pb-12">
                   <span className="text-[12px] font-black uppercase tracking-[1em] text-sacred">Articulus</span>
                   <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                     {article.articleTitle}
                   </h3>
                   <div className="flex justify-center gap-3">
                      <ActionButtons itemId={`aq_${article.reference}`} type="aquinas" title={article.articleTitle} content={article.respondeo} />
                   </div>
                </header>

                <div className="space-y-12">
                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-sacred">Videtur Quod (Objeções)</h4>
                      {article.objections.map(obj => (
                        <div key={obj.id} className="p-8 rounded-[2rem] bg-white/50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 flex gap-6">
                           <span className="text-gold font-bold">{obj.id}.</span>
                           <p className="font-serif italic leading-relaxed text-stone-600 dark:text-stone-400">{obj.text}</p>
                        </div>
                      ))}
                   </section>

                   <section className="bg-[#fcf8e8] dark:bg-stone-950 p-10 rounded-[3rem] border-l-[16px] border-gold shadow-inner">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-sacred mb-4">Respondeo</h4>
                      <p className="font-serif text-stone-900 dark:text-stone-100 leading-relaxed text-justify">{article.respondeo}</p>
                   </section>
                </div>
             </article>
           ) : !loading && (
             <div className="h-96 flex flex-col items-center justify-center text-center opacity-20 grayscale">
                <Icons.Feather className="w-24 h-24 mb-6" />
                <p className="text-3xl font-serif italic">Selecione uma obra e referência para iniciar a disputa intelectual.</p>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default AquinasOpera;
