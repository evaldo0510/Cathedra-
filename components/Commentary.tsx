
import React from 'react';
import { Icons } from '../constants';

interface CommentaryProps {
  verse?: number;
  source: string;
  content: string;
  className?: string;
}

const Commentary: React.FC<CommentaryProps> = ({ verse, source, content, className = "" }) => {
  return (
    <div className={`group relative ml-4 md:ml-10 my-6 animate-in fade-in slide-in-from-left-3 duration-500 ${className}`}>
      {/* Barra lateral de autoridade */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold rounded-full opacity-30 group-hover:opacity-100 transition-opacity" />
      
      <div className="pl-6 py-4 bg-stone-50/50 dark:bg-stone-900/40 rounded-r-[2rem] border-y border-r border-stone-100/50 dark:border-white/5 shadow-sm transition-all hover:bg-white dark:hover:bg-stone-900/60">
        <header className="flex items-center gap-3 mb-3">
          <div className="p-1.5 bg-stone-900 dark:bg-gold rounded-lg">
             <Icons.Feather className="w-3 h-3 text-gold dark:text-stone-900" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500">
            {verse ? `Glossa v.${verse}` : 'Comentário Doutrinal'} — <span className="text-sacred dark:text-gold/80">{source}</span>
          </p>
        </header>
        
        <p className="text-stone-800 dark:text-stone-300 font-serif leading-relaxed italic text-lg md:text-xl tracking-tight">
          "{content}"
        </p>
        
        <footer className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="h-px w-4 bg-stone-200 dark:bg-stone-800" />
           <span className="text-[7px] font-black uppercase tracking-widest text-stone-300">Symphonia Fidei System</span>
        </footer>
      </div>
    </div>
  );
};

export default Commentary;
