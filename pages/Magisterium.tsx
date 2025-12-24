
import React, { useState } from 'react';
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

  const fetchDocs = async (category: string) => {
    setLoading(true);
    try {
      const data = await getMagisteriumDocs(category);
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl font-serif font-bold text-stone-900">Magistério da Igreja</h2>
        <p className="text-stone-400 italic font-serif text-lg">"O Depósito da Fé guardado sob a guia do Espírito Santo."</p>
      </header>

      <div className="flex flex-wrap justify-center gap-4">
        {['Concílios Ecumênicos', 'Encíclicas Papais', 'Doutrina Social', 'Credos Antigos'].map(cat => (
          <button 
            key={cat}
            onClick={() => fetchDocs(cat)}
            className="px-8 py-3 bg-white border border-stone-200 rounded-full font-serif italic text-stone-600 hover:bg-[#8b0000] hover:text-white transition-all shadow-sm"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-8 pb-20">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-[2.5rem] animate-pulse border border-stone-100" />
          ))
        ) : (
          docs.map((doc, i) => (
            <div key={i} className="sacred-gradient p-1 bg-[#d4af37]/20 rounded-[2.5rem] shadow-xl group overflow-hidden">
              <div className="bg-[#1a1a1a] p-10 rounded-[2.4rem] text-white space-y-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                  <Icons.Cross className="w-64 h-64" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37] mb-2 block">{doc.source} ({doc.year})</span>
                    <h3 className="text-3xl font-serif font-bold">{doc.title}</h3>
                  </div>
                  <Icons.Feather className="w-10 h-10 text-[#d4af37]/30" />
                </div>
                <p className="text-white/60 font-serif italic text-lg leading-relaxed relative z-10">
                  "{doc.content}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Magisterium;
