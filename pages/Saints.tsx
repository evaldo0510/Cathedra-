
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getSaintsList, getRelatedSaints } from '../services/gemini';
import { Saint } from '../types';

const Saints: React.FC = () => {
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [relatedSaints, setRelatedSaints] = useState<Saint[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

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

  useEffect(() => { fetchSaints(); }, []);

  const handleFetchRelated = async () => {
    if (!selectedSaint) return;
    setLoadingRelated(true);
    setRelatedSaints([]);
    try {
      const data = await getRelatedSaints(selectedSaint);
      setRelatedSaints(data);
    } catch (err) {
      console.error("Erro ao buscar santos relacionados:", err);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Limpa os relacionados quando mudar o santo selecionado
  useEffect(() => {
    setRelatedSaints([]);
    setLoadingRelated(false);
  }, [selectedSaint?.name]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl font-serif font-bold text-stone-900">Nuvem de Testemunhas</h2>
        <p className="text-stone-400 italic font-serif text-lg">"Companheiros na Glória, Intercessores na Luta."</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-white rounded-[2.5rem] animate-pulse border border-stone-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {saints.map((s, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSaint(s)}
              className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="h-56 relative overflow-hidden">
                <img src={s.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={s.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-8 right-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] mb-1 block">{s.feastDay}</span>
                  <h3 className="text-2xl font-serif font-bold text-white leading-none">{s.name}</h3>
                </div>
              </div>
              <div className="p-8">
                <p className="text-stone-500 font-serif italic text-sm line-clamp-3 mb-6">"{s.biography}"</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <Icons.Cross className="w-3 h-3 text-[#d4af37]" /> {s.patronage}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSaint && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="bg-[#fdfcf8] w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedSaint(null)}
              className="absolute top-8 right-8 bg-white/80 backdrop-blur p-3 rounded-full hover:bg-white transition-colors z-20 shadow-lg"
            >
              <Icons.Cross className="w-6 h-6 rotate-45 text-stone-800" />
            </button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row min-h-full">
                <div className="md:w-1/2 h-80 md:h-auto relative">
                  <img src={selectedSaint.image} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#fdfcf8] md:bg-gradient-to-r md:from-transparent md:to-[#fdfcf8]" />
                </div>
                <div className="md:w-1/2 p-10 md:p-14 space-y-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4af37] mb-2 block">Destaque Espiritual</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-2 leading-tight">{selectedSaint.name}</h2>
                    <p className="text-[#8b0000] text-sm font-bold uppercase tracking-widest">{selectedSaint.feastDay} • {selectedSaint.patronage}</p>
                  </div>
                  <p className="text-stone-600 font-serif italic text-lg leading-relaxed">{selectedSaint.biography}</p>
                  {selectedSaint.quote && (
                    <blockquote className="bg-[#fcf8e8] p-8 rounded-3xl border-l-8 border-[#d4af37] italic font-serif text-xl text-stone-800 shadow-sm relative overflow-hidden group">
                      <div className="absolute -top-4 -left-4 text-stone-100 select-none opacity-20 text-6xl font-serif">“</div>
                      <div className="relative z-10">"{selectedSaint.quote}"</div>
                    </blockquote>
                  )}

                  <div className="pt-8 border-t border-stone-100 space-y-8">
                    <button 
                      onClick={handleFetchRelated}
                      disabled={loadingRelated}
                      className="w-full py-6 bg-[#1a1a1a] text-[#d4af37] text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-[#8b0000] hover:text-white transition-all shadow-xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                    >
                      {loadingRelated ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Icons.Users className="w-5 h-5" />
                          <span>Santos Relacionados</span>
                        </>
                      )}
                    </button>

                    {relatedSaints.length > 0 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-50 pb-3">Comunhão de Testemunhas</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {relatedSaints.map((rs, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setSelectedSaint(rs)}
                                className="flex items-center gap-4 p-4 bg-white border border-stone-100 rounded-2xl hover:border-[#d4af37] hover:shadow-md transition-all group text-left"
                              >
                                 <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-stone-50">
                                    <img src={rs.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={rs.name} />
                                 </div>
                                 <div className="flex-1 overflow-hidden">
                                    <p className="font-serif font-bold text-stone-800 truncate">{rs.name}</p>
                                    <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest truncate">{rs.patronage}</p>
                                 </div>
                              </button>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
