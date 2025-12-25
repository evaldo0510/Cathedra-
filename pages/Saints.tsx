
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getSaintsList } from '../services/gemini';
import { Saint } from '../types';

/**
 * Componente de imagem resiliente para arte sacra
 */
const SacredImage: React.FC<{ src: string, alt: string, className: string }> = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Imagem de fallback: Detalhe de uma catedral clássica
  const fallback = "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && <div className="absolute inset-0 bg-stone-100 dark:bg-stone-800 animate-pulse flex items-center justify-center">
        <Icons.Cross className="w-12 h-12 text-stone-200 dark:text-stone-700" />
      </div>}
      <img 
        src={error || !src ? fallback : src} 
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
        className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

const Saints: React.FC = () => {
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);

  useEffect(() => {
    const fetchSaints = async () => {
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
    fetchSaints();
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Nuvem de Testemunhas</h2>
        <p className="text-stone-400 italic font-serif text-2xl max-w-2xl mx-auto">"Nós, cercados de tão grande nuvem de testemunhas, corramos com perseverança."</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[500px] bg-white dark:bg-stone-900 rounded-[3rem] animate-pulse border border-stone-100 dark:border-stone-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {saints.map((s, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSaint(s)}
              className="bg-white dark:bg-stone-900 rounded-[3rem] shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-500 group"
            >
              <SacredImage src={s.image || ''} alt={s.name} className="h-[400px]" />
              <div className="p-10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">{s.feastDay}</span>
                  <Icons.Cross className="w-4 h-4 text-[#8b0000]/30" />
                </div>
                <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{s.name}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">{s.patronage}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSaint && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-5xl rounded-[4rem] shadow-3xl overflow-hidden relative animate-in zoom-in-95 duration-500 flex flex-col md:flex-row max-h-[90vh]">
            <button onClick={() => setSelectedSaint(null)} className="absolute top-8 right-8 p-3 bg-white/20 hover:bg-white/40 rounded-full transition-all z-20">
              <Icons.Cross className="w-6 h-6 rotate-45 text-white" />
            </button>
            <SacredImage src={selectedSaint.image || ''} alt={selectedSaint.name} className="md:w-1/2 h-[300px] md:h-auto" />
            <div className="md:w-1/2 p-12 md:p-20 overflow-y-auto custom-scrollbar space-y-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Venerável Exemplo</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-2 leading-tight">{selectedSaint.name}</h2>
                <p className="text-[#8b0000] dark:text-[#d4af37] text-sm font-bold uppercase tracking-widest mt-2">{selectedSaint.feastDay} • {selectedSaint.patronage}</p>
              </div>
              <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl leading-relaxed">{selectedSaint.biography}</p>
              {selectedSaint.quote && (
                <blockquote className="bg-[#fcf8e8] dark:bg-stone-900 p-8 rounded-3xl border-l-8 border-[#d4af37] italic font-serif text-2xl text-stone-800 dark:text-stone-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute -top-4 -left-4 text-stone-100 dark:text-stone-800 select-none opacity-20 text-7xl font-serif">“</div>
                  <div className="relative z-10">"{selectedSaint.quote}"</div>
                </blockquote>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
