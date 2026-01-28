
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
    <div className="space-y-10 page-enter pb-48">
      <header className="text-center space-y-8 pt-8">
        <div className="flex justify-center">
          <div className="p-10 bg-white dark:bg-stone-900 rounded-[3rem] shadow-sacred border border-gold/20 rotate-3 transition-transform hover:rotate-0">
            <Icons.Users className="w-16 h-16 text-sacred" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Vidas dos Santos</h2>
          <p className="text-stone-400 italic text-xl md:text-2xl font-serif max-w-2xl mx-auto leading-relaxed">
            "Não temas, porque eu te remi; chamei-te pelo teu nome, tu és meu." — Isaías 43:1
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 space-y-8 pt-4">
          <div className="relative group max-w-2xl mx-auto">
            <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou devoção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-2xl outline-none text-xl font-serif italic focus:ring-16 focus:ring-gold/5 focus:border-gold transition-all"
            />
          </div>
          
          <nav className="flex overflow-x-auto gap-3 no-scrollbar pb-4 justify-start md:justify-center">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-sacred text-white border-sacred scale-105' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800 hover:border-gold'}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 max-w-7xl mx-auto">
        {filteredSaints.map((s, i) => (
          <article 
            key={i} 
            onClick={() => handleSaintClick(s)}
            className="rounded-[3rem] bg-white dark:bg-stone-900 shadow-xl border border-stone-50 dark:border-stone-800 overflow-hidden cursor-pointer transition-all duration-500 group hover:border-gold hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="h-64 relative overflow-hidden">
              <SacredImage src={s.image} alt={s.name} className="w-full h-full" priority={i < 4} />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[8px] font-black uppercase tracking-widest text-gold bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-full">{s.feastDay}</span>
              </div>
            </div>
            <div className="p-8 space-y-2">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-sacred transition-colors">{s.name}</h3>
              <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest leading-none">{s.patronage}</p>
            </div>
          </article>
        ))}
      </div>

      {selectedSaint && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedSaint(null)}>
          <div className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[90vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col animate-modal-zoom relative border border-white/10" onClick={e => e.stopPropagation()}>
            
            <div className="h-80 md:h-[450px] w-full relative overflow-hidden">
              {/* Camada de Brilho Sacro */}
              <div className="absolute inset-0 bg-gold/10 animate-pulse-soft blur-[100px] z-0" />
              
              {/* Imagem com efeito Ken Burns */}
              <div className="w-full h-full animate-ken-burns relative z-10">
                <SacredImage src={selectedSaint.image} alt={selectedSaint.name} className="w-full h-full" priority={true} />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-stone-900 via-transparent to-transparent z-20" />
              
              <button onClick={() => setSelectedSaint(null)} className="absolute top-8 right-8 p-4 bg-stone-900/50 hover:bg-sacred text-white rounded-full transition-all z-30 backdrop-blur-md">
                <Icons.Cross className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-10 md:p-16 flex-1 overflow-y-auto custom-scrollbar space-y-10 -mt-24 relative z-20">
              <header className="space-y-6 text-center md:text-left">
                 <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                    <span className="px-6 py-2 bg-gold text-stone-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{selectedSaint.feastDay}</span>
                    <button 
                      onClick={handleAIEnhance}
                      disabled={loadingAI}
                      className="px-6 py-2 bg-sacred text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-stone-900 transition-all disabled:opacity-50 flex items-center gap-3"
                    >
                      {loadingAI ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icons.Search className="w-3 h-3" />}
                      Investigação Profunda IA
                    </button>
                 </div>
                 <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{selectedSaint.name}</h2>
                 <p className="text-sacred dark:text-gold text-2xl md:text-3xl font-serif italic border-l-[10px] border-gold/20 pl-8 py-2">
                   "{selectedSaint.patronage}"
                 </p>
              </header>

              <div className="prose prose-stone dark:prose-invert max-w-none">
                 <p className="text-xl md:text-2xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed text-justify indent-10 whitespace-pre-wrap">
                   {selectedSaint.biography}
                 </p>
              </div>

              {selectedSaint.quote && (
                <div className="bg-[#fcf8e8] dark:bg-stone-800/40 p-10 md:p-14 rounded-[3.5rem] border-l-[16px] border-gold shadow-inner relative overflow-hidden group">
                   <Icons.Feather className="absolute top-0 right-0 w-48 h-48 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000" />
                   <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-200 leading-snug tracking-tight">
                     "{selectedSaint.quote}"
                   </p>
                   <footer className="mt-6 flex items-center gap-4">
                      <div className="h-px w-12 bg-gold/30" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold">{selectedSaint.name}</span>
                   </footer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="text-center pt-10 pb-20 opacity-30">
         <p className="text-[10px] font-black uppercase tracking-[1em] mb-4">Rogai por nós • Todos os Santos</p>
         <Icons.Cross className="w-8 h-8 mx-auto" />
      </footer>
    </div>
  );
};

export default Saints;
