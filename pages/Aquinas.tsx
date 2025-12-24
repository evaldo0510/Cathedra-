
import React, { useState } from 'react';
import { Icons } from '../constants';
import { getThomisticSynthesis } from '../services/gemini';

interface ThomisticSynthesis {
  title: string;
  objections: string[];
  sedContra: string;
  respondeo: string;
  replies: string[];
}

const Aquinas: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [synthesis, setSynthesis] = useState<ThomisticSynthesis | null>(null);

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

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="p-6 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred">
              <Icons.Feather className="w-16 h-16 text-[#8b0000]" />
           </div>
        </div>
        <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tight">Biblioteca do Aquinate</h2>
        <p className="text-stone-400 italic text-2xl">Mergulhe no método escolástico do Doutor Angélico.</p>
      </header>

      <section className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-stone-100">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37] mb-8">Investigação Escolástica (Disputatio)</h3>
        <form onSubmit={handleDisputatio} className="flex flex-col md:flex-row gap-6">
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ex: A existência de Deus, A natureza da Alma..." 
            className="flex-1 px-10 py-8 bg-stone-50 border border-stone-200 rounded-[2.5rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none text-2xl font-serif italic shadow-inner"
          />
          <button type="submit" disabled={loading} className="px-12 py-8 bg-[#1a1a1a] text-[#d4af37] font-black rounded-[2.5rem] hover:bg-[#8b0000] hover:text-white transition-all shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-4">
             {loading ? <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <> <Icons.Feather className="w-5 h-5" /> <span>Disputar</span></>}
          </button>
        </form>
      </section>

      {synthesis && (
        <article className="sacred-background parchment p-12 md:p-24 rounded-[5rem] border border-[#d4af37]/20 shadow-2xl space-y-16 animate-in slide-in-from-bottom-10 duration-700">
           <header className="text-center border-b border-[#d4af37]/10 pb-12">
              <span className="text-[12px] font-black uppercase tracking-[1em] text-[#8b0000]">Quaestio Disputata</span>
              <h3 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 mt-6 leading-tight">Artigo: {synthesis.title}</h3>
           </header>

           <div className="grid lg:grid-cols-12 gap-16">
              {/* Margem Escolástica */}
              <aside className="lg:col-span-3 hidden lg:block space-y-8 border-r border-stone-100 pr-8">
                 <div className="sticky top-12 space-y-8">
                    <div className="space-y-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Referência Cruzada</span>
                       <p className="text-[11px] text-stone-400 font-serif italic italic leading-relaxed">Suma Teológica, Iª Pars, Q. 2, Art. 3</p>
                    </div>
                    <div className="p-6 bg-[#fcf8e8] rounded-3xl border border-[#d4af37]/10">
                       <p className="text-[10px] text-stone-500 font-serif italic">"A graça não destrói a natureza, mas a aperfeiçoa."</p>
                    </div>
                 </div>
              </aside>

              <div className="lg:col-span-9 space-y-16">
                 {/* Objeções */}
                 <section className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000]">I. Videtur Quod (Objeções)</h4>
                    <div className="space-y-8">
                       {synthesis.objections.map((obj, i) => (
                         <div key={i} className="flex gap-6 items-start">
                            <span className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center font-bold flex-shrink-0 text-sm">{i+1}</span>
                            <p className="text-2xl font-serif italic text-stone-600 leading-relaxed">"{obj}"</p>
                         </div>
                       ))}
                    </div>
                 </section>

                 {/* Sed Contra */}
                 <section className="bg-[#fcf8e8] p-12 rounded-[3.5rem] border-l-[12px] border-[#d4af37] shadow-sm">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000] mb-6">II. Sed Contra (Em contrário)</h4>
                    <p className="text-3xl font-serif font-bold text-stone-800 leading-relaxed italic">
                       "{synthesis.sedContra}"
                    </p>
                 </section>

                 {/* Respondeo */}
                 <section className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#d4af37]">III. Respondeo (O Doutor Responde)</h4>
                    <p className="text-3xl md:text-4xl font-serif text-stone-900 leading-snug tracking-tight">
                       {synthesis.respondeo}
                    </p>
                 </section>

                 {/* Ad Rationes */}
                 <section className="space-y-6 pt-12 border-t border-stone-100">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">IV. Ad Rationes (Solução das Objeções)</h4>
                    <div className="space-y-8">
                       {synthesis.replies.map((reply, i) => (
                         <div key={i} className="flex gap-6 items-start">
                            <span className="w-10 h-10 rounded-full bg-[#8b0000] text-white flex items-center justify-center font-bold flex-shrink-0 text-sm shadow-md">R{i+1}</span>
                            <p className="text-xl font-serif text-stone-600 leading-relaxed italic">{reply}</p>
                         </div>
                       ))}
                    </div>
                 </section>
              </div>
           </div>

           <footer className="text-center pt-12 border-t border-[#d4af37]/10">
              <p className="text-[10px] font-black uppercase tracking-[0.8em] text-stone-300">Doutor Comum • Ordem dos Pregadores</p>
           </footer>
        </article>
      )}

      {!synthesis && !loading && (
        <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-white/40 rounded-[5rem] border-2 border-dashed border-stone-200 shadow-inner group">
           <Icons.Feather className="w-24 h-24 text-stone-200 mb-8 opacity-20 group-hover:rotate-12 transition-transform duration-700" />
           <h3 className="text-3xl font-serif italic text-stone-300">Apresente um tema para ser submetido à Disputatio.</h3>
           <p className="text-stone-300 font-serif mt-4 italic">"Estudar é orar com o intelecto."</p>
        </div>
      )}
    </div>
  );
};

export default Aquinas;
