
import React, { useState } from 'react';
import { Icons } from '../constants';

const MASS_PARTS = [
  {
    title: 'Ritus Initiales / Ritos Iniciais',
    parts: [
      {
        name: 'Salutatio / Saudação',
        latin: 'S: In nómine Patris, et Fílii, et Spíritus Sancti.\nP: Amen.\nS: Dóminus vobíscum.\nP: Et cum spíritu tuo.',
        vernacular: 'S: Em nome do Pai, e do Filho, e do Espírito Santo.\nP: Amém.\nS: O Senhor esteja convosco.\nP: Ele está no meio de nós.'
      },
      {
        name: 'Actus Pænitentiális / Ato Penitencial',
        latin: 'Confíteor Deo omnipoténti et vobis, fratres, quia peccávi nimis cogitatióne, verbo, ópere et omissióne: mea culpa, mea culpa, mea máxima culpa.',
        vernacular: 'Confesso a Deus todo-poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões: por minha culpa, minha tão grande culpa.'
      }
    ]
  },
  {
    title: 'Liturgia Eucharistica / Liturgia Eucarística',
    parts: [
      {
        name: 'Præfatio / Prefácio',
        latin: 'S: Sursum corda.\nP: Habémus ad Dóminum.\nS: Grátias agámus Dómino Deo nostro.\nP: Dignum et iustum est.',
        vernacular: 'S: Corações ao alto.\nP: O nosso coração está em Deus.\nS: Demos graças ao Senhor nosso Deus.\nP: É nosso dever e nossa salvação.'
      },
      {
        name: 'Sanctus',
        latin: 'Sanctus, Sanctus, Sanctus Dóminus Deus Sábaoth. Pleni sunt cæli et terra glória tua. Hosánna in excélsis.',
        vernacular: 'Santo, Santo, Santo, Senhor Deus do universo. O céu e a terra proclamam a vossa glória. Hosana nas alturas.'
      }
    ]
  }
];

const OrdoMissae: React.FC = () => {
  const [view, setView] = useState<'bilingual' | 'latin' | 'vernacular'>('bilingual');

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Ordo Missæ</h2>
        <p className="text-stone-400 italic text-xl">O Ordinário da Santa Missa</p>
        
        <div className="flex justify-center bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl w-fit mx-auto mt-8">
           <button onClick={() => setView('bilingual')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'bilingual' ? 'bg-white dark:bg-stone-800 text-gold shadow-md' : 'text-stone-400'}`}>Bilingue</button>
           <button onClick={() => setView('latin')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'latin' ? 'bg-white dark:bg-stone-800 text-gold shadow-md' : 'text-stone-400'}`}>Latine</button>
           <button onClick={() => setView('vernacular')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'vernacular' ? 'bg-white dark:bg-stone-800 text-gold shadow-md' : 'text-stone-400'}`}>Português</button>
        </div>
      </header>

      <div className="space-y-16">
        {MASS_PARTS.map((section, idx) => (
          <section key={idx} className="space-y-8">
            <div className="flex items-center gap-4">
               <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-sacred whitespace-nowrap">{section.title}</h3>
               <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            </div>
            
            <div className="space-y-10">
               {section.parts.map((part, pIdx) => (
                 <div key={pIdx} className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">{part.name}</h4>
                    <div className={`grid gap-10 ${view === 'bilingual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                       {(view === 'bilingual' || view === 'latin') && (
                         <div className="p-8 bg-stone-50 dark:bg-stone-900 rounded-3xl border-l-4 border-gold shadow-sm">
                            <p className="text-xl md:text-2xl font-serif italic text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">{part.latin}</p>
                         </div>
                       )}
                       {(view === 'bilingual' || view === 'vernacular') && (
                         <div className="p-8 bg-white dark:bg-stone-950 rounded-3xl border-l-4 border-sacred shadow-sm">
                            <p className="text-xl md:text-2xl font-serif text-stone-900 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{part.vernacular}</p>
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </section>
        ))}
      </div>
      
      <footer className="text-center opacity-30 pt-20">
         <Icons.Cross className="w-10 h-10 mx-auto" />
         <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-6">Sursum Corda</p>
      </footer>
    </div>
  );
};

export default OrdoMissae;
