
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { fetchDailyMass } from '../services/gemini';
import { LangContext } from '../App';

const Missal: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchDailyMass(lang);
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lang]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-400 font-serif italic text-xl">Preparando o Altar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Missale Romanum</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl">O Sacrifício Pascal no Coração da Igreja</p>
      </header>

      <div className="parchment dark:bg-stone-900 p-8 md:p-16 rounded-[4rem] shadow-3xl border border-gold/10 space-y-16">
        {/* Ritos Iniciais */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8b0000]">I. Ritus Initiales</span>
            <div className="h-px flex-1 bg-gold/10" />
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase text-gold">Antífona de Entrada</h4>
                <p className="text-xl md:text-2xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">"{data?.intro?.antiphon}"</p>
             </div>
             <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase text-gold">Oração Coleta</h4>
                <p className="text-xl md:text-2xl font-serif text-stone-900 dark:text-stone-100">{data?.intro?.collect}</p>
             </div>
          </div>
        </section>

        {/* Liturgia da Palavra */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8b0000]">II. Liturgia Verbi</span>
            <div className="h-px flex-1 bg-gold/10" />
          </div>
          <div className="space-y-10">
             <div className="space-y-4">
                <span className="text-sm font-bold text-stone-400">Leitura • {data?.word?.firstReading?.ref}</span>
                <p className="text-xl md:text-2xl font-serif text-stone-700 dark:text-stone-300 leading-snug">{data?.word?.firstReading?.text}</p>
             </div>
             <div className="bg-stone-50 dark:bg-stone-800/50 p-8 rounded-3xl space-y-4 border-l-4 border-gold">
                <span className="text-sm font-bold text-[#8b0000]">Salmo Responsorial</span>
                <p className="text-2xl md:text-3xl font-serif italic text-stone-900 dark:text-white">{data?.word?.psalm?.text}</p>
             </div>
             <div className="space-y-4">
                <span className="text-sm font-bold text-stone-400">Evangelho • {data?.word?.gospel?.ref}</span>
                <p className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{data?.word?.gospel?.text}</p>
             </div>
          </div>
        </section>

        {/* Liturgia Eucarística */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8b0000]">III. Liturgia Eucharistica</span>
            <div className="h-px flex-1 bg-gold/10" />
          </div>
          <div className="space-y-6">
             <div className="bg-[#fcf8e8] dark:bg-stone-800/50 p-10 rounded-[3rem] border border-gold/20 shadow-inner">
                <h4 className="text-[9px] font-black uppercase text-gold mb-4 text-center">Sobre as Oferendas</h4>
                <p className="text-xl md:text-2xl font-serif italic text-stone-800 dark:text-stone-200 text-center leading-relaxed">
                  {data?.eucharist?.prayer}
                </p>
             </div>
          </div>
        </section>

        <footer className="text-center opacity-30 pt-10">
           <Icons.Cross className="w-8 h-8 mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4">Ite, Missa Est</p>
        </footer>
      </div>
    </div>
  );
};

export default Missal;
