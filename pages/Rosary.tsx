
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';

const MYSTERIES = {
  joyful: {
    name: 'Gozosos (Segundas e Sábados)',
    items: ['A Anunciação', 'A Visitação', 'O Nascimento de Jesus', 'A Apresentação no Templo', 'Jesus entre os Doutores']
  },
  sorrowful: {
    name: 'Dolorosos (Terças e Sextas)',
    items: ['A Agonia no Horto', 'A Flagelação', 'A Coroação de Espinhos', 'Jesus carregando a Cruz', 'A Crucificação']
  },
  glorious: {
    name: 'Gloriosos (Quartas e Domingos)',
    items: ['A Ressurreição', 'A Ascensão', 'A Vinda do Espírito Santo', 'A Assunção de Maria', 'A Coroação de Maria']
  },
  luminous: {
    name: 'Luminosos (Quintas-feiras)',
    items: ['Batismo de Jesus', 'Bodas de Caná', 'Anúncio do Reino', 'Transfiguração', 'Instituição da Eucaristia']
  }
};

const Rosary: React.FC = () => {
  const [currentMystery, setCurrentMystery] = useState<keyof typeof MYSTERIES>('joyful');
  const [step, setStep] = useState(0);

  useEffect(() => {
    const day = new Date().getDay();
    if (day === 1 || day === 6) setCurrentMystery('joyful');
    else if (day === 2 || day === 5) setCurrentMystery('sorrowful');
    else if (day === 3 || day === 0) setCurrentMystery('glorious');
    else setCurrentMystery('luminous');
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Rosárium</h2>
        <p className="text-stone-400 italic text-xl">A Coroa de Rosas da Virgem Maria</p>
      </header>

      <div className="bg-white dark:bg-stone-900 p-8 md:p-16 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-50 dark:border-stone-800 pb-10">
           <div className="text-center md:text-left">
              <span className="text-[10px] font-black uppercase text-gold tracking-widest">Mistérios de Hoje</span>
              <h3 className="text-3xl font-serif font-bold">{MYSTERIES[currentMystery].name}</h3>
           </div>
           <div className="flex gap-2">
              {Object.keys(MYSTERIES).map((k) => (
                <button 
                  key={k} 
                  onClick={() => { setCurrentMystery(k as any); setStep(0); }}
                  className={`w-3 h-3 rounded-full transition-all ${currentMystery === k ? 'bg-gold scale-125' : 'bg-stone-200 dark:bg-stone-700'}`}
                />
              ))}
           </div>
        </div>

        <div className="space-y-8">
           {MYSTERIES[currentMystery].items.map((m, idx) => (
             <button 
              key={idx}
              onClick={() => setStep(idx)}
              className={`w-full text-left p-8 rounded-[2.5rem] border transition-all flex items-center gap-6 group ${step === idx ? 'bg-stone-900 text-gold border-stone-900 shadow-xl scale-105' : 'bg-stone-50 dark:bg-stone-800 border-transparent text-stone-500'}`}
             >
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === idx ? 'bg-gold text-stone-900' : 'bg-stone-200 dark:bg-stone-700'}`}>{idx + 1}</span>
                <span className="text-2xl font-serif font-bold">{m}</span>
             </button>
           ))}
        </div>

        <div className="bg-[#fcf8e8] dark:bg-stone-950 p-10 rounded-[3rem] border border-gold/20 text-center space-y-6">
           <h4 className="text-[10px] font-black uppercase text-gold">Oração do Mistério</h4>
           <p className="text-2xl font-serif italic text-stone-800 dark:text-stone-300 leading-relaxed">
             "Oferecemos-vos, ó Virgem Santíssima, este mistério em honra de {MYSTERIES[currentMystery].items[step]}..."
           </p>
        </div>
      </div>

      <footer className="text-center opacity-30">
         <Icons.Cross className="w-8 h-8 mx-auto" />
         <p className="text-[10px] uppercase tracking-widest mt-4">Totus Tuus Ego Sum</p>
      </footer>
    </div>
  );
};

export default Rosary;
