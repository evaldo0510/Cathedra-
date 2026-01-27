
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { getNativeLiturgy } from '../services/nativeData';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';
import { DailyLiturgyContent, AppRoute } from '../types';

const DailyLiturgy: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // O estado inicial já é o dado nativo, eliminando a tela branca
  const [data, setData] = useState<DailyLiturgyContent>(getNativeLiturgy(date));
  const [isStudying, setIsStudying] = useState(false);

  useEffect(() => {
    // Carrega instantaneamente o nativo quando a data muda
    setData(getNativeLiturgy(date));
  }, [date]);

  const handleDeepStudy = () => {
    setIsStudying(true);
    const topic = `Liturgia do dia ${date}: ${data.gospel.reference}. Faça uma analogia entre estas leituras e o Catecismo.`;
    // Dispara o evento para o App.tsx mudar para a aba de estudo com este tema
    window.dispatchEvent(new CustomEvent('cathedra-open-ai-study', { detail: { topic } }));
    setTimeout(() => setIsStudying(false), 500);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-48 px-4 md:px-6 animate-in fade-in duration-500">
      {/* Navegação de Data Profissional */}
      <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-2xl p-2 flex items-center justify-between">
        <button onClick={() => {
           const d = new Date(date + 'T12:00:00');
           d.setDate(d.getDate() - 1);
           setDate(d.toISOString().split('T')[0]);
        }} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl hover:bg-stone-100 transition-colors"><Icons.ArrowDown className="w-5 h-5 rotate-90 text-stone-600 dark:text-stone-400" /></button>
        
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-gold mb-1">Calendário Romano</span>
          <div className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            {new Date(date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <button onClick={() => {
           const d = new Date(date + 'T12:00:00');
           d.setDate(d.getDate() + 1);
           setDate(d.toISOString().split('T')[0]);
        }} className="p-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl shadow-lg hover:scale-105 transition-all"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
      </nav>

      {/* Header Estilo Missal de Luxo */}
      <header className="bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] border-t-[12px] border-gold shadow-2xl text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10 space-y-6">
          <Icons.Cross className="w-12 h-12 text-sacred mx-auto mb-4" />
          <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">O Alimento da <br/> <span className="text-sacred">Palavra Viva</span></h2>
          <div className="h-px w-32 bg-gold/30 mx-auto" />
          <p className="text-stone-400 font-serif italic text-xl md:text-2xl max-w-2xl mx-auto">"{data.collect}"</p>
        </div>
      </header>

      {/* Corpo da Liturgia */}
      <article className="space-y-16">
        {/* Leitura I */}
        <section className="bg-white dark:bg-stone-900/40 p-10 md:p-16 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-10 group">
          <div className="flex justify-between items-center border-b pb-6 border-stone-50 dark:border-stone-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold font-bold">I</div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Leitura I</h3>
            </div>
            <ActionButtons itemId={`lit1_${date}`} type="liturgy" title="Leitura I" content={data.firstReading.text} />
          </div>
          <div className="space-y-6">
            <h4 className="font-serif font-bold text-3xl md:text-4xl text-stone-900 dark:text-gold leading-tight">{data.firstReading.reference}</h4>
            <p className="font-serif text-stone-800 dark:text-stone-200 text-xl md:text-2xl leading-relaxed text-justify indent-8">
              {data.firstReading.text}
            </p>
          </div>
        </section>

        {/* Salmo */}
        <section className="bg-stone-50 dark:bg-stone-950/40 p-10 md:p-16 rounded-[3.5rem] shadow-inner border border-stone-100 dark:border-stone-800 space-y-8 text-center max-w-3xl mx-auto">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Salmo Responsorial</h3>
          <h4 className="font-serif font-bold text-2xl text-sacred italic">{data.psalm.title}</h4>
          <p className="font-serif text-stone-700 dark:text-stone-300 text-2xl md:text-3xl leading-snug font-bold">
            {data.psalm.text}
          </p>
        </section>

        {/* Evangelho */}
        <section className="bg-[#1a1a1a] p-10 md:p-20 rounded-[4rem] text-white shadow-3xl space-y-12 border-l-[16px] border-sacred relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-[10s]">
            <Icons.Book className="w-96 h-96 text-white" />
          </div>
          <div className="relative z-10 space-y-10">
            <div className="flex justify-between items-center border-b border-white/10 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sacred rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                  <Icons.Cross className="w-6 h-6" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">Santo Evangelho</h3>
              </div>
              <ActionButtons itemId={`litg_${date}`} type="liturgy" title="Evangelho" content={data.gospel.text} />
            </div>
            <div className="space-y-8">
              <h4 className="font-serif font-bold text-4xl md:text-6xl text-gold tracking-tight">{data.gospel.reference}</h4>
              <p className="font-serif text-white font-bold text-2xl md:text-4xl leading-relaxed text-justify italic drop-shadow-xl">
                "{data.gospel.text}"
              </p>
            </div>
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 mt-8">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-gold mb-3">Reflexão Espiritual</h5>
              <p className="font-serif italic text-xl text-white/80 leading-relaxed">{data.gospel.reflection}</p>
            </div>
          </div>
        </section>

        {/* Call to Action IA - Symphonia */}
        <section className="bg-[#fcf8e8] dark:bg-stone-800/20 p-12 md:p-16 rounded-[4.5rem] border-2 border-gold/10 text-center space-y-10 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="space-y-4 relative z-10">
              <h3 className="text-[12px] font-black uppercase tracking-[0.8em] text-gold">Investigação Symphonia IA</h3>
              <p className="text-2xl md:text-3xl font-serif italic text-stone-600 dark:text-stone-400 max-w-3xl mx-auto leading-tight">
                "Deseja um mergulho profundo no nexo desta liturgia com o Catecismo?"
              </p>
           </div>
           <button 
             onClick={handleDeepStudy}
             disabled={isStudying}
             className="px-16 py-7 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto relative z-10"
           >
             {isStudying ? (
               <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
             ) : (
               <>
                 <Icons.Search className="w-5 h-5" />
                 Solicitar Análise Teológica IA
               </>
             )}
           </button>
        </section>
      </article>

      <footer className="text-center pt-12 pb-20 opacity-20">
         <p className="text-[10px] font-black uppercase tracking-[1em] mb-4">Verbum Domini</p>
         <Icons.Cross className="w-8 h-8 mx-auto" />
      </footer>
    </div>
  );
};

export default DailyLiturgy;
