
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { StudyResult } from '../types';

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
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-1000">
      <header className="text-center space-y-3 md:space-y-4">
        <div className="flex justify-center">
           <div className="p-3 md:p-4 bg-[#fcf8e8] dark:bg-stone-900 rounded-full border border-[#d4af37]/30 shadow-sm">
              <Icons.History className="w-6 h-6 md:w-8 md:h-8 text-[#d4af37]" />
           </div>
        </div>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Memorial de Estudos</h2>
        <p className="text-stone-400 italic text-base md:text-lg">Sua jornada de aprofundamento teológico.</p>
      </header>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
          {history.map((item, i) => (
            <button 
              key={i} 
              onClick={() => onSelect(item)} 
              className="bg-white dark:bg-stone-900 p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-md text-left group hover:border-[#d4af37] transition-all relative overflow-hidden active:scale-[0.98]"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
               <div className="relative z-10 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Quaestio Disputata</span>
                    <Icons.Layout className="w-4 h-4 md:w-5 md:h-5 text-stone-200 dark:text-stone-700 group-hover:text-gold transition-colors" />
                  </div>
                  <h3 className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-gold transition-colors leading-tight">
                    {item.topic}
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm md:text-base line-clamp-2 leading-relaxed">
                    "{item.summary}"
                  </p>
               </div>
            </button>
          ))}
          
          <div className="col-span-1 sm:col-span-2 flex justify-center mt-6 md:mt-10">
             <button 
              onClick={clearHistory} 
              className="px-8 py-4 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-full font-black uppercase tracking-[0.3em] text-[9px] hover:bg-sacred hover:text-white dark:hover:bg-gold dark:hover:text-stone-900 transition-all shadow-sm active:scale-95"
             >
               Limpar Histórico
             </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 md:py-32 bg-stone-50 dark:bg-stone-900/50 rounded-[2.5rem] md:rounded-[4rem] border-2 border-dashed border-stone-200 dark:border-stone-800">
           <Icons.History className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 text-stone-200 dark:text-stone-800 opacity-50" />
           <p className="text-xl md:text-2xl font-serif italic text-stone-400 dark:text-stone-600 px-6">Ainda não há investigações registradas no seu memorial.</p>
        </div>
      )}
    </div>
  );
};

export default StudyTopic;
