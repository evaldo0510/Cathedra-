
import React from 'react';
import { Icons } from '../constants';

interface ChapterNavigationProps {
  prev: number | null;
  next: number | null;
  onNavigate: (chapter: number) => void;
  bookName?: string;
}

const ChapterNavigation: React.FC<ChapterNavigationProps> = ({ prev, next, onNavigate, bookName }) => {
  return (
    <nav className="w-full grid grid-cols-2 gap-4 md:gap-12 mt-16 pt-12 border-t border-stone-100 dark:border-stone-800">
      {/* Botão Anterior */}
      <div className="flex justify-start">
        {prev ? (
          <button 
            onClick={() => onNavigate(prev)}
            className="group flex items-center gap-4 text-left transition-all active:scale-95"
          >
            <div className="p-3 md:p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 group-hover:border-gold transition-colors">
              <Icons.ArrowDown className="w-5 h-5 rotate-90 text-stone-400 group-hover:text-gold transition-transform group-hover:-translate-x-1" />
            </div>
            <div>
              <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Capítulo Anterior</span>
              <span className="block text-xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">
                {prev}
              </span>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-4 opacity-20 grayscale">
             <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
               <Icons.ArrowDown className="w-5 h-5 rotate-90 text-stone-400" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Inicium</span>
          </div>
        )}
      </div>

      {/* Botão Próximo */}
      <div className="flex justify-end">
        {next ? (
          <button 
            onClick={() => onNavigate(next)}
            className="group flex items-center gap-4 text-right transition-all active:scale-95"
          >
            <div className="order-2 lg:order-1 text-right">
              <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Próximo Capítulo</span>
              <span className="block text-xl md:text-3xl font-serif font-bold text-gold leading-none">
                {next}
              </span>
            </div>
            <div className="order-1 lg:order-2 p-3 md:p-4 rounded-2xl bg-stone-900 text-gold border border-stone-800 group-hover:bg-sacred group-hover:text-white group-hover:border-sacred transition-all shadow-xl">
              <Icons.ArrowDown className="w-5 h-5 -rotate-90 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-4 opacity-20 grayscale">
             <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Finis</span>
             <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
               <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-stone-400" />
             </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default ChapterNavigation;
