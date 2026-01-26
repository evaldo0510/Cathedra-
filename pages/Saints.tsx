
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
        console.error("Erro ao carregar lista de santos:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetch();
  }, [refreshPreserved]);

  const handleSaintClick = async (saint: Saint) => {
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
      } else {
        setSelectedSaint(saint);
      }
    } catch (e) { 
      setSelectedSaint(saint);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredSaints = useMemo(() => {
    return (saints || []).filter(s => {
      const matchesText = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.patronage.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = activeCategory === 'Todos' || 
                         s.patronage.toLowerCase().includes(activeCategory.toLowerCase()) ||
                         (s.biography && s.biography.toLowerCase().includes(activeCategory.toLowerCase()));
      return matchesText && matchesCat;
    });
  }, [saints, searchTerm, activeCategory]);

  return (
    <div className="space-y-12 page-enter pb-32">
      <header className="text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Sanctorum</h2>
          <p className="text-stone-400 italic text-2xl font-serif">"Eis a nuvem de testemunhas que nos cerca."</p>
        </div>

        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <div className="relative group">
            <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors" />
            <input 
              type="text"
              placeholder="Buscar por nome ou patrocínio (ex: Santo Agostinho, Mártir...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-2xl outline-none focus:border-gold transition-all text-xl font-serif italic"
            />
          </div>

          <nav className="flex overflow-x-auto gap-3 no-scrollbar pb-2 justify-start md:justify-center">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-sacred text-white border-sacred' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800 hover:border-gold/50'}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse space-y-6">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-serif italic text-stone-400">Consultando o Martirológio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
          {filteredSaints.map((s, i) => {
            const isInstalled = preservedIds.has(`saint_${s.name.replace(/\s+/g, '_')}`);
            return (
              <article 
                key={i} 
                onClick={() => handleSaintClick(s)}
                className={`rounded-[3rem] shadow-xl border overflow-hidden cursor-pointer transition-all duration-500 group flex flex-col animate-in fade-in ${isInstalled ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'} hover:-translate-y-2 hover:shadow-2xl hover:border-gold`}
              >
                <div className="h-64 relative overflow-hidden">
                  <SacredImage 
                    src={s.image} 
                    alt={s.name} 
                    className="w-full h-full group-hover:scale-110 transition-transform duration-[10s]" 
                    priority={i < 8}
                  />
                  {isInstalled && <div className="absolute top-4 right-4 bg-emerald-500 p-2 rounded-full shadow-lg border-2 border-white"><Icons.Pin className="w-3 h-3 text-white" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Abrir Biografia</span>
                  </div>
                </div>
                <div className="p-8 space-y-2 flex-1">
                  <span className="text-[10px] font-black uppercase text-gold">{s.feastDay}</span>
                  <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-gold transition-colors">{s.name}</h3>
                  <p className="text-[9px] text-stone-400 uppercase tracking-tighter line-clamp-1">{s.patronage}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {loadingDetails && (
        <div className="fixed inset-0 z-[600] bg-black/20 backdrop-blur-sm flex items-center justify-center">
           <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-4xl flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="font-serif italic text-gold">Invocando a história...</p>
           </div>
        </div>
      )}

      {selectedSaint && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedSaint(null)}>
          <div className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[90vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-stone-100 dark:border-stone-800 animate-modal-zoom relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedSaint(null)} className="absolute top-8 right-8 z-[600] p-4 bg-black/40 hover:bg-sacred backdrop-blur-md text-white rounded-full transition-all group shadow-2xl">
              <Icons.Cross className="w-6 h-6 rotate-45 group-hover:scale-110 transition-transform" />
            </button>

            <div className="h-96 w-full relative">
              <SacredImage src={selectedSaint.image} alt={selectedSaint.name} className="w-full h-full" priority={true} />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-stone-900 via-transparent to-transparent" />
            </div>

            <div className="p-12 md:p-20 flex-1 overflow-y-auto custom-scrollbar space-y-12 -mt-24 relative z-10">
              <header className="space-y-6 text-center md:text-left">
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <span className="px-6 py-2 bg-gold text-stone-900 rounded-full text-[10px] font-black uppercase tracking-[0.5em] shadow-lg">{selectedSaint.feastDay}</span>
                    {preservedIds.has(`saint_${selectedSaint.name.replace(/\s+/g, '_')}`) && (
                      <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20"><Icons.Pin className="w-3 h-3" /> Memória Local</span>
                    )}
                 </div>
                 <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{selectedSaint.name}</h2>
                 <p className="text-sacred dark:text-gold text-2xl md:text-3xl font-serif italic border-l-4 border-gold/30 pl-6">{selectedSaint.patronage}</p>
              </header>

              {selectedSaint.quote && (
                <div className="bg-[#fcf8e8] dark:bg-stone-800/50 p-12 rounded-[3.5rem] border-l-[16px] border-gold shadow-inner">
                   <p className="text-3xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-100 leading-snug tracking-tight">
                     "{selectedSaint.quote}"
                   </p>
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none">
                 <p className="text-xl md:text-2xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed text-justify whitespace-pre-wrap">
                   {selectedSaint.biography || "Biografia sendo processada pela Inteligência do Santuário..."}
                 </p>
              </div>
              
              <div className="flex justify-center pt-10 opacity-10">
                <Icons.Cross className="w-20 h-20" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
