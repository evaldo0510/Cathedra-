
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { getSaintsList } from '../services/gemini';
import { Saint } from '../types';

const SacredImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fallback = "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800";

  return (
    <div className={`relative bg-stone-100 dark:bg-stone-800 ${className} flex items-center justify-center overflow-hidden`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50 dark:bg-stone-900 z-10">
          <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      <img 
        src={error || !src ? fallback : src} 
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  );
};

const Saints: React.FC = () => {
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = ['Todos', 'Apóstolos', 'Mártires', 'Doutores', 'Virgens', 'Papas'];

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
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
  }, []);

  const filteredSaints = useMemo(() => {
    return saints.filter(s => {
      const matchesText = s.name.toLowerCase().includes(filter.toLowerCase()) || 
                          s.patronage.toLowerCase().includes(filter.toLowerCase());
      const matchesCat = activeCategory === 'Todos' || s.patronage.includes(activeCategory);
      return matchesText && matchesCat;
    });
  }, [saints, filter, activeCategory]);

  return (
    <div className="space-y-12 page-enter pb-32">
      <header className="text-center space-y-6 max-w-3xl mx-auto">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Sanctorum</h2>
        <p className="text-sacred dark:text-stone-400 font-serif italic text-xl md:text-2xl">"A Nuvem de Testemunhas que intercede por nós."</p>
        
        <div className="relative group">
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou patrocínio..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xl focus:ring-4 focus:ring-gold/10 outline-none font-serif italic text-lg transition-all"
          />
        </div>
      </header>

      {/* Categorias Profissionais */}
      <nav className="flex overflow-x-auto gap-3 no-scrollbar pb-4 justify-start md:justify-center">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeCategory === cat ? 'bg-sacred text-white border-sacred shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800 hover:border-gold'}`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(n => <div key={n} className="h-96 bg-stone-100 dark:bg-stone-800 rounded-[2.5rem] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredSaints.map((s, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSaint(s)}
              className="bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-500 group flex flex-col"
            >
              <SacredImage src={s.image || ''} alt={s.name} className="h-72 w-full" />
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gold">{s.feastDay}</span>
                  <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">{s.name}</h3>
                </div>
                <p className="text-[8px] font-black uppercase tracking-tighter text-stone-400 mt-4 border-t border-stone-50 dark:border-stone-800 pt-3">{s.patronage}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSaint && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedSaint(null)}>
          <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-4xl rounded-[3rem] shadow-3xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh] border border-white/10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedSaint(null)} className="absolute top-6 right-6 p-3 bg-black/20 hover:bg-sacred rounded-full transition-all z-30">
              <Icons.Cross className="w-5 h-5 rotate-45 text-white" />
            </button>

            <div className="md:w-1/2 h-64 md:h-auto overflow-hidden">
               <SacredImage src={selectedSaint.image || ''} alt={selectedSaint.name} className="w-full h-full" />
            </div>

            <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto custom-scrollbar space-y-6">
              <header>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Memorial</span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedSaint.name}</h2>
                <div className="flex gap-2 mt-4">
                  <span className="px-4 py-1.5 bg-sacred text-white text-[8px] font-black uppercase rounded-full">{selectedSaint.feastDay}</span>
                </div>
              </header>
              <p className="text-stone-700 dark:text-stone-300 font-serif italic text-lg leading-relaxed whitespace-pre-line">{selectedSaint.biography}</p>
              {selectedSaint.quote && (
                <blockquote className="bg-gold/10 p-6 rounded-2xl italic font-serif text-xl border-l-4 border-gold">"{selectedSaint.quote}"</blockquote>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
