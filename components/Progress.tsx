
import React from 'react';

interface ProgressProps {
  percent: number;
  label?: string;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ percent, label = "Seu caminho formativo", className = "" }) => {
  // Garantir que o valor esteja entre 0 e 100
  const normalizedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={`w-full ${className} animate-in fade-in duration-700`}>
      <div className="flex justify-between items-end mb-3 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
          {label}
        </p>
        <span className="text-[10px] font-black text-gold uppercase tracking-widest">
          {normalizedPercent}% <span className="opacity-40">concluído</span>
        </span>
      </div>
      
      <div className="relative w-full bg-stone-100 dark:bg-stone-800/50 rounded-full h-2 overflow-hidden border border-stone-200/20 dark:border-white/5 shadow-inner">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold via-gold to-yellow-500 rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_12px_rgba(212,175,55,0.4)]"
          style={{ width: `${normalizedPercent}%` }}
        />
      </div>
      
      {/* Indicador de meta sutil */}
      <div className="mt-2 flex justify-between px-1">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1 h-1 rounded-full ${normalizedPercent > (i + 1) * 20 ? 'bg-gold' : 'bg-stone-200 dark:bg-stone-700'}`} 
            />
          ))}
        </div>
        <span className="text-[8px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-tighter">Status: {normalizedPercent === 100 ? 'Consummatum' : 'In Via'}</span>
      </div>
    </div>
  );
};

export default Progress;
