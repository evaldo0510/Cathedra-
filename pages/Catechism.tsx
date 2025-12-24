
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getDogmaticLinksForCatechism } from '../services/gemini';
import { CatechismParagraph, Dogma } from '../types';
import ActionButtons from '../components/ActionButtons';

const PILLARS = [
  { title: "A Profissão da Fé", desc: "O Credo (Parágrafos 26-1065)", icon: Icons.Cross, color: "#8b0000" },
  { title: "A Celebração dos Mistérios", desc: "Sacramentos (Parágrafos 1066-1690)", icon: Icons.Book, color: "#d4af37" },
  { title: "A Vida em Cristo", desc: "Moralidade (Parágrafos 1691-2557)", icon: Icons.Feather, color: "#1a1a1a" },
  { title: "A Oração Cristã", desc: "Pai Nosso (Parágrafos 2558-2865)", icon: Icons.History, color: "#4a4a4a" }
];

interface CatechismProps {
  onDeepDive?: (topic: string) => void;
}

const Catechism: React.FC<CatechismProps> = ({ onDeepDive }) => {
  const [query, setQuery] = useState('');
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [dogmaticLinks, setDogmaticLinks] = useState<Record<number, Dogma[]>>({});
  const [selectedDogma, setSelectedDogma] = useState<Dogma | null>(null);

  useEffect(() => {
    const handleH = () => setHighlights(JSON.parse(localStorage.getItem('cathedra_highlights') || '[]'));
    window.addEventListener('highlight-change', handleH);
    handleH();
    return () => window.removeEventListener('highlight-change', handleH);
  }, []);

  const handleSearch = async (q?: string) => {
    const term = q || query;
    if (!term.trim()) return;
    setLoading(true);
    setParagraphs([]);
    setDogmaticLinks({});
    try {
      const data = await getCatechismSearch(term);
      setParagraphs(data);
      getDogmaticLinksForCatechism(data).then(links => setDogmaticLinks(links));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-6">
        <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tight text-shadow-sacred">Catecismo da Igreja</h2>
        <p className="text-stone-400 italic text-2xl">"A norma segura para o ensino da fé."</p>
      </header>

      {/* Modal de Dogma */}
      {selectedDogma && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#fdfcf8] max-w-2xl w-full rounded-[4rem] p-12 md:p-16 shadow-3xl border-t-[12px] border-[#8b0000] space-y-10 relative overflow-hidden">
              <button 
                onClick={() => setSelectedDogma(null)}
                className="absolute top-8 right-8 p-4 bg-stone-100 rounded-full hover:bg-[#8b0000] hover:text-white transition-all shadow-md group active:scale-90"
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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PILLARS.map(pillar => (
          <button 
            key={pillar.title} 
            onClick={() => { setQuery(pillar.title); handleSearch(pillar.title); }} 
            className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl hover:-translate-y-2 transition-all text-left flex flex-col group relative overflow-hidden active:scale-95 cursor-pointer"
          >
             <div 
               className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000"
               style={{ color: pillar.color }}
             >
                <pillar.icon className="w-24 h-24" />
             </div>
             <div className="p-5 rounded-2xl mb-8 transition-colors shadow-sm" style={{ backgroundColor: `${pillar.color}15` }}>
                <pillar.icon className="w-8 h-8" style={{ color: pillar.color }} />
             </div>
             <h4 className="font-serif font-bold text-stone-900 text-2xl mb-3 leading-tight group-hover:text-[#8b0000] transition-colors">{pillar.title}</h4>
             <p className="text-stone-400 text-[11px] font-serif italic leading-relaxed">{pillar.desc}</p>
          </button>
        ))}
      </section>

      <section className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl border border-stone-100 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37] to-[#d4af37]/10 opacity-30" />
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative z-10 flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-[#d4af37]/50" />
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex: 'Transubstanciação', 'Justiça Social'..." 
              className="w-full pl-20 pr-10 py-8 bg-stone-50 border border-stone-200 rounded-[2.5rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none text-3xl md:text-4xl font-serif italic shadow-inner transition-all placeholder:text-stone-300"
            />
          </div>
          <button type="submit" className="px-16 py-8 bg-[#1a1a1a] text-[#d4af37] font-black rounded-[2.5rem] hover:bg-[#8b0000] hover:text-white transition-all shadow-xl uppercase tracking-[0.5em] text-xs flex items-center justify-center gap-4 group/btn active:scale-95 cursor-pointer">
            {loading ? (
              <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Icons.Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Consultar</span>
              </>
            )}
          </button>
        </form>
      </section>

      <div className="space-y-12">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-20 rounded-[4rem] animate-pulse border border-stone-50 shadow-sm space-y-8">
               <div className="h-6 w-32 bg-stone-100 rounded-full" />
               <div className="space-y-4">
                  <div className="h-10 bg-stone-50 rounded-2xl w-full" />
                  <div className="h-10 bg-stone-50 rounded-2xl w-5/6" />
               </div>
            </div>
          ))
        ) : paragraphs.length > 0 ? (
          paragraphs.map((p, i) => {
            const pid = `cic_${p.number}`;
            const isHighlighted = highlights.includes(pid);
            const relatedDogmas = dogmaticLinks[p.number];
            
            return (
              <article 
                key={i} 
                className={`p-16 md:p-20 rounded-[4.5rem] border-l-[24px] shadow-2xl relative group transition-all duration-700 animate-in fade-in slide-in-from-bottom-10 ${isHighlighted ? 'bg-[#fcf8e8] border-[#d4af37]' : 'bg-white border-[#8b0000] hover:border-[#d4af37]/40'}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-12 right-12 flex items-center gap-6">
                   {relatedDogmas && relatedDogmas.length > 0 && (
                     <div className="flex flex-wrap gap-2 max-w-[200px] justify-end">
                       {relatedDogmas.map((dogma, dIdx) => (
                         <button 
                           key={dIdx}
                           onClick={() => setSelectedDogma(dogma)}
                           className="flex items-center gap-2 px-4 py-2 bg-[#fcf8e8] border border-[#d4af37]/30 rounded-full hover:bg-[#d4af37] hover:text-white transition-all shadow-md group/dogma active:scale-95 cursor-pointer"
                           title={dogma.title}
                         >
                            <Icons.Cross className="w-4 h-4 text-[#8b0000] group-hover/dogma:text-white transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline truncate max-w-[80px]">{dogma.title}</span>
                         </button>
                       ))}
                     </div>
                   )}
                   <ActionButtons itemId={pid} textToCopy={`CIC ${p.number}: "${p.content}"`} className="bg-stone-50/50 p-3 rounded-3xl" />
                </div>

                <div className="flex items-center gap-6 mb-12">
                  <button 
                    onClick={() => onDeepDive?.(`Catecismo Parágrafo ${p.number}`)}
                    className="bg-[#1a1a1a] text-[#d4af37] px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#8b0000] hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    CIC {p.number}
                  </button>
                  <div className="h-px flex-1 bg-stone-100 opacity-30" />
                </div>

                <p className="text-stone-900 font-serif italic text-3xl md:text-5xl leading-tight tracking-tight">
                  "{p.content}"
                </p>

                <footer className="mt-16 pt-10 border-t border-stone-50/50">
                  <button 
                    onClick={() => onDeepDive?.(`Explicação teológica do CIC ${p.number}`)} 
                    className="flex items-center gap-4 px-10 py-5 bg-stone-50 text-stone-500 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#d4af37] hover:text-white transition-all shadow-sm group/btn active:scale-95 cursor-pointer"
                  >
                    <Icons.Layout className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    <span>Mergulhar na Tradição</span>
                  </button>
                </footer>
              </article>
            );
          })
        ) : query && !loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-white/40 rounded-[5rem] border-2 border-dashed border-stone-200 shadow-inner group">
             <Icons.Cross className="w-24 h-24 text-stone-100 mb-8 opacity-20 group-hover:rotate-12 transition-transform duration-700" />
             <h3 className="text-4xl font-serif italic text-stone-300 tracking-tighter">Nenhum parágrafo identificado.</h3>
             <p className="text-stone-400 font-serif mt-6 italic text-xl">Refine sua busca para encontrar a norma da fé.</p>
          </div>
        ) : (
          <div className="h-[500px] flex flex-col items-center justify-center text-center p-24 bg-white/30 backdrop-blur-sm rounded-[6rem] border-2 border-dashed border-stone-100 shadow-inner group">
             <div className="relative mb-16">
                <div className="absolute inset-0 bg-[#d4af37]/10 blur-[80px] rounded-full scale-150 animate-pulse" />
                <div className="relative z-10 p-12 bg-white rounded-full shadow-3xl border border-stone-50 group-hover:rotate-12 transition-transform duration-700">
                  <Icons.Cross className="w-40 h-40 text-stone-100" />
                </div>
             </div>
             <h3 className="text-5xl font-serif italic text-stone-300 mb-8 tracking-tighter">Lex Credendi, Lex Orandi</h3>
             <p className="text-stone-400 font-serif text-2xl max-w-lg leading-relaxed italic">
               "Este Catecismo foi dado para que a luz da fé seja transmitida integralmente."
             </p>
             <cite className="mt-6 text-[11px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Fidei Depositum • João Paulo II</cite>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catechism;
