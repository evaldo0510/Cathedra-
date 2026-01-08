
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
    if (window.confirm("Deseja realmente apagar seu histórico de investigações?")) {
      localStorage.removeItem('cathedra_history');
      setHistory([]);
    }
  };

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-1000">
      <header className="text-center space-y-4 md:space-y-6">
        <div className="flex justify-center">
           <div className="p-4 md:p-5 bg-[#fcf8e8] dark:bg-stone-900 rounded-full border border-[#d4af37]/30 shadow-sm">
              <Icons.History className="w-8 h-8 md:w-12 md:h-12 text-[#d4af37]" />
           </div>
        </div>
        <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Memorial de Estudos</h2>
        <p className="text-stone-400 italic text-lg md:text-2xl">Sua jornada de aprofundamento teológico.</p>
      </header>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {history.map((item, i) => (
            <button 
              key={i} 
              onClick={() => onSelect(item)} 
              className="bg-white dark:bg-stone-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl text-left group hover:border-[#d4af37] transition-all relative overflow-hidden active:scale-[0.98]"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
               <div className="relative z-10 space-y-4 md:space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Quaestio Disputata</span>
                    <Icons.Layout className="w-5 h-5 md:w-6 md:h-6 text-stone-200 dark:text-stone-700 group-hover:text-[#8b0000] dark:group-hover:text-gold transition-colors" />
                  </div>
                  <h3 className="text-2xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#8b0000] dark:group-hover:text-gold transition-colors leading-tight">{item.topic}</h3>
                  <p className="text-stone-500 dark:text-stone-400 font-serif italic text-base md:text-xl line-clamp-2 leading-relaxed">"{item.summary}"</p>
               </div>
            </button>
          ))}
          
          <div className="col-span-1 md:col-span-2 flex justify-center mt-8 md:mt-12">
             <button 
              onClick={clearHistory} 
              className="px-10 py-5 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:bg-[#8b0000] hover:text-white dark:hover:bg-gold dark:hover:text-stone-900 transition-all shadow-md active:scale-95"
             >
               Limpar Histórico
             </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 md:py-40 bg-stone-50 dark:bg-stone-900/50 rounded-[3rem] md:rounded-[5rem] border-2 border-dashed border-stone-200 dark:border-stone-800">
           <Icons.History className="w-20 h-20 md:w-32 md:h-32 mx-auto mb-8 md:mb-10 text-stone-200 dark:text-stone-800 opacity-50" />
           <p className="text-2xl md:text-3xl font-serif italic text-stone-400 dark:text-stone-600 px-6">Ainda não há investigações registradas no seu memorial.</p>
        </div>
      )}
    </div>
  );
};

export default StudyTopic;
