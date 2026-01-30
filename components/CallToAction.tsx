
import React from 'react';
import { Icons } from '../constants';

interface CallToActionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
  className?: string;
}

const CallToAction: React.FC<CallToActionProps> = ({ 
  title = "Formar a mente. Aquecer o coração.", 
  description = "A fé cresce quando é compreendida, vivida e rezada.",
  buttonText = "Iniciar jornada",
  onClick,
  className = ""
}) => {
  return (
    <section className={`text-center p-12 md:p-24 bg-stone-50 dark:bg-stone-900/50 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl relative overflow-hidden group animate-in fade-in duration-1000 ${className}`}>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      <Icons.Cross className="absolute -bottom-12 -left-12 w-64 h-64 text-gold/5 group-hover:rotate-12 transition-transform duration-[2000ms]" />
      
      <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
        <div className="inline-block p-4 bg-white dark:bg-stone-800 rounded-3xl shadow-sm mb-2">
          <Icons.Feather className="w-8 h-8 text-gold" />
        </div>
        
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight leading-tight">
          {title}
        </h2>
        
        <p className="text-xl md:text-2xl text-stone-500 dark:text-stone-400 font-serif italic max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
        
        <div className="pt-6">
          <button 
            onClick={onClick}
            className="px-16 py-6 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-4xl hover:scale-105 active:scale-95 transition-all group/btn flex items-center gap-4 mx-auto"
          >
            <span>{buttonText}</span>
            <Icons.ArrowDown className="w-4 h-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
