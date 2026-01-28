
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setData(getNativeLiturgy(date));
      setIsTransitioning(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [date]);

  const changeDate = (offset: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-48 px-2 animate-in fade-in duration-500">
      <nav className="sticky top-0 z-[200] bg-white/90 dark:bg-stone-900/95 backdrop-blur-3xl rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl p-2.5 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-3.5 bg-stone-50 dark:bg-stone-800 rounded-2xl hover:text-sacred transition-all"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
        <div className="text-center">
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gold/60">Lecionário</span>
          <div className="font-serif font-bold text-lg md:text-xl text-stone-900 dark:text-stone-100">
            {new Date(date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => changeDate(1)} className="p-3.5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl shadow-xl transition-all"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
      </nav>

      <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <header className="text-center py-12 space-y-4">
          <Icons.Cross className="w-10 h-10 text-sacred mx-auto animate-pulse-soft" />
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">A Palavra de Vida</h2>
          <p className="text-stone-400 font-serif italic text-xl max-w-xl mx-auto">"{data.collect}"</p>
        </header>

        <article className="space-y-12">
          {/* LEITURA I */}
          <section className="bg-white dark:bg-stone-900/40 p-10 md:p-14 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-8">
            <header className="flex justify-between items-center border-b pb-4 dark:border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">I Leitura</span>
              <ActionButtons itemId={`l1_${date}`} type="liturgy" title="Leitura I" content={data.firstReading.text} />
            </header>
            <h4 className="font-serif font-bold text-3xl text-sacred">{data.firstReading.reference}</h4>
            <p className="font-serif text-stone-800 dark:text-stone-200 text-xl md:text-2xl leading-relaxed text-justify indent-8">
              {data.firstReading.text}
            </p>
          </section>

          {/* SALMO */}
          <section className="bg-stone-50 dark:bg-stone-950 p-10 rounded-[3.5rem] shadow-inner text-center space-y-6">
            <h3 className="text-[10px] font-black uppercase text-stone-400">Salmo Responsorial</h3>
            <h4 className="font-serif font-bold text-xl text-sacred">{data.psalm.title}</h4>
            <p className="font-serif font-bold text-2xl md:text-4xl text-stone-900 dark:text-stone-100 italic">"{data.psalm.text}"</p>
          </section>

          {/* EVANGELHO */}
          <section className="bg-stone-900 p-10 md:p-20 rounded-[4rem] text-white shadow-3xl space-y-10 border-l-[16px] border-sacred relative overflow-hidden">
            <Icons.Book className="absolute -top-10 -right-10 w-64 h-64 text-white/5" />
            <header className="flex justify-between items-center border-b border-white/10 pb-6">
               <span className="text-[11px] font-black uppercase tracking-widest text-gold">Santo Evangelho</span>
               <ActionButtons itemId={`lg_${date}`} type="liturgy" title="Evangelho" content={data.gospel.text} />
            </header>
            <h4 className="font-serif font-bold text-4xl text-gold">{data.gospel.reference}</h4>
            <p className="font-serif text-white font-bold text-2xl md:text-4xl leading-relaxed italic text-justify drop-shadow-lg">
              "{data.gospel.text}"
            </p>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 italic font-serif text-lg text-white/70">
              {data.gospel.reflection}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default DailyLiturgy;
