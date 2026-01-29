
import React from 'react';

interface ProgressProps {
  percent: number;
  label?: string;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ percent, label = "Seu caminho formativo", className = "" }) => (
  <div className={`w-full ${className}`}>
    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{label}</p>
    <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-gold h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_#d4af37]"
        style={{ width: `${percent}%` }}
      />
    </div>
    <span className="text-[9px] font-bold text-gold mt-2 block">{percent}% concluído</span>
  </div>
);

export default Progress;
