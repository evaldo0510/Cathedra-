
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getCatechismSearch, getDogmaticLinksForCatechism } from '../services/gemini';
import { CatechismParagraph, Dogma, AppRoute } from '../types';
import ActionButtons from '../components/ActionButtons';

const PILLARS = [
  { id: 'pillar1', title: "A Profissão da Fé", range: "1 - 1065", desc: "O Credo e a Revelação", icon: Icons.Cross, color: "#8b0000" },
  { id: 'pillar2', title: "A Celebração dos Mistérios", range: "1066 - 1690", desc: "Sacramentos e Liturgia", icon: Icons.Book, color: "#d4af37" },
  { id: 'pillar3', title: "A Vida em Cristo", range: "1691 - 2557", desc: "Moral e Mandamentos", icon: Icons.Feather, color: "#1a1a1a" },
  { id: 'pillar4', title: "A Oração Cristã", range: "2558 - 2865", desc: "O Pai Nosso e a Oração", icon: Icons.History, color: "#4a4a4a" }
];

const COUNCILS = [
  "Todos",
  "Vaticano II",
  "Trento",
  "Constantinopla",
  "Niceia",
  "Calcedônia",
  "Tradição Apostólica"
];

const QUICK_THEMES = [
  "Graça", "Pecado", "Eucaristia", "Balança", "Justificação", "Maria", "Anjos", "Morte"
];

interface CatechismProps {
  onDeepDive?: (topic: string) => void;
  onNavigateDogmas?: (dogmaTitle: string) => void;
}

const Catechism: React.FC<CatechismProps> = ({ onDeepDive, onNavigateDogmas }) => {
  const [query, setQuery] = useState('');
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [dogmaticLinks, setDogmaticLinks] = useState<Record<number, Dogma[]>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePillarId, setActivePillarId] = useState<string | null>(null);
  
  const [selectedCouncil, setSelectedCouncil] = useState('Todos');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    const handleH = () => setHighlights(JSON.parse(localStorage.getItem('cathedra_highlights') || '[]'));
    window.addEventListener('highlight-change', handleH);
    handleH();
    return () => window.removeEventListener('highlight-change', handleH);
  }, []);

  const handleSearch = async (q?: string, pillarId?: string, forceTheme?: string) => {
    const term = q || query;
    const theme = forceTheme || selectedTheme;
    
    if (!term.trim() && !pillarId && !theme) return;
    
    setLoading(true);
    setParagraphs([]);
    setDogmaticLinks({});
    if (pillarId) setActivePillarId(pillarId);

    try {
      const data = await getCatechismSearch(term, { 
        source: selectedCouncil === 'Todos' ? undefined : selectedCouncil,
        theme: theme || undefined
      });
      setParagraphs(data);
      // Busca links dogmáticos em paralelo após carregar os parágrafos
      getDogmaticLinksForCatechism(data).then(links => setDogmaticLinks(links));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCouncil('Todos');
    setSelectedTheme(null);
    setQuery('');
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-32">
      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* Sidebar colapsável de Navegação Canônica */}
        <aside className={`lg:sticky lg:top-32 transition-all duration-300 z-40 ${isSidebarOpen ? 'lg:w-80 w-full' : 'lg:w-20 w-full'}`}>
          <div className="bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl overflow-hidden">
            <header className="p-6 border-b border-stone-50 dark:border-stone-800 flex items-center justify-between">
               {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Canonicum</span>}
               <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className={`p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-stone-400 ${!isSidebarOpen && 'mx-auto'}`}
               >
                 {isSidebarOpen ? <Icons.Layout className="w-5 h-5 rotate-180" /> : <Icons.Menu className="w-6 h-6 text-[#d4af37]" />}
               </button>
            </header>

            <nav className="p-4 space-y-3">
              {PILLARS.map((pillar) => {
                const isActive = activePillarId === pillar.id;
                return (
                  <button 
                    key={pillar.id}
                    onClick={() => { setQuery(pillar.title); handleSearch(pillar.title, pillar.id); }}
                    className={`w-full group relative flex items-center transition-all duration-300 rounded-2xl ${isSidebarOpen ? 'px-6 py-4 gap-5' : 'p-4 justify-center'} ${isActive ? 'bg-[#fcf8e8] dark:bg-stone-800 border-l-4 border-[#d4af37]' : 'hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                  >
                    <div className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isActive ? 'text-[#8b0000]' : 'text-stone-300'}`}>
                      <pillar.icon className="w-6 h-6" />
                    </div>
                    {isSidebarOpen && (
                      <div className="text-left overflow-hidden">
                        <p className={`text-xs font-bold truncate leading-none mb-1 ${isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}>{pillar.title}</p>
                        <p className="text-[8px] font-black uppercase tracking-tighter opacity-40">{pillar.range}</p>
                      </div>
                    )}
                    {!isSidebarOpen && isActive && (
                      <div className="absolute right-0 w-1.5 h-6 bg-[#d4af37] rounded-l-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <div className="flex-1 space-y-8">
          <header className="text-center lg:text-left space-y-2">
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Catecismo da Igreja</h2>
            <p className="text-stone-400 italic text-xl md:text-2xl">"A norma segura para o ensino da fé."</p>
          </header>

          <section className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-end">
               <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Concílio / Fonte de Autoridade</label>
                  <div className="flex flex-wrap gap-2">
                     {COUNCILS.map(council => (
                       <button 
                        key={council} 
                        onClick={() => setSelectedCouncil(council)}
                        className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${selectedCouncil === council ? 'bg-[#1a1a1a] text-[#d4af37] border-[#1a1a1a] shadow-md' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-100 dark:border-stone-700 hover:border-[#d4af37]'}`}
                       >
                         {council}
                       </button>
                     ))}
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-2 justify-end">
                  <button 
                    onClick={clearFilters}
                    className="px-6 py-2 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-[#8b0000] transition-colors"
                  >
                    Limpar Filtros
                  </button>
               </div>
            </div>

            <div className="h-px bg-stone-50 dark:bg-stone-800" />

            <div className="flex flex-wrap items-center gap-3">
               <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 mr-2">Temas Comuns:</span>
               {QUICK_THEMES.map(theme => (
                 <button 
                  key={theme} 
                  onClick={() => { setSelectedTheme(theme); handleSearch(query, undefined, theme); }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-serif italic transition-all ${selectedTheme === theme ? 'bg-[#fcf8e8] text-[#8b0000] border border-[#d4af37]/40 shadow-sm' : 'bg-white dark:bg-stone-900 text-stone-400 border border-stone-50 dark:border-stone-800'}`}
                 >
                   {theme}
                 </button>
               ))}
            </div>
          </section>

          <section className="bg-white dark:bg-stone-900 p-8 md:p-14 rounded-[3.5rem] md:rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37] to-[#d4af37]/10 opacity-30" />
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative z-10 flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative">
                <Icons.Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-[#d4af37]/50" />
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Pesquise por conceito (ex: O que a Igreja diz sobre a tristeza?)..." 
                  className="w-full pl-20 pr-10 py-7 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-200 dark:border-stone-700 rounded-[2rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none text-2xl md:text-3xl font-serif italic shadow-inner transition-all placeholder:text-stone-300"
                />
              </div>
              <button type="submit" className="px-12 py-7 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 font-black rounded-[2rem] hover:bg-[#8b0000] hover:text-white transition-all shadow-xl uppercase tracking-[0.5em] text-xs flex items-center justify-center gap-4 group/btn active:scale-95">
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

          <div className="space-y-10">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 p-16 rounded-[4rem] animate-pulse border border-stone-100 dark:border-stone-800 shadow-sm space-y-8">
                  <div className="h-6 w-32 bg-stone-100 dark:bg-stone-800 rounded-full" />
                  <div className="space-y-4">
                    <div className="h-10 bg-stone-50 dark:bg-stone-800/50 rounded-2xl w-full" />
                    <div className="h-10 bg-stone-50 dark:bg-stone-800/50 rounded-2xl w-5/6" />
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
                    className={`p-12 md:p-16 rounded-[4rem] border-l-[20px] shadow-2xl relative group transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${isHighlighted ? 'bg-[#fcf8e8] border-[#d4af37]' : 'bg-white dark:bg-stone-900 border-[#8b0000] hover:border-[#d4af37]/40 dark:border-[#8b0000]/50'}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="absolute top-10 right-10 flex items-center gap-6">
                       {relatedDogmas && relatedDogmas.length > 0 && (
                         <div className="flex flex-wrap gap-2 max-w-[200px] justify-end">
                           {relatedDogmas.map((dogma, dIdx) => (
                             <button 
                               key={dIdx}
                               onClick={() => onNavigateDogmas?.(dogma.title)}
                               className="flex items-center gap-2 px-4 py-2 bg-[#fcf8e8] dark:bg-stone-800 border border-[#d4af37]/30 rounded-full hover:bg-[#d4af37] hover:text-white transition-all shadow-md group/dogma active:scale-95"
                               title={`Ver Dogma: ${dogma.title}`}
                             >
                                <Icons.Cross className="w-4 h-4 text-[#8b0000] group-hover/dogma:text-white transition-colors" />
                                <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline truncate max-w-[80px]">{dogma.title}</span>
                             </button>
                           ))}
                         </div>
                       )}
                       <ActionButtons itemId={pid} textToCopy={`CIC ${p.number}: "${p.content}"`} className="bg-stone-50/50 dark:bg-stone-800/50 p-3 rounded-3xl" />
                    </div>

                    <div className="flex items-center gap-6 mb-10">
                      <button 
                        onClick={() => onDeepDive?.(`Catecismo Parágrafo ${p.number}`)}
                        className="bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#8b0000] hover:text-white transition-all shadow-lg active:scale-95"
                      >
                        CIC {p.number}
                      </button>
                      <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800 opacity-30" />
                      {p.source && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">{p.source}</span>
                      )}
                    </div>

                    <p className="text-stone-900 dark:text-stone-100 font-serif italic text-2xl md:text-4xl leading-snug tracking-tight">
                      "{p.content}"
                    </p>

                    <footer className="mt-12 pt-8 border-t border-stone-50/50 dark:border-stone-800 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex gap-2">
                        {p.tags?.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-stone-50 dark:bg-stone-800 text-[9px] font-black uppercase tracking-tighter text-stone-400 rounded-lg">#{tag}</span>
                        ))}
                      </div>
                      <button 
                        onClick={() => onDeepDive?.(`Explicação teológica do CIC ${p.number}`)} 
                        className="flex items-center gap-4 px-8 py-4 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#d4af37] hover:text-white transition-all shadow-sm group/btn"
                      >
                        <Icons.Layout className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span>Mergulhar na Tradição</span>
                      </button>
                    </footer>
                  </article>
                );
              })
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-white/30 dark:bg-stone-900/30 backdrop-blur-sm rounded-[5rem] border-2 border-dashed border-stone-100 dark:border-stone-800 shadow-inner group">
                 <div className="relative mb-12">
                    <div className="absolute inset-0 bg-[#d4af37]/10 blur-[60px] rounded-full scale-150 animate-pulse" />
                    <div className="relative z-10 p-10 bg-white dark:bg-stone-900 rounded-full shadow-2xl border border-stone-50 dark:border-stone-800">
                      <Icons.Cross className="w-24 h-24 text-stone-100 dark:text-stone-800" />
                    </div>
                 </div>
                 <h3 className="text-3xl font-serif italic text-stone-300 dark:text-stone-700 mb-4 tracking-tighter">Lex Credendi, Lex Orandi</h3>
                 <p className="text-stone-400 font-serif text-xl max-w-lg leading-relaxed italic">
                   "Este Catecismo foi dado para que a luz da fé seja transmitida integralmente."
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catechism;
