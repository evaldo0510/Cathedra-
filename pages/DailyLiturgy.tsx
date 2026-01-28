
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { getNativeLiturgy } from '../services/nativeData';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';
import { DailyLiturgyContent } from '../types';

const DailyLiturgy: React.FC = () => {
  const { lang } = useContext(LangContext);
  const urlParams = new URLSearchParams(window.location.search);
  const initialDate = urlParams.get('date') || new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(initialDate);
  const [data, setData] = useState<DailyLiturgyContent>(getNativeLiturgy(date));
  const [isImmersive, setIsImmersive] = useState(false);
  const [fontSize, setFontSize] = useState(1.15);

  useEffect(() => {
    setData(getNativeLiturgy(date));
  }, [date]);

  const changeDate = (offset: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-8 md:space-y-12 max-w-5xl mx-auto pb-48 px-1 md:px-4 animate-in fade-in duration-500">
      {/* IMERSÃO LECTIO DIVINA */}
      {isImmersive && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#fdfcf8] dark:bg-[#0c0a09] p-4 md:p-20 animate-in fade-in duration-500">
           <div className="max-w-3xl mx-auto space-y-12 md:space-y-16 pb-40">
              <header className="text-center space-y-4 pt-10">
                 <span className="text-[10px] font-black uppercase text-gold tracking-widest">Hodie • Lecionário</span>
                 <h1 className="text-4xl md:text-7xl font-serif font-bold tracking-tight dark:text-gold">Lectio Divina</h1>
              </header>
              <div className="space-y-12 md:space-y-16 font-serif leading-[1.8] text-stone-800 dark:text-stone-300" style={{ fontSize: `${fontSize * 1.1}rem` }}>
                 <section className="space-y-4">
                    <h2 className="text-xl md:text-2xl text-sacred uppercase font-bold border-b border-sacred/10 pb-2">I Leitura</h2>
                    <p className="italic text-stone-400 text-sm md:text-base">{data.firstReading.reference}</p>
                    <p className="text-justify indent-6 md:indent-8">{data.firstReading.text}</p>
                 </section>
                 <section className="space-y-4 text-center italic py-8">
                    <h2 className="text-xl md:text-2xl text-sacred uppercase font-bold">Salmo</h2>
                    <p className="text-2xl md:text-4xl font-bold leading-tight">"{data.psalm.text}"</p>
                 </section>
                 <section className="space-y-4">
                    <h2 className="text-xl md:text-2xl text-sacred uppercase font-bold border-b border-sacred/10 pb-2">Evangelho</h2>
                    <p className="italic text-stone-400 text-sm md:text-base">{data.gospel.reference}</p>
                    <p className="text-justify font-bold indent-6 md:indent-8 text-stone-900 dark:text-white">{data.gospel.text}</p>
                 </section>
              </div>
           </div>
           <button onClick={() => setIsImmersive(false)} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 p-4 md:p-5 bg-gold text-stone-900 rounded-full shadow-4xl hover:scale-110 active:scale-90 transition-all z-[1010]"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
        </div>
      )}

      {/* NAVEGAÇÃO DE DATA */}
      <nav className="sticky top-0 z-[200] bg-white/90 dark:bg-stone-900/95 backdrop-blur-3xl rounded-3xl md:rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl p-2 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-3 md:p-3.5 bg-stone-50 dark:bg-stone-800 rounded-2xl hover:text-sacred transition-all active:scale-95"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
        <div className="text-center px-2">
          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-gold/60">Liturgia de</span>
          <div className="font-serif font-bold text-sm md:text-xl text-stone-900 dark:text-stone-100 whitespace-nowrap">
            {new Date(date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => changeDate(1)} className="p-3 md:p-3.5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl shadow-xl transition-all active:scale-95"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
      </nav>

      <div className="flex justify-center">
         <button onClick={() => setIsImmersive(true)} className="px-6 md:px-10 py-3 md:py-4 bg-sacred text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Iniciar Lectio Divina</button>
      </div>

      <article className="space-y-8 md:space-y-12" style={{ fontSize: `${fontSize}rem` }}>
          {/* PRIMEIRA LEITURA */}
          <section className="bg-white dark:bg-stone-900 p-6 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-lg border border-stone-100 dark:border-stone-800 space-y-6 md:space-y-8">
            <header className="flex justify-between items-center border-b pb-3 md:pb-4 dark:border-stone-800">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gold">I Leitura</span>
              <ActionButtons itemId={`l1_${date}`} type="liturgy" title="Leitura I" content={data.firstReading.text} className="scale-90" />
            </header>
            <h4 className="font-serif font-bold text-2xl md:text-4xl text-sacred leading-tight">{data.firstReading.reference}</h4>
            <p className="font-serif text-stone-800 dark:text-stone-200 leading-relaxed text-justify indent-6 md:indent-8">
              {data.firstReading.text}
            </p>
          </section>

          {/* SALMO */}
          <section className="bg-stone-50 dark:bg-stone-950 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-inner text-center space-y-4 md:space-y-6">
            <h3 className="text-[8px] md:text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Salmo Responsorial</h3>
            <p className="font-serif font-bold text-xl md:text-4xl text-stone-900 dark:text-stone-100 italic leading-snug">"{data.psalm.text}"</p>
          </section>

          {/* EVANGELHO */}
          <section className="bg-stone-900 p-6 md:p-20 rounded-[2.5rem] md:rounded-[4rem] text-white shadow-3xl space-y-8 md:space-y-10 border-l-[10px] md:border-l-[16px] border-sacred relative overflow-hidden">
            <Icons.Book className="absolute -top-10 -right-10 w-48 h-48 md:w-64 md:h-64 text-white/5 pointer-events-none" />
            <header className="flex justify-between items-center border-b border-white/10 pb-4 md:pb-6 relative z-10">
               <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-gold">Santo Evangelho</span>
               <ActionButtons itemId={`lg_${date}`} type="liturgy" title="Evangelho" content={data.gospel.text} className="scale-90" />
            </header>
            <h4 className="font-serif font-bold text-2xl md:text-5xl text-gold leading-tight relative z-10">{data.gospel.reference}</h4>
            <p className="font-serif text-white font-bold text-xl md:text-4xl leading-relaxed italic text-justify drop-shadow-lg relative z-10">
              "{data.gospel.text}"
            </p>
          </section>
      </article>

      {/* CONTROLES DE ACESSIBILIDADE */}
      <div className="fixed bottom-20 md:bottom-24 right-4 md:right-8 z-[300] flex flex-col gap-3">
          <button onClick={() => setFontSize(f => Math.min(f + 0.1, 1.6))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-gold hover:scale-110 active:scale-95 transition-all"><span className="text-xl font-black">A+</span></button>
          <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.9))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-gold hover:scale-110 active:scale-95 transition-all"><span className="text-lg font-black">A-</span></button>
       </div>
    </div>
  );
};

export default DailyLiturgy;
