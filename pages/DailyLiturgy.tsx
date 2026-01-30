
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Icons } from '../constants';
import { getNativeLiturgy } from '../services/nativeData';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';
import { DailyLiturgyContent, AppRoute } from '../types';

const DailyLiturgy: React.FC = () => {
  const { lang } = useContext(LangContext);
  const urlParams = new URLSearchParams(window.location.search);
  const initialDate = urlParams.get('date') || new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(initialDate);
  const [data, setData] = useState<DailyLiturgyContent | null>(null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [fontSize, setFontSize] = useState(1.15);
  const [loading, setLoading] = useState(true);

  // Função otimizada para carregar conteúdo e gerenciar scroll
  const loadContent = useCallback(async (targetDate: string) => {
    setLoading(true);
    setData(null); 

    // Simulação de delay para carregamento e limpeza de DOM
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      const localData = getNativeLiturgy(targetDate);
      setData(localData);
    } catch (e) {
      console.error("Liturgy Load Error:", e);
    } finally {
      setLoading(false);
      // Garante que o scroll volte ao topo para a nova leitura
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    loadContent(date);
  }, [date, loadContent]);

  const changeDate = (offset: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    const newDate = d.toISOString().split('T')[0];
    setDate(newDate);
    
    // Atualização de URL silenciosa
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('date', newDate);
    window.history.replaceState({}, '', newUrl);
  };

  const getAdjacentDateLabel = (offset: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  };

  const SkeletonLiturgy = () => (
    <div className="max-w-4xl mx-auto space-y-16 animate-pulse pb-20 mt-10">
      <div className="h-40 bg-stone-100 dark:bg-stone-900 rounded-[3rem]" />
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-white dark:bg-stone-900/50 rounded-[4rem] border border-stone-50 dark:border-stone-800" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-48 px-1 md:px-4">
      
      {/* MODO IMERSIVO */}
      {isImmersive && data && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#fdfcf8] dark:bg-[#0c0a09] p-6 md:p-20 animate-in fade-in duration-500">
           <div className="max-w-3xl mx-auto space-y-16 pb-40">
              <header className="text-center space-y-4 pt-10">
                 <span className="text-[10px] font-black uppercase text-gold tracking-widest">Lectio Sollemnis</span>
                 <h1 className="text-5xl md:text-8xl font-serif font-bold tracking-tight dark:text-gold">Mysterium Fidei</h1>
                 <div className="h-px w-20 bg-gold/30 mx-auto" />
              </header>
              <div className="space-y-16 md:space-y-24 font-serif leading-[1.9] text-stone-800 dark:text-stone-300" style={{ fontSize: `${fontSize * 1.15}rem` }}>
                 <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl text-sacred uppercase font-bold border-b border-sacred/10 pb-4">Leitura</h2>
                    <p className="italic text-stone-400 text-base">{data.firstReading.reference}</p>
                    <p className="text-justify indent-10">{data.firstReading.text}</p>
                 </section>
                 <section className="space-y-6 text-center italic py-12">
                    <p className="text-3xl md:text-5xl font-bold leading-tight text-stone-900 dark:text-white">"{data.psalm.text}"</p>
                 </section>
                 <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl text-sacred uppercase font-bold border-b border-sacred/10 pb-4">Evangelho</h2>
                    <p className="italic text-stone-400 text-base">{data.gospel.reference}</p>
                    <p className="text-justify font-bold indent-10 text-stone-900 dark:text-white">{data.gospel.text}</p>
                 </section>
              </div>
           </div>
           <button onClick={() => setIsImmersive(false)} className="fixed bottom-10 right-10 p-5 bg-gold text-stone-900 rounded-full shadow-4xl hover:scale-110 active:scale-90 transition-all z-[1010]"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
        </div>
      )}

      {/* CABEÇALHO DE NAVEGAÇÃO */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white dark:bg-stone-900 p-8 rounded-[3.5rem] shadow-2xl border border-stone-100 dark:border-white/5 relative z-10">
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-gold animate-ping' : 'bg-sacred animate-pulse'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold/80">Calendarium Romanum</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">
            {new Date(date + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-stone-400 font-serif italic text-lg capitalize">{new Date(date + 'T12:00:00').toLocaleDateString(lang, { weekday: 'long' })}</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => changeDate(-1)} 
            disabled={loading}
            className="p-4 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold rounded-2xl transition-all active:scale-95 disabled:opacity-20"
            title="Dia Anterior"
          >
            <Icons.ArrowDown className="w-6 h-6 rotate-90" />
          </button>
          
          <button 
            onClick={() => setIsImmersive(true)}
            disabled={loading || !data}
            className="px-10 py-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
          >
            Leitura Imersiva
          </button>

          <button 
            onClick={() => changeDate(1)} 
            disabled={loading}
            className="p-4 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-gold rounded-2xl transition-all active:scale-95 disabled:opacity-20"
            title="Dia Seguinte"
          >
            <Icons.ArrowDown className="w-6 h-6 -rotate-90" />
          </button>
        </div>
      </header>

      <main className="min-h-[60vh] relative">
        {loading || !data ? (
          <SkeletonLiturgy />
        ) : (
          <article className="space-y-16 md:space-y-24 animate-in slide-in-from-bottom-6 duration-700 max-w-5xl mx-auto" style={{ fontSize: `${fontSize}rem` }}>
              
              <section className="bg-[#fcf8e8] dark:bg-[#110f0e] p-12 md:p-20 rounded-[4rem] border border-gold/10 shadow-inner italic text-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Icons.Cross className="w-40 h-40" /></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.6em] text-sacred dark:text-gold block mb-8">Oratio Collecta</span>
                 <p className="font-serif text-stone-700 dark:text-stone-300 text-2xl md:text-4xl leading-relaxed max-w-3xl mx-auto">
                   "{data.collect}"
                 </p>
              </section>

              <section className="bg-white dark:bg-stone-900 p-10 md:p-24 rounded-[4rem] md:rounded-[6rem] shadow-4xl border border-stone-50 dark:border-stone-800 space-y-12 relative">
                <header className="flex flex-col md:flex-row justify-between items-center md:items-start border-b dark:border-stone-800 pb-10 gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">Lectio Prima</span>
                    <h4 className="font-serif font-bold text-4xl md:text-6xl text-sacred leading-tight tracking-tight">{data.firstReading.reference}</h4>
                  </div>
                  <ActionButtons itemId={`liturgy_l1_${date}`} type="liturgy" title={`I Leitura - ${date}`} content={data.firstReading.text} className="scale-125" />
                </header>
                <p className="font-serif text-stone-800 dark:text-stone-200 text-2xl md:text-3xl leading-[1.85] text-justify indent-12 md:indent-20 whitespace-pre-wrap selection:bg-gold/30">
                  {data.firstReading.text}
                </p>
              </section>

              <section className="bg-stone-900 p-12 md:p-28 rounded-[5rem] md:rounded-[8rem] shadow-sacred text-center space-y-10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
                <span className="text-[11px] md:text-[13px] font-black uppercase text-gold/50 tracking-[0.8em] relative z-10">Psalmus Responsorius</span>
                <p className="text-xl font-bold text-sacred uppercase tracking-[0.4em] relative z-10">{data.psalm.title}</p>
                <p className="font-serif font-bold text-3xl md:text-7xl text-white italic leading-[1.2] max-w-4xl mx-auto relative z-10 drop-shadow-lg group-hover:scale-[1.02] transition-transform duration-700">
                  "{data.psalm.text}"
                </p>
              </section>

              <section className="bg-white dark:bg-[#0c0a09] p-10 md:p-28 rounded-[5rem] md:rounded-[8rem] text-stone-900 dark:text-white shadow-4xl space-y-16 border-t-[24px] border-sacred relative overflow-hidden">
                <header className="flex flex-col md:flex-row justify-between items-center md:items-start border-b border-stone-100 dark:border-white/5 pb-10 gap-6 relative z-10">
                   <div className="space-y-2 text-center md:text-left">
                     <span className="text-[12px] font-black uppercase tracking-[0.6em] text-gold">Sanctum Evangelium</span>
                     <h4 className="font-serif font-bold text-4xl md:text-7xl text-stone-900 dark:text-gold leading-tight tracking-tighter">{data.gospel.reference}</h4>
                   </div>
                   <ActionButtons itemId={`liturgy_gospel_${date}`} type="liturgy" title={`Evangelho - ${date}`} content={data.gospel.text} className="scale-150" />
                </header>
                
                <p className="font-serif text-stone-900 dark:text-stone-100 font-bold text-3xl md:text-5xl leading-[1.75] italic text-justify drop-shadow-sm relative z-10 whitespace-pre-wrap selection:bg-sacred/20">
                  "{data.gospel.text}"
                </p>

                {data.gospel.reflection && (
                  <div className="mt-20 p-12 bg-stone-50 dark:bg-stone-900/50 rounded-[4rem] border-l-[16px] border-gold relative z-10 shadow-inner group">
                     <Icons.Feather className="absolute top-10 right-10 w-20 h-20 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-6">Medidatio Brevis (Reflexão)</span>
                     <p className="font-serif italic text-2xl md:text-3xl text-stone-600 dark:text-stone-300 leading-relaxed text-justify">
                       {data.gospel.reflection}
                     </p>
                  </div>
                )}
              </section>

              {/* NAVEGAÇÃO DE RODAPÉ (PROFISSIONAL) */}
              <nav className="w-full grid grid-cols-2 gap-4 md:gap-12 mt-32 pt-16 border-t border-stone-100 dark:border-stone-800">
                <button 
                  onClick={() => changeDate(-1)}
                  disabled={loading}
                  className="group flex items-center gap-5 text-left transition-all active:scale-95 disabled:opacity-20"
                >
                  <div className="p-4 md:p-6 rounded-[2rem] bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 group-hover:border-gold transition-colors shadow-lg">
                    <Icons.ArrowDown className="w-6 h-6 rotate-90 text-stone-400 group-hover:text-gold transition-transform group-hover:-translate-x-1" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Dia Anterior</span>
                    <span className="block text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">
                      {getAdjacentDateLabel(-1)}
                    </span>
                  </div>
                </button>

                <button 
                  onClick={() => changeDate(1)}
                  disabled={loading}
                  className="group flex items-center justify-end gap-5 text-right transition-all active:scale-95 disabled:opacity-20"
                >
                  <div className="hidden sm:block">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Próximo Dia</span>
                    <span className="block text-2xl font-serif font-bold text-gold leading-none">
                      {getAdjacentDateLabel(1)}
                    </span>
                  </div>
                  <div className="p-4 md:p-6 rounded-[2rem] bg-stone-900 text-gold border border-stone-800 group-hover:bg-sacred group-hover:text-white group-hover:border-sacred transition-all shadow-2xl">
                    <Icons.ArrowDown className="w-6 h-6 -rotate-90 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </nav>
          </article>
        )}
      </main>

      {/* CONTROLES DE ACESSIBILIDADE */}
      <div className="fixed bottom-24 right-6 md:right-10 z-[300] flex flex-col gap-4">
          <button 
            onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))} 
            className="p-6 bg-white/95 dark:bg-stone-800/95 backdrop-blur-xl rounded-[2.5rem] shadow-4xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-gold hover:scale-110 active:scale-95 transition-all"
          >
            <span className="text-2xl font-black">A+</span>
          </button>
          <button 
            onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} 
            className="p-6 bg-white/95 dark:bg-stone-800/95 backdrop-blur-xl rounded-[2.5rem] shadow-4xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-gold hover:scale-110 active:scale-95 transition-all"
          >
            <span className="text-xl font-black">A-</span>
          </button>
      </div>

      <footer className="text-center pt-16 pb-40 opacity-20 group">
         <Icons.Cross className="w-16 h-16 mx-auto mb-8 group-hover:rotate-180 transition-transform duration-[3s] text-stone-400" />
         <p className="text-[12px] font-black uppercase tracking-[1.2em]">Sempra Fidelis • Hodie</p>
      </footer>
    </div>
  );
};

export default DailyLiturgy;
