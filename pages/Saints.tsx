
import React, { useState, useMemo, useContext } from 'react';
import { Icons } from '../constants';
import { searchSaint } from '../services/gemini';
import { Saint } from '../types';
import SacredImage from '../components/SacredImage';
import { NATIVE_SAINTS } from '../services/nativeData';
import { LangContext } from '../App';

const CATEGORIES = ['Todos', 'Apóstolos', 'Mártires', 'Doutores', 'Virgens', 'Místicos', 'Papas'];

const Saints: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [loadingAI, setLoadingAI] = useState(false);

  const handleSaintClick = (saint: Saint) => {
    setSelectedSaint(saint);
  };

  const handleAIEnhance = async () => {
    if (!selectedSaint) return;
    setLoadingAI(true);
    try {
      const detailed = await searchSaint(selectedSaint.name);
      setSelectedSaint({ ...selectedSaint, ...detailed });
    } catch (e) {
      console.warn("Houve um problema ao conectar com a IA. Exibindo dados locais.");
    } finally {
      setLoadingAI(false);
    }
  };

  const filteredSaints = useMemo(() => {
    return NATIVE_SAINTS.filter(s => {
      const textMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.patronage.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeCategory === 'Todos') return textMatch;
      return textMatch && s.biography.toLowerCase().includes(activeCategory.toLowerCase().slice(0, -1));
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="space-y-8 md:space-y-12 page-enter pb-32 md:pb-48">
      <header className="text-center space-y-6 md:space-y-8 pt-4 md:pt-8 px-4">
        <div className="flex justify-center">
          <div className="p-6 md:p-10 bg-white dark:bg-stone-900 rounded-[2.5rem] md:rounded-[3rem] shadow-sacred border border-gold/20 rotate-3 transition-transform hover:rotate-0">
            <Icons.Users className="w-12 h-12 md:w-16 md:h-16 text-sacred" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter leading-none">Vidas dos Santos</h2>
          <p className="text-stone-400 italic text-lg md:text-2xl font-serif max-w-2xl mx-auto leading-relaxed">
            "Não temas, porque eu te remi; chamei-te pelo teu nome, tu és meu."
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 pt-4">
          <div className="relative group max-w-2xl mx-auto w-full px-2">
            <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-gold transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou devoção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 md:py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full md:rounded-[2.5rem] shadow-2xl outline-none text-base md:text-xl font-serif italic focus:border-gold transition-all"
            />
          </div>
          
          {/* CATEGORY CAROUSEL - IMPROVED MOBILE UX */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#fdfcf8] dark:from-[#0c0a09] to-transparent z-10 pointer-events-none sm:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#fdfcf8] dark:from-[#0c0a09] to-transparent z-10 pointer-events-none sm:hidden" />
            <nav className="flex overflow-x-auto gap-3 no-scrollbar pb-4 px-6 justify-start sm:justify-center -mx-4">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 md:px-8 py-2.5 md:py-3 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-sacred text-white border-sacred scale-105' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800 hover:border-gold'}`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-4 max-w-7xl mx-auto">
        {filteredSaints.map((s, i) => (
          <article 
            key={i} 
            onClick={() => handleSaintClick(s)}
            className="rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-stone-900 shadow-xl border border-stone-50 dark:border-stone-800 overflow-hidden cursor-pointer transition-all duration-500 group hover:border-gold hover:-translate-y-2"
          >
            <div className="h-48 md:h-64 relative overflow-hidden">
              <SacredImage src={s.image} alt={s.name} className="w-full h-full" priority={i < 4} />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6">
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-gold bg-stone-900/80 backdrop-blur-md px-2 md:px-3 py-1 rounded-full">{s.feastDay}</span>
              </div>
            </div>
            <div className="p-5 md:p-8 space-y-1 md:space-y-2">
              <h3 className="text-lg md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-sacred transition-colors">{s.name}</h3>
              <p className="text-[8px] md:text-[10px] text-stone-400 font-black uppercase tracking-widest leading-none truncate">{s.patronage}</p>
            </div>
          </article>
        ))}
      </div>

      {/* DETALHE MODAL - MOBILE RESPONSIVE */}
      {selectedSaint && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in" onClick={() => setSelectedSaint(null)}>
          <div className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[95dvh] rounded-[2.5rem] md:rounded-[4rem] shadow-4xl overflow-hidden flex flex-col animate-modal-zoom relative border border-white/10" onClick={e => e.stopPropagation()}>
            
            <div className="h-48 sm:h-64 md:h-[400px] w-full relative overflow-hidden shrink-0">
              <div className="w-full h-full animate-ken-burns relative z-10">
                <SacredImage src={selectedSaint.image} alt={selectedSaint.name} className="w-full h-full" priority={true} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-stone-900 via-transparent to-transparent z-20" />
              <button onClick={() => setSelectedSaint(null)} className="absolute top-4 right-4 p-3 md:p-4 bg-stone-900/50 hover:bg-sacred text-white rounded-full transition-all z-40 backdrop-blur-md">
                <Icons.Cross className="w-4 h-4 md:w-6 md:h-6 rotate-45" />
              </button>
            </div>

            <div className="px-6 md:px-16 pb-8 md:pb-16 flex-1 overflow-y-auto custom-scrollbar space-y-8 -mt-16 md:-mt-24 relative z-20">
              <header className="space-y-4 text-center md:text-left pt-4">
                 <div className="flex flex-wrap items-center gap-2 md:gap-4 justify-center md:justify-start">
                    <span className="px-4 py-1.5 bg-gold text-stone-900 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">{selectedSaint.feastDay}</span>
                    <button 
                      onClick={handleAIEnhance}
                      disabled={loadingAI}
                      className="px-4 py-1.5 bg-sacred text-white rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
                    >
                      {loadingAI ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icons.Search className="w-3 h-3" />}
                      Investigar IA
                    </button>
                 </div>
                 <h2 className="text-3xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{selectedSaint.name}</h2>
                 <p className="text-sacred dark:text-gold text-lg md:text-3xl font-serif italic border-l-4 md:border-l-[10px] border-gold/20 pl-4 md:pl-8 py-1 md:py-2">
                   "{selectedSaint.patronage}"
                 </p>
              </header>

              <div className="prose prose-stone dark:prose-invert max-w-none">
                 <p className="text-lg md:text-2xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed text-justify md:indent-10 whitespace-pre-wrap">
                   {selectedSaint.biography}
                 </p>
              </div>

              {selectedSaint.quote && (
                <div className="bg-[#fcf8e8] dark:bg-stone-800/40 p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] border-l-[8px] md:border-l-[16px] border-gold shadow-inner relative overflow-hidden group">
                   <p className="text-xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug tracking-tight">
                     "{selectedSaint.quote}"
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
