
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
    <div className="space-y-12 max-w-5xl mx-auto pb-48 px-2 animate-in fade-in duration-500">
      {/* IMERSÃO LECTIO DIVINA */}
      {isImmersive && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#fdfcf8] dark:bg-[#0c0a09] p-6 md:p-20 animate-in fade-in duration-500">
           <div className="max-w-3xl mx-auto space-y-16 pb-40">
              <header className="text-center space-y-4">
                 <span className="text-[10px] font-black uppercase text-gold">Hodie • Lecionário</span>
                 <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight dark:text-gold">Lectio Divina</h1>
              </header>
              <div className="space-y-16 font-serif leading-[1.8] text-stone-800 dark:text-stone-300" style={{ fontSize: `${fontSize * 1.2}rem` }}>
                 <section className="space-y-6">
                    <h2 className="text-2xl text-sacred uppercase">I Leitura</h2>
                    <p className="italic">{data.firstReading.reference}</p>
                    <p className="text-justify indent-8">{data.firstReading.text}</p>
                 </section>
                 <section className="space-y-6 text-center italic">
                    <h2 className="text-2xl text-sacred uppercase">Salmo</h2>
                    <p className="text-3xl font-bold">{data.psalm.text}</p>
                 </section>
                 <section className="space-y-6">
                    <h2 className="text-2xl text-sacred uppercase">Evangelho</h2>
                    <p className="italic">{data.gospel.reference}</p>
                    <p className="text-justify font-bold indent-8 text-stone-900 dark:text-white">{data.gospel.text}</p>
                 </section>
              </div>
           </div>
           <button onClick={() => setIsImmersive(false)} className="fixed bottom-10 right-10 p-5 bg-gold text-stone-900 rounded-full shadow-4xl hover:scale-110 transition-all"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
        </div>
      )}

      <nav className="sticky top-0 z-[200] bg-white/90 dark:bg-stone-900/95 backdrop-blur-3xl rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl p-2.5 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-3.5 bg-stone-50 dark:bg-stone-800 rounded-2xl hover:text-sacred transition-all"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
        <div className="text-center">
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gold/60">Data Litúrgica</span>
          <div className="font-serif font-bold text-lg md:text-xl text-stone-900 dark:text-stone-100">
            {new Date(date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => changeDate(1)} className="p-3.5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl shadow-xl transition-all"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
      </nav>

      <div className="flex justify-center gap-4">
         <button onClick={() => setIsImmersive(true)} className="px-8 py-3 bg-sacred text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Iniciar Lectio Divina</button>
      </div>

      <article className="space-y-12" style={{ fontSize: `${fontSize}rem` }}>
          <section className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-8">
            <header className="flex justify-between items-center border-b pb-4 dark:border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">I Leitura</span>
              <div className="flex gap-2">
                <ActionButtons itemId={`l1_${date}`} type="liturgy" title="Leitura I" content={data.firstReading.text} />
              </div>
            </header>
            <h4 className="font-serif font-bold text-3xl text-sacred">{data.firstReading.reference}</h4>
            <p className="font-serif text-stone-800 dark:text-stone-200 leading-relaxed text-justify indent-8">
              {data.firstReading.text}
            </p>
          </section>

          <section className="bg-stone-50 dark:bg-stone-950 p-10 rounded-[3.5rem] shadow-inner text-center space-y-6">
            <h3 className="text-[10px] font-black uppercase text-stone-400">Salmo Responsorial</h3>
            <p className="font-serif font-bold text-2xl md:text-4xl text-stone-900 dark:text-stone-100 italic">"{data.psalm.text}"</p>
          </section>

          <section className="bg-stone-900 p-10 md:p-20 rounded-[4rem] text-white shadow-3xl space-y-10 border-l-[16px] border-sacred relative overflow-hidden">
            <Icons.Book className="absolute -top-10 -right-10 w-64 h-64 text-white/5" />
            <header className="flex justify-between items-center border-b border-white/10 pb-6">
               <span className="text-[11px] font-black uppercase tracking-widest text-gold">Santo Evangelho</span>
               <div className="flex gap-2">
                 <ActionButtons itemId={`lg_${date}`} type="liturgy" title="Evangelho" content={data.gospel.text} />
               </div>
            </header>
            <h4 className="font-serif font-bold text-4xl text-gold">{data.gospel.reference}</h4>
            <p className="font-serif text-white font-bold text-2xl md:text-4xl leading-relaxed italic text-justify drop-shadow-lg">
              "{data.gospel.text}"
            </p>
          </section>
      </article>

      <div className="fixed bottom-24 right-4 md:right-8 z-[300] flex flex-col gap-2">
          <button onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-xl font-black">A+</span></button>
          <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-lg font-black">A-</span></button>
       </div>
    </div>
  );
};

export default DailyLiturgy;
