
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icons } from '../constants';
import { getSaintsList, searchSaint } from '../services/gemini';
import { Saint } from '../types';
import SacredImage from '../components/SacredImage';
import { offlineStorage } from '../services/offlineStorage';
import { useOfflineMode } from '../hooks/useOfflineMode';

const CATEGORIES = ['Todos', 'Apóstolos', 'Mártires', 'Doutores', 'Virgens', 'Papas', 'Místicos', 'Fundadores'];

const Saints: React.FC = () => {
  const { isOnline } = useOfflineMode();
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [preservedIds, setPreservedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const refreshPreserved = useCallback(async () => {
    const ids = await offlineStorage.getPreservedIds('saint');
    setPreservedIds(ids);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      await refreshPreserved();
      try {
        const data = await getSaintsList();
        setSaints(data);
      } catch (e) { 
        console.error(e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetch();
  }, [refreshPreserved]);

  const handleSaintClick = async (saint: Saint) => {
    // Primeiro, abrimos o que temos (o card básico)
    setSelectedSaint(saint);
    setLoadingDetails(true);

    try {
      const storageId = `saint_${saint.name.replace(/\s+/g, '_')}`;
      const local = await offlineStorage.getContent(storageId);
      
      if (local) {
        setSelectedSaint(local);
      } else if (isOnline) {
        const detailed = await searchSaint(saint.name);
        setSelectedSaint(detailed);
        await offlineStorage.saveContent(storageId, 'saint', saint.name, detailed);
        await refreshPreserved();
      }
    } catch (e) { 
      console.warn("Usando dados básicos do santo.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredSaints = useMemo(() => {
    return (saints || []).filter(s => {
      const textMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.patronage.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeCategory === 'Todos') return textMatch;
      
      // Lógica de filtragem por categoria nas strings de patrocínio ou biografia
      const categoryKeywords: Record<string, string[]> = {
        'Apóstolos': ['apóstolo', 'apostolo'],
        'Mártires': ['mártir', 'martir', 'martírio'],
        'Doutores': ['doutor', 'doctor'],
        'Virgens': ['virgem', 'virgo'],
        'Papas': ['papa', 'pontífice'],
        'Místicos': ['místico', 'mística', 'visões'],
        'Fundadores': ['fundador', 'fundou']
      };

      const keywords = categoryKeywords[activeCategory] || [activeCategory.toLowerCase()];
      const categoryMatch = keywords.some(k => 
        s.patronage.toLowerCase().includes(k) || 
        s.biography.toLowerCase().includes(k)
      );

      return textMatch && categoryMatch;
    });
  }, [saints, searchTerm, activeCategory]);

  return (
    <div className="space-y-10 page-enter pb-40">
      <header className="text-center space-y-6 pt-6">
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Santos (Sanctorum)</h2>
        <p className="text-stone-400 italic text-xl font-serif">"Eis a nuvem de testemunhas que nos cerca."</p>

        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="relative group">
            <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-gold transition-colors" />
            <input 
              type="text"
              placeholder="Buscar santo ou causa (ex: Santa Rita, causas impossíveis)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl shadow-xl outline-none focus:border-gold transition-all text-lg font-serif italic"
            />
          </div>

          <nav className="flex overflow-x-auto gap-2 no-scrollbar pb-2 justify-start md:justify-center">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeCategory === cat ? 'bg-sacred text-white border-sacred shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800'}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse space-y-4">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-serif italic text-stone-400">Consultando o Martirológio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
          {filteredSaints.map((s, i) => {
            const isInstalled = preservedIds.has(`saint_${s.name.replace(/\s+/g, '_')}`);
            return (
              <article 
                key={i} 
                onClick={() => handleSaintClick(s)}
                className={`rounded-[2.5rem] shadow-lg border overflow-hidden cursor-pointer transition-all duration-500 group flex flex-col ${isInstalled ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'} hover:border-gold hover:-translate-y-1`}
              >
                <div className="h-56 relative overflow-hidden">
                  <SacredImage src={s.image} alt={s.name} className="w-full h-full group-hover:scale-110 transition-transform duration-[8s]" priority={i < 4} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-[8px] font-black uppercase tracking-widest">Ver História</span>
                  </div>
                </div>
                <div className="p-6 space-y-1">
                  <span className="text-[9px] font-black uppercase text-gold">{s.feastDay}</span>
                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight truncate">{s.name}</h3>
                  <p className="text-[8px] text-stone-400 uppercase tracking-tighter line-clamp-1">{s.patronage}</p>
                </div>
              </article>
            );
          })}
          {filteredSaints.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 opacity-40">
               <Icons.Users className="w-12 h-12 mx-auto text-stone-300" />
               <p className="font-serif italic text-xl">Nenhum santo encontrado para esta categoria ou busca.</p>
            </div>
          )}
        </div>
      )}

      {selectedSaint && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedSaint(null)}>
          <div className="bg-white dark:bg-stone-900 w-full max-w-3xl max-h-[85vh] rounded-[3.5rem] shadow-4xl overflow-hidden flex flex-col animate-modal-zoom relative" onClick={e => e.stopPropagation()}>
            
            <div className="h-64 md:h-80 w-full relative">
              <SacredImage src={selectedSaint.image} alt={selectedSaint.name} className="w-full h-full" priority={true} />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-stone-900 via-transparent to-transparent" />
              <button onClick={() => setSelectedSaint(null)} className="absolute top-6 right-6 p-4 bg-black/40 hover:bg-sacred text-white rounded-full transition-all z-20 shadow-2xl">
                <Icons.Cross className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-8 md:p-12 flex-1 overflow-y-auto custom-scrollbar space-y-8 -mt-12 relative z-10">
              <header className="space-y-4 text-center md:text-left">
                 <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <span className="px-5 py-1.5 bg-gold text-stone-900 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-lg inline-block">{selectedSaint.feastDay}</span>
                    {loadingDetails && <span className="text-[8px] font-black uppercase text-gold animate-pulse">Carregando detalhes profundos...</span>}
                 </div>
                 <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">{selectedSaint.name}</h2>
                 <p className="text-sacred dark:text-gold text-lg md:text-2xl font-serif italic border-l-4 border-gold/30 pl-4">{selectedSaint.patronage}</p>
              </header>

              <div className="prose dark:prose-invert max-w-none">
                 <p className="text-lg md:text-xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed text-justify whitespace-pre-wrap italic">
                   {selectedSaint.biography || "Processando vida heróica..."}
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
