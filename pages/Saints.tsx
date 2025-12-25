
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { getSaintsList } from '../services/gemini';
import { Saint } from '../types';

/**
 * Componente de imagem resiliente para arte sacra com efeitos de transição
 */
const SacredImage: React.FC<{ src: string, alt: string, className: string }> = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Imagem de fallback elegante (Interior de Catedral)
  const fallback = "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800";

  return (
    <div className={`relative overflow-hidden group-hover:shadow-inner ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-stone-100 dark:bg-stone-800 animate-pulse flex items-center justify-center z-10">
          <Icons.Cross className="w-12 h-12 text-stone-200 dark:text-stone-700 animate-pulse" />
        </div>
      )}
      <img 
        src={error || !src ? fallback : src} 
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
        className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:brightness-90 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
      {/* Overlay decorativo para dar profundidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

const Saints: React.FC = () => {
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [filter, setFilter] = useState('');

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

  const filteredSaints = useMemo(() => {
    return saints.filter(s => 
      s.name.toLowerCase().includes(filter.toLowerCase()) || 
      s.patronage.toLowerCase().includes(filter.toLowerCase())
    );
  }, [saints, filter]);

  return (
    <div className="space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tighter leading-none">
            Sanctorum
          </h2>
          <p className="text-[#8b0000] dark:text-stone-400 font-serif italic text-2xl md:text-3xl opacity-80 leading-relaxed">
            "A Nuvem de Testemunhas que intercede por nós."
          </p>
        </div>
        
        {/* Barra de Busca de Santos */}
        <div className="relative max-w-xl mx-auto group">
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou patrocínio..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-[#d4af37]/5 outline-none font-serif italic text-lg transition-all"
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[450px] bg-white dark:bg-stone-900 rounded-[2.5rem] animate-pulse border border-stone-100 dark:border-stone-800 shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredSaints.map((s, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSaint(s)}
              className="bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden cursor-pointer hover:-translate-y-3 transition-all duration-500 group relative flex flex-col h-full"
            >
              {/* Moldura Dourada Interna */}
              <div className="absolute inset-4 border border-[#d4af37]/10 rounded-[1.8rem] pointer-events-none z-20 group-hover:border-[#d4af37]/30 transition-colors" />
              
              <SacredImage src={s.image || ''} alt={s.name} className="h-[320px] w-full" />
              
              <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]">{s.feastDay}</span>
                    <Icons.Cross className="w-3 h-3 text-[#8b0000]/20 dark:text-[#d4af37]/20" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-[#8b0000] dark:group-hover:text-[#d4af37] transition-colors">
                    {s.name}
                  </h3>
                </div>
                
                <div className="pt-4 border-t border-stone-50 dark:border-stone-800">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-500 transition-colors truncate">
                    {s.patronage}
                  </p>
                </div>
              </div>

              {/* Halo Glow effect no Hover */}
              <div className="absolute -inset-20 bg-[#d4af37]/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* Mensagem de Vazio */}
      {!loading && filteredSaints.length === 0 && (
        <div className="text-center py-20">
          <Icons.Users className="w-16 h-16 text-stone-200 mx-auto mb-4" />
          <p className="text-xl font-serif italic text-stone-400">Nenhum santo encontrado para esta busca.</p>
        </div>
      )}

      {/* Detalhe do Santo (Modal Aprimorado) */}
      {selectedSaint && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="bg-[#fdfcf8] dark:bg-stone-950 w-full max-w-6xl rounded-[4rem] shadow-3xl overflow-hidden relative animate-in zoom-in-95 duration-500 flex flex-col md:flex-row max-h-[92vh] border border-white/10">
            
            <button 
              onClick={() => setSelectedSaint(null)} 
              className="absolute top-8 right-8 p-4 bg-black/20 hover:bg-[#8b0000] rounded-full transition-all z-30 group"
            >
              <Icons.Cross className="w-6 h-6 rotate-45 text-white group-hover:rotate-0 transition-transform" />
            </button>

            {/* Coluna da Imagem com Moldura Sacra */}
            <div className="md:w-5/12 relative h-[300px] md:h-auto overflow-hidden">
               <SacredImage src={selectedSaint.image || ''} alt={selectedSaint.name} className="w-full h-full" />
               <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent md:hidden" />
               <div className="absolute bottom-6 left-8 md:hidden">
                  <h2 className="text-4xl font-serif font-bold text-white tracking-tight">{selectedSaint.name}</h2>
               </div>
            </div>

            {/* Coluna de Texto Estilo Pergaminho */}
            <div className="md:w-7/12 p-8 md:p-20 overflow-y-auto custom-scrollbar space-y-10 relative">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                 <Icons.Cross className="w-64 h-64 text-[#d4af37]" />
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Memorial de Santidade</span>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight hidden md:block">
                  {selectedSaint.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <span className="px-6 py-2 bg-[#8b0000] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {selectedSaint.feastDay}
                  </span>
                  <span className="px-6 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-[#d4af37] text-[9px] font-black uppercase tracking-widest rounded-full border border-stone-200 dark:border-stone-700">
                    {selectedSaint.patronage}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-300">Biografia e Missão</h4>
                <p className="text-stone-700 dark:text-stone-300 font-serif italic text-xl md:text-2xl leading-relaxed whitespace-pre-line">
                  {selectedSaint.biography}
                </p>
              </div>

              {selectedSaint.quote && (
                <div className="relative">
                  <div className="absolute -top-6 -left-6 text-[#d4af37]/20 font-serif text-8xl pointer-events-none">“</div>
                  <blockquote className="bg-[#fcf8e8] dark:bg-stone-900/50 p-10 rounded-[3rem] border-l-[12px] border-[#d4af37] italic font-serif text-2xl md:text-3xl text-stone-800 dark:text-stone-100 shadow-inner relative z-10">
                    {selectedSaint.quote}
                  </blockquote>
                </div>
              )}

              {/* Seção de Grounding (Obrigatório pelas regras) */}
              {selectedSaint.sources && selectedSaint.sources.length > 0 && (
                <div className="pt-8 border-t border-stone-100 dark:border-stone-900 space-y-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">Verificado em Fontes Oficiais</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSaint.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl hover:bg-[#d4af37] hover:text-white transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                      >
                        <Icons.ExternalLink className="w-3 h-3" />
                        {s.title}
                      </a>
                    ))}
                  </div>
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
