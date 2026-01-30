
import React, { useState } from 'react';
import { Icons } from '../constants';

interface ReflectionBoxProps {
  itemId: string;
  title: string;
  className?: string;
}

export const ReflectionBox: React.FC<ReflectionBoxProps> = ({ itemId, title, className = "" }) => {
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reflection.trim()) return;
    
    setIsSubmitting(true);
    // Simulação de salvamento na "Cloud" ou LocalHistory
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const reflections = JSON.parse(localStorage.getItem('cathedra_reflections') || '[]');
    reflections.push({
      itemId,
      title,
      text: reflection,
      date: new Date().toISOString()
    });
    localStorage.setItem('cathedra_reflections', JSON.stringify(reflections));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    setReflection('');
    
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className={`bg-pro-soft dark:bg-stone-900/40 border border-pro-border dark:border-white/5 rounded-[2rem] p-8 mt-12 transition-all group ${className}`}>
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pro-accent dark:bg-gold rounded-xl">
            <Icons.Feather className="w-4 h-4 text-white dark:text-stone-900" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pro-muted">Partilha formativa</p>
            <h4 className="text-sm font-serif font-bold text-pro-accent dark:text-stone-200">Resonare Cordis</h4>
          </div>
        </div>
        {isSuccess && (
          <span className="text-[10px] font-black uppercase text-emerald-500 animate-in fade-in slide-in-from-right-2">Gesto Guardado</span>
        )}
      </header>

      <textarea
        placeholder="O que este texto despertou em você?"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        className="w-full bg-white dark:bg-stone-800 border border-pro-border dark:border-white/10 rounded-2xl p-5 text-lg font-serif italic outline-none focus:ring-4 focus:ring-gold/5 focus:border-gold/30 transition-all resize-none custom-scrollbar min-h-[120px]"
        rows={4}
      />

      <footer className="mt-4 flex justify-end">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || !reflection.trim()}
          className="flex items-center gap-3 px-8 py-3 bg-pro-accent text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-gold hover:text-pro-accent transition-all disabled:opacity-30 active:scale-95"
        >
          {isSubmitting ? (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <>
               <span>Enviar reflexão</span>
               <Icons.ArrowDown className="w-3 h-3 -rotate-90" />
             </>
          )}
        </button>
      </footer>
    </div>
  );
}

export default ReflectionBox;
