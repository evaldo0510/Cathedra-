
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { SavedItem } from '../types';
import { LangContext } from '../App';

const Favorites: React.FC = () => {
  const { t } = useContext(LangContext);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<SavedItem['type'] | 'all'>('all');

  const loadItems = () => {
    const saved = JSON.parse(localStorage.getItem('cathedra_saved_items') || '[]');
    setItems(saved);
  };

  useEffect(() => {
    loadItems();
    window.addEventListener('cathedra-saved-updated', loadItems);
    return () => window.removeEventListener('cathedra-saved-updated', loadItems);
  }, []);

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id);
    localStorage.setItem('cathedra_saved_items', JSON.stringify(next));
    setItems(next);
  };

  const filtered = items.filter(i => filter === 'all' || i.type === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Florilégio</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl">Sua coleção pessoal de verdades eternas.</p>
      </header>

      <nav className="flex justify-center gap-2 flex-wrap">
        {['all', 'verse', 'catechism', 'dogma', 'study'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === type ? 'bg-gold text-stone-900 shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border border-stone-100 dark:border-stone-800'}`}
          >
            {type === 'all' ? 'Todos' : type}
          </button>
        ))}
      </nav>

      {filtered.length > 0 ? (
        <div className="grid gap-6">
          {filtered.map((item) => (
            <article key={item.id} className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl group relative overflow-hidden">
               <button 
                 onClick={() => removeItem(item.id)}
                 className="absolute top-6 right-6 p-2 text-stone-200 hover:text-sacred transition-colors"
               >
                 <Icons.Cross className="w-4 h-4 rotate-45" />
               </button>
               
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-[8px] font-black uppercase tracking-widest text-stone-400">{item.type}</span>
                     <span className="text-[8px] text-stone-300 uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{item.title}</h3>
                  <p className="text-lg font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">"{item.content}"</p>
               </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-6 opacity-30">
          <Icons.Star className="w-20 h-20 mx-auto" />
          <p className="text-2xl font-serif italic">Nenhum tesouro guardado ainda.</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
