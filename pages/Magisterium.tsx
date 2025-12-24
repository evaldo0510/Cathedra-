
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getMagisteriumDocs } from '../services/gemini';

interface MagisteriumDoc {
  title: string;
  source: string;
  content: string;
  year: string;
}

const Magisterium: React.FC = () => {
  const [docs, setDocs] = useState<MagisteriumDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const getCacheKey = (category: string) => `cathedra_mag_cache_${category.toLowerCase().replace(/\s+/g, '_')}`;

  const fetchDocs = async (category: string) => {
    setActiveCategory(category);
    const cacheKey = getCacheKey(category);
    const cached = localStorage.getItem(cacheKey);
    
    // Se houver cache, exibe imediatamente
    if (cached) {
      setDocs(JSON.parse(cached));
      setIsRefreshing(true); // Indica que está atualizando em background
    } else {
      setLoading(true);
      setDocs([]); // Limpa se não houver cache para mostrar o loader limpo
    }

    try {
      const data = await getMagisteriumDocs(category);
      if (data && Array.isArray(data)) {
        setDocs(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Erro ao buscar documentos do Magistério:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Carrega uma categoria inicial por padrão
  useEffect(() => {
    fetchDocs('Concílios Ecumênicos');
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-8 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred relative">
            <div className="absolute inset-0 bg-[#d4af37]/20 blur-[30px] rounded-full animate-pulse" />
            <Icons.Globe className="w-16 h-16 text-[#8b0000] relative z-10" />
          </div>
        </div>
        <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tight text-shadow-sacred">Magistério da Igreja</h2>
        <p className="text-stone-400 italic font-serif text-2xl max-w-2xl mx-auto">
          "O Depósito da Fé guardado sob a guia segura do Espírito Santo."
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-4 bg-white/50 p-4 rounded-[3rem] border border-stone-100 backdrop-blur-sm max-w-4xl mx-auto">
        {['Concílios Ecumênicos', 'Encíclicas Papais', 'Doutrina Social', 'Credos Antigos'].map(cat => (
          <button 
            key={cat}
            onClick={() => fetchDocs(cat)}
            className={`px-10 py-4 rounded-full font-serif italic text-xl transition-all shadow-sm border ${activeCategory === cat ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-sacred scale-105' : 'bg-white text-stone-600 border-stone-100 hover:border-[#d4af37]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-12 pb-20 relative">
        {isRefreshing && (
          <div className="absolute -top-12 right-0 flex items-center gap-3 text-stone-300 animate-in fade-in duration-300">
            <div className="w-4 h-4 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
            <span className="text-[9px] font-black uppercase tracking-widest">Atualizando em segundo plano...</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-[4rem] animate-pulse border border-stone-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-12">
            {docs.map((doc, i) => (
              <article 
                key={i} 
                className="bg-white p-12 md:p-16 rounded-[4.5rem] border border-stone-100 shadow-xl group relative overflow-hidden transition-all duration-700 hover:shadow-sacred/5 animate-in slide-in-from-bottom-8"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                  <Icons.Cross className="w-64 h-64 text-[#8b0000]" />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 border-b border-stone-50 pb-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="bg-[#fcf8e8] text-[#8b0000] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-[#d4af37]/10">
                        {doc.source}
                      </span>
                      <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Icons.History className="w-3 h-3" />
                        A.D. {doc.year}
                      </span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight tracking-tight">{doc.title}</h3>
                  </div>
                  <div className="p-6 bg-stone-50 rounded-3xl text-[#d4af37]/30 group-hover:text-[#d4af37]/60 transition-colors">
                    <Icons.Feather className="w-10 h-10" />
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-stone-700 font-serif italic text-2xl md:text-3xl leading-relaxed tracking-tight border-l-8 border-[#fcf8e8] pl-10">
                    "{doc.content}"
                  </p>
                </div>

                <footer className="mt-12 flex justify-between items-center">
                   <div className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/30" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/30" />
                   </div>
                   <button className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 hover:text-[#8b0000] transition-colors">
                      Explorar Documento Integral →
                   </button>
                </footer>
              </article>
            ))}

            {docs.length === 0 && !loading && (
              <div className="h-96 flex flex-col items-center justify-center text-center p-20 bg-white/40 rounded-[5rem] border-2 border-dashed border-stone-200 shadow-inner">
                <Icons.Cross className="w-24 h-24 text-stone-200 mb-8 opacity-20" />
                <h3 className="text-3xl font-serif italic text-stone-300">Selecione uma categoria para consultar o Magistério.</h3>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="text-center pt-24 border-t border-[#d4af37]/10 pb-16">
         <div className="flex items-center justify-center gap-8 mb-8">
            <div className="h-px w-20 bg-stone-100" />
            <p className="text-[12px] font-black uppercase tracking-[1em] text-stone-300">Magisterium Ecclesiae</p>
            <div className="h-px w-20 bg-stone-100" />
         </div>
         <p className="text-stone-400 font-serif italic text-2xl">"Quem vos ouve, a Mim ouve." — Lc 10, 16</p>
      </footer>
    </div>
  );
};

export default Magisterium;
