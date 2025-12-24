
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { AppRoute, StudyResult } from '../types';

interface StudyTopicProps {
  onSelect: (data: StudyResult) => void;
}

const StudyTopic: React.FC<StudyTopicProps> = ({ onSelect }) => {
  const [history, setHistory] = useState<StudyResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('cathedra_history');
    setHistory([]);
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="p-5 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30">
              <Icons.History className="w-12 h-12 text-[#d4af37]" />
           </div>
        </div>
        <h2 className="text-6xl font-serif font-bold text-stone-900">Histórico de Estudos</h2>
        <p className="text-stone-400 italic text-xl">Sua jornada de aprofundamento teológico.</p>
      </header>

      {history.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-10">
          {history.map((item, i) => (
            <button key={i} onClick={() => onSelect(item)} className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-xl text-left group hover:border-[#d4af37] transition-all relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Tema Explorador</span>
                    <Icons.Layout className="w-6 h-6 text-stone-200 group-hover:text-[#8b0000] transition-colors" />
                  </div>
                  <h3 className="text-4xl font-serif font-bold text-stone-900 group-hover:text-[#8b0000] transition-colors">{item.topic}</h3>
                  <p className="text-stone-500 font-serif italic text-xl line-clamp-2 leading-relaxed">"{item.summary}"</p>
               </div>
            </button>
          ))}
          
          <div className="md:col-span-2 flex justify-center mt-12">
             <button onClick={clearHistory} className="px-10 py-4 bg-stone-100 text-stone-400 rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:bg-[#8b0000] hover:text-white transition-all shadow-md">Limpar Histórico</button>
          </div>
        </div>
      ) : (
        <div className="text-center py-40 bg-stone-50 rounded-[5rem] border-2 border-dashed border-stone-100">
           <Icons.History className="w-32 h-32 mx-auto mb-10 text-stone-200" />
           <p className="text-3xl font-serif italic text-stone-400">Nenhum estudo realizado ainda.</p>
        </div>
      )}
    </div>
  );
};

export default StudyTopic;
