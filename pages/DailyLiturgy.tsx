
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Icons } from '../constants';
import { getNativeLiturgy } from '../services/nativeData';
import { getIntelligentStudy } from '../services/gemini';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';
import { DailyLiturgyContent } from '../types';

const DailyLiturgy: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyLiturgyContent>(getNativeLiturgy(date));
  const [isStudying, setIsStudying] = useState(false);

  useEffect(() => {
    // Carrega instantaneamente o nativo
    setData(getNativeLiturgy(date));
  }, [date]);

  const handleDeepStudy = async () => {
    setIsStudying(true);
    try {
      const topic = `Liturgia do dia ${date}: ${data.gospel.reference}`;
      // Aqui usamos a IA apenas para a categoria "Estudo Aprofundado" conforme solicitado
      window.dispatchEvent(new CustomEvent('cathedra-open-ai-study', { detail: { topic } }));
    } finally {
      setIsStudying(false);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-40 px-4 animate-in fade-in duration-500">
      <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-full border border-stone-200 shadow-2xl p-2 flex items-center justify-between">
        <button onClick={() => {
           const d = new Date(date + 'T12:00:00');
           d.setDate(d.getDate() - 1);
           setDate(d.toISOString().split('T')[0]);
        }} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
        
        <div className="font-serif font-bold text-lg text-stone-900 dark:text-gold">
          {new Date(date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long' })}
        </div>

        <button onClick={() => {
           const d = new Date(date + 'T12:00:00');
           d.setDate(d.getDate() + 1);
           setDate(d.toISOString().split('T')[0]);
        }} className="p-3 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
      </nav>

      <header className="bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] border-t-[12px] border-gold shadow-2xl text-center relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Lecionário Romano</span>
          <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">O Verbo se fez Carne</h2>
        </div>
      </header>

      <article className="space-y-20">
        <section className="bg-white dark:bg-stone-900/40 p-10 md:p-16 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-8">
          <div className="flex justify-between items-center border-b pb-6 dark:border-stone-800">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred">Leitura I</h3>
            <ActionButtons itemId={`lit1_${date}`} type="liturgy" title="Leitura I" content={data.firstReading.text} />
          </div>
          <h4 className="font-serif font-bold text-3xl text-stone-900 dark:text-gold">{data.firstReading.reference}</h4>
          <p className="font-serif text-stone-800 dark:text-stone-200 text-xl leading-relaxed text-justify">
            {data.firstReading.text}
          </p>
        </section>

        <section className="bg-stone-900 p-10 md:p-16 rounded-[3.5rem] text-white shadow-2xl space-y-8 border-l-[12px] border-gold">
          <div className="flex justify-between items-center border-b border-white/10 pb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Santo Evangelho</h3>
            <ActionButtons itemId={`litg_${date}`} type="liturgy" title="Evangelho" content={data.gospel.text} />
          </div>
          <h4 className="font-serif font-bold text-3xl text-gold">{data.gospel.reference}</h4>
          <p className="font-serif text-white font-bold text-2xl leading-relaxed text-justify italic">
            {data.gospel.text}
          </p>
        </section>

        <section className="bg-[#fcf8e8] dark:bg-stone-800/20 p-12 rounded-[4rem] border-2 border-gold/10 text-center space-y-8">
           <div className="space-y-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-stone-400">Investigação da Verdade</h3>
              <p className="text-xl font-serif italic text-stone-500">Deseja uma analogia profunda entre estas leituras e o Catecismo?</p>
           </div>
           <button 
             onClick={handleDeepStudy}
             disabled={isStudying}
             className="px-12 py-5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
           >
             {isStudying ? "Consultando a Symphonia..." : "Solicitar Análise IA"}
           </button>
        </section>
      </article>
    </div>
  );
};

export default DailyLiturgy;
