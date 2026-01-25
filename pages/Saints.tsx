
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icons } from '../constants';
import { getSaintsList, searchSaint } from '../services/gemini';
import { Saint } from '../types';
import SacredImage from '../components/SacredImage';
import { offlineStorage } from '../services/offlineStorage';
import { useOfflineMode } from '../hooks/useOfflineMode';

const CATEGORIES = ['Todos', 'Apóstolos', 'Mártires', 'Doutores', 'Virgens', 'Papas', 'Místicos'];

const Saints: React.FC = () => {
  const { isOnline } = useOfflineMode();
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [preservedIds, setPreservedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [refreshPreserved]);

  const handleSaintClick = async (saint: Saint) => {
    setLoading(true);
    try {
      // Tentar Memória de Pedra
      const local = await offlineStorage.getContent(`saint_${saint.name}`);
      if (local) {
        setSelectedSaint(local);
      } else if (isOnline) {
        // Se não tem, busca detalhes via IA e "Instala"
        const detailed = await searchSaint(saint.name);
        setSelectedSaint(detailed);
        await offlineStorage.saveContent(`saint_${saint.name}`, 'saint', saint.name, detailed);
        await refreshPreserved();
      } else {
        setSelectedSaint(saint);
      }
    } catch (e) { 
      setSelectedSaint(saint);
    } finally {
      setLoading(false);
    }
  };

  const filteredSaints = useMemo(() => {
    return (saints || []).filter(s => {
      const matchesText = s.name.toLowerCase().includes(filter.toLowerCase()) || 
                          s.patronage.toLowerCase().includes(filter.toLowerCase());
      const matchesCat = activeCategory === 'Todos' || s.patronage.includes(activeCategory);
      return matchesText && matchesCat;
    });
  }, [saints, filter, activeCategory]);

  return (
    <div className="space-y-16 page-enter pb-32">
      <header className="text-center space-y-6">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Sanctorum</h2>
        <div className="bg-emerald-500/10 text-emerald-600 px-6 py-2 rounded-full border border-emerald-500/20 inline-flex items-center gap-2">
           <Icons.Pin className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">{preservedIds.size} Hagiografias Instaladas</span>
        </div>
      </header>

      <nav className="flex overflow-x-auto gap-3 no-scrollbar pb-6 justify-center px-4">
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-sacred text-white border-sacred' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800'}`}
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
        {filteredSaints.map((s, i) => {
          const isInstalled = preservedIds.has(`saint_${s.name}`);
          return (
            <article 
              key={i} 
              onClick={() => handleSaintClick(s)}
              className={`rounded-[3rem] shadow-xl border overflow-hidden cursor-pointer transition-all duration-500 group flex flex-col animate-in fade-in ${isInstalled ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
            >
              <div className="h-64 relative overflow-hidden">
                <SacredImage src={s.image} alt={s.name} className="w-full h-full group-hover:scale-110 transition-transform duration-[10s]" />
                {isInstalled && <div className="absolute top-4 right-4 bg-emerald-500 p-2 rounded-full shadow-lg"><Icons.Pin className="w-3 h-3 text-white" /></div>}
              </div>
              <div className="p-8 space-y-2 flex-1">
                <span className="text-[10px] font-black uppercase text-gold">{s.feastDay}</span>
                <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{s.name}</h3>
              </div>
            </article>
          );
        })}
      </div>

      {selectedSaint && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedSaint(null)}>
          <div className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col border border-stone-100 dark:border-stone-800 animate-modal-zoom" onClick={e => e.stopPropagation()}>
            <div className="h-80 w-full relative">
              <SacredImage src={selectedSaint.image} alt={selectedSaint.name} className="w-full h-full" />
              <button onClick={() => setSelectedSaint(null)} className="absolute top-8 right-8 p-4 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="p-12 md:p-16 flex-1 overflow-y-auto custom-scrollbar space-y-8">
              <header className="space-y-4">
                 <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black uppercase tracking-[0.5em] text-gold">{selectedSaint.feastDay}</span>
                    {preservedIds.has(`saint_${selectedSaint.name}`) && <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20"><Icons.Pin className="w-2.5 h-2.5" /> Preservado</span>}
                 </div>
                 <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">{selectedSaint.name}</h2>
                 <p className="text-sacred dark:text-gold text-2xl font-serif italic">{selectedSaint.patronage}</p>
              </header>
              <div className="bg-[#fcf8e8] dark:bg-stone-800/50 p-10 rounded-[3rem] border-l-8 border-gold">
                 <p className="text-2xl font-serif italic text-stone-800 dark:text-stone-100">"{selectedSaint.quote || 'Ora et Labora.'}"</p>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                 <p className="text-xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{selectedSaint.biography}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
