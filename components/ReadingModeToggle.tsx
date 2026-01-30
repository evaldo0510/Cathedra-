import React from 'react';
import { Icons } from '../constants';

interface ReadingModeToggleProps {
  mode: 'study' | 'prayer';
  setMode: (mode: 'study' | 'prayer') => void;
}

const ReadingModeToggle: React.FC<ReadingModeToggleProps> = ({ mode, setMode }) => {
  return (
    <div className="flex bg-pro-soft dark:bg-stone-800/50 p-1.5 rounded-2xl border border-pro-border dark:border-white/5 shadow-inner">
      <button 
        onClick={() => setMode('study')}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'study' ? 'bg-white dark:bg-stone-700 text-pro-accent shadow-md' : 'text-pro-muted hover:text-pro-accent'}`}
      >
        <Icons.Book className="w-3.5 h-3.5" />
        <span>Estudo</span>
      </button>
      <button 
        onClick={() => setMode('prayer')}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'prayer' ? 'bg-pro-accent text-white shadow-md' : 'text-pro-muted hover:text-pro-accent'}`}
      >
        <Icons.Star className="w-3.5 h-3.5" />
        <span>Oração</span>
      </button>
    </div>
  );
};

export default ReadingModeToggle;