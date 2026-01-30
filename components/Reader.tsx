
import React from 'react';

interface ReaderProps {
  title: string;
  reference: string;
  text: string | React.ReactNode;
  variant?: 'sacred' | 'plain';
}

const Reader: React.FC<ReaderProps> = ({ title, reference, text, variant = 'sacred' }) => {
  return (
    <article className={`max-w-3xl mx-auto p-8 md:p-12 animate-in fade-in duration-1000
      ${variant === 'sacred' 
        ? 'bg-white dark:bg-stone-900 rounded-[3rem] shadow-sm border border-stone-100 dark:border-stone-800' 
        : ''}`}>
      
      <header className="mb-10 border-b border-stone-50 dark:border-stone-800 pb-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-3 leading-tight">
          {title}
        </h1>
        <div className="flex items-center gap-3">
           <div className="h-px w-8 bg-gold/40" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">
             {reference}
           </span>
        </div>
      </header>

      <div className="font-serif text-xl md:text-2xl leading-[1.8] text-stone-800 dark:text-stone-300 text-justify space-y-6">
        {typeof text === 'string' ? (
          text.split('\n').map((para, i) => para.trim() && (
            <p key={i} className="indent-8">{para.trim()}</p>
          ))
        ) : (
          text
        )}
      </div>

      <footer className="mt-16 pt-8 border-t border-stone-50 dark:border-stone-800 opacity-20 text-center">
        <span className="text-[9px] font-black uppercase tracking-[0.5em]">Cathedra Digital • Lectio Sollemnis</span>
      </footer>
    </article>
  );
};

export default Reader;
