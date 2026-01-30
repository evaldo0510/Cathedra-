
import React from 'react';
import { Icons } from '../constants';
import { TrackStep } from '../types';

interface ModuleContentProps {
  items: TrackStep[];
  onAction?: (item: TrackStep) => void;
}

const ModuleContent: React.FC<ModuleContentProps> = ({ items, onAction }) => {
  const getIcon = (type: TrackStep['type']) => {
    switch (type) {
      case 'biblia': return <Icons.Book className="w-5 h-5" />;
      case 'cic': return <Icons.Cross className="w-5 h-5" />;
      case 'documento': return <Icons.Feather className="w-5 h-5" />;
      default: return <Icons.Search className="w-5 h-5" />;
    }
  };

  const getLabel = (type: TrackStep['type']) => {
    switch (type) {
      case 'biblia': return 'Sagradas Escrituras';
      case 'cic': return 'Catecismo da Igreja';
      case 'documento': return 'Documento Magisterial';
      default: return 'Recurso de Estudo';
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 w-full">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onAction?.(item)}
          className="w-full text-left group relative p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] hover:border-gold hover:shadow-xl transition-all duration-500 animate-in slide-in-from-left-4"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Indicador de Autoridade Lateral (Theological Indentation) */}
          <div className="absolute left-0 top-6 bottom-6 w-1 bg-stone-100 dark:bg-stone-800 group-hover:bg-gold rounded-r-full transition-colors" />

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Container do Ícone Sacro */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl text-sacred group-hover:text-gold transition-colors shadow-sm">
                {getIcon(item.type)}
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-sacred transition-colors">
                  {getLabel(item.type)}
                </span>
                <h4 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none tracking-tight">
                  {item.label || item.ref}
                </h4>
                {item.label && (
                  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                    Ref: {item.ref}
                  </p>
                )}
              </div>
            </div>

            {/* Seta de Ação "Ad Fontes" */}
            <div className="p-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
               <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-gold" />
            </div>
          </div>

          {/* Efeito de Aura (Brilho de Pergaminho) */}
          <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 rounded-[2rem] pointer-events-none transition-opacity" />
        </button>
      ))}
      
      {/* Divisor de Fim de Scriptorium */}
      <div className="flex items-center gap-3 px-6 pt-4 opacity-20">
        <div className="h-px flex-1 bg-stone-300 dark:bg-stone-700" />
        <Icons.Cross className="w-3 h-3" />
        <div className="h-px flex-1 bg-stone-300 dark:bg-stone-700" />
      </div>
    </div>
  );
};

export default ModuleContent;
