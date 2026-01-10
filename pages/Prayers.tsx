
import React, { useState, useContext } from 'react';
import { Icons } from '../constants';
import { Prayer } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const PRAYERS: Prayer[] = [
  {
    id: 'angelus',
    title: 'Angelus Domini',
    latin: 'V/. Angelus Domini nuntiavit Mariæ.\nR/. Et concepit de Spiritu Sancto.\n\n Ave Maria...',
    vernacular: 'V/. O Anjo do Senhor anunciou a Maria.\nR/. E Ela concebeu do Espírito Santo.\n\n Ave Maria...',
    category: 'daily'
  },
  {
    id: 'salve_regina',
    title: 'Salve Regina',
    latin: 'Salve, Regina, Mater misericordiæ, vita, dulcedo, et spes nostra, salve.',
    vernacular: 'Salve Rainha, Mãe de misericórdia, vida, doçura e esperança nossa, salve.',
    category: 'marian'
  },
  {
    id: 'sancte_michael',
    title: 'Sancte Michael Archangele',
    latin: 'Sancte Michael Archangele, defende nos in proelio.',
    vernacular: 'São Miguel Arcanjo, defendei-nos no combate.',
    category: 'daily'
  }
];

const Prayers: React.FC = () => {
  const { t } = useContext(LangContext);
  const [filter, setFilter] = useState<Prayer['category'] | 'all'>('all');
  const [view, setView] = useState<'side-by-side' | 'vernacular'>('side-by-side');

  const filtered = PRAYERS.filter(p => filter === 'all' || p.category === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-32 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Thesaurus Precum</h2>
        <p className="text-stone-400 italic text-2xl font-serif">"Quem canta, reza duas vezes." — Santo Agostinho</p>
      </header>

      <nav className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] shadow-xl border border-stone-100 dark:border-stone-800">
         <div className="flex gap-2">
            {['all', 'daily', 'marian', 'latin'].map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-sacred text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-400'}`}
              >
                {cat}
              </button>
            ))}
         </div>
         <div className="flex bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl">
            <button onClick={() => setView('side-by-side')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${view === 'side-by-side' ? 'bg-white dark:bg-stone-700 text-gold shadow-sm' : 'text-stone-400'}`}>Bilingue</button>
            <button onClick={() => setView('vernacular')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${view === 'vernacular' ? 'bg-white dark:bg-stone-700 text-gold shadow-sm' : 'text-stone-400'}`}>Vernáculo</button>
         </div>
      </nav>

      <div className="grid gap-12">
        {filtered.map(p => (
          <article key={p.id} className="space-y-8 animate-in slide-in-from-bottom-4">
            <header className="flex items-center justify-between border-b dark:border-stone-800 pb-4">
               <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{p.title}</h3>
               <ActionButtons itemId={`prayer_${p.id}`} type="prayer" title={p.title} content={p.vernacular} />
            </header>
            
            <div className={`grid gap-10 ${view === 'side-by-side' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
               {view === 'side-by-side' && p.latin && (
                 <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60">Latine</span>
                    <p className="text-2xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{p.latin}</p>
                 </div>
               )}
               <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred/60">Português</span>
                  <p className="text-2xl font-serif text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-wrap">{p.vernacular}</p>
               </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Prayers;
