
import React from 'react';
import { Icons } from '../constants';

interface TrailProgressProps {
  completed: number;
  total: number;
  label?: string;
  className?: string;
}

const TrailProgress: React.FC<TrailProgressProps> = ({ 
  completed, 
  total, 
  label = "Caminho Formativo", 
  className = "" 
}) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isFinished = completed === total && total > 0;

  return (
    <div className={`w-full ${className} animate-in fade-in slide-in-from-bottom-2 duration-700`}>
      {/* Cabeçalho do Progresso de Prestígio */}
      <div className="flex justify-between items-end mb-4 px-1">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500">
            {label}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-serif italic transition-colors duration-500 ${isFinished ? 'text-gold' : 'text-stone-600 dark:text-stone-300'}`}>
              {isFinished ? 'Consummatum Est' : 'In Via'}
            </span>
            {isFinished && <Icons.Star className="w-3 h-3 text-gold fill-current animate-pulse" />}
          </div>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">
            {percent}%
          </span>
          <span className="text-[9px] font-black text-gold uppercase tracking-tighter">
            Progressio
          </span>
        </div>
      </div>
      
      {/* Container da Barra Alquímica */}
      <div className="relative h-4 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/50 dark:border-white/5 shadow-inner p-1">
        {/* Barra de Ouro Líquido */}
        <div
          className="absolute top-1 left-1 bottom-1 rounded-full bg-gradient-to-r from-sacred via-gold to-yellow-400 transition-all duration-[2000ms] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          style={{ width: `calc(${percent}% - 8px)` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </div>

        {/* Micro-indicadores de Estágio */}
        <div className="absolute inset-0 flex justify-between px-4 items-center pointer-events-none">
           {[...Array(Math.max(1, total + 1))].map((_, i) => (
             <div 
               key={i} 
               className={`w-1 h-1 rounded-full transition-colors duration-1000 ${i <= completed ? 'bg-white/50' : 'bg-stone-300 dark:bg-stone-700'}`}
             />
           ))}
        </div>
      </div>
      
      {/* Rodapé Informativo */}
      <footer className="mt-3 flex justify-between items-center px-1">
        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
          {completed} de {total} módulos percorridos
        </span>
        {isFinished && (
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-bounce">
            Excelência Atingida
          </span>
        )}
      </footer>
    </div>
  );
};

export default TrailProgress;
