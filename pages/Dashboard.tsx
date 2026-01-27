
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { AppRoute, User } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';
import { getDailyNativeContent } from '../services/nativeData';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t, handleInstall } = useContext(LangContext);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Agora usa dados nativos locais para o dashboard básico
    const data = getDailyNativeContent();
    setDailyData(data);
    setLoading(false);
  }, []);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  return (
    <div className="space-y-24 pb-32 animate-in fade-in duration-700 -mt-10">
      {/* SEÇÃO HERO: O VERBO HOJE (NATIVO) */}
      <section className="relative h-[80vh] md:h-[90vh] mx-[-1rem] md:mx-[-4rem] lg:mx-[-6rem] overflow-hidden group shadow-4xl border-b border-gold/20 bg-stone-950">
        <div className="absolute inset-0 z-0">
          <SacredImage 
            src={dailyData?.verse?.imageUrl || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600"} 
            alt="Palavra do Dia" 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[30000ms]" 
            priority={true} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/40 to-transparent" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-24 space-y-12 max-w-7xl">
          <div className="space-y-6 animate-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-4">
              <span className="px-6 py-2 bg-sacred text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl border border-white/10 backdrop-blur-md">
                Luz do Dia (Lumen Diei)
              </span>
              <span className="text-white/70 text-xl font-serif italic border-l border-white/20 pl-4">{dailyData?.verse?.reference}</span>
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-white tracking-tighter leading-[0.85] drop-shadow-4xl max-w-5xl">
               {dailyData?.verse?.verse}
            </h1>
          </div>

          <div className="flex flex-wrap gap-5">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-14 py-6 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-white transition-all active:scale-95 flex items-center gap-4 group">
              <Icons.Book className="w-6 h-6 group-hover:rotate-6 transition-transform" /> Abrir Bíblia
            </button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="px-14 py-6 bg-white/10 backdrop-blur-3xl text-white border border-white/20 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/20 transition-all flex items-center gap-4 group">
              <Icons.History className="w-6 h-6 text-gold group-hover:rotate-[-10deg] transition-transform" /> Ver Liturgia
            </button>
          </div>
        </div>
      </section>

      {/* BANNER DE INSTALAÇÃO (NATIVO) */}
      {!isStandalone && (
        <section className="max-w-7xl mx-auto px-4">
           <div className="bg-stone-900 rounded-[4rem] p-10 md:p-16 border border-gold/30 shadow-sacred relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:scale-110 transition-transform duration-[10s]">
                 <Icons.Mobile className="w-64 h-64 text-gold" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                 <div className="space-y-6 text-center md:text-left">
                    <h3 className="text-4xl md:text-6xl font-serif font-bold text-white leading-none">Acesso Rápido</h3>
                    <p className="text-white/60 font-serif italic text-xl max-w-2xl leading-relaxed">
                      Instale o app e tenha o depósito da fé disponível mesmo sem conexão.
                    </p>
                 </div>
                 <button 
                  onClick={handleInstall}
                  className="px-16 py-8 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-white transition-all active:scale-95"
                 >
                    Baixar Aplicativo
                 </button>
              </div>
           </div>
        </section>
      )}

      {/* SENTENÇA DOS SANTOS (NATIVO) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white dark:bg-stone-900 p-20 md:p-32 rounded-[6rem] shadow-4xl border border-stone-100 dark:border-white/5 relative overflow-hidden flex items-center justify-center">
          <div className="relative z-10 text-center space-y-16 w-full">
             <div className="flex flex-col items-center gap-6">
                <span className="text-[14px] font-black uppercase tracking-[1.2em] text-gold">Sentença dos Santos</span>
             </div>
             
             <div className="animate-in fade-in duration-1000">
                <p className="text-4xl md:text-7xl lg:text-8xl font-serif italic text-stone-800 dark:text-stone-100 leading-[1.05] tracking-tight max-w-6xl mx-auto">
                  "{dailyData?.saint?.quote}"
                </p>
                <div className="space-y-2 mt-12">
                  <h5 className="text-3xl font-serif font-bold text-stone-900 dark:text-gold uppercase tracking-widest">{dailyData?.saint?.name}</h5>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Patrono: {dailyData?.saint?.patronage}</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* INVESTIGAÇÃO IA (PRO FEATURE - ÚNICA COM GEMINI AQUI) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-sacred p-12 md:p-24 rounded-[5rem] text-white shadow-3xl relative overflow-hidden group">
           <Icons.Feather className="absolute top-0 right-0 w-96 h-96 opacity-[0.03] group-hover:rotate-12 transition-transform duration-[5s]" />
           <div className="relative z-10 space-y-10 text-center md:text-left">
              <header className="space-y-4">
                 <span className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">Recurso Premium</span>
                 <h3 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter leading-none">Estudo e Sinfonia IA</h3>
                 <p className="text-xl md:text-2xl text-white/60 font-serif italic max-w-2xl">A inteligência do Google realizando analogias profundas entre o Catecismo e as Escrituras para você.</p>
              </header>
              <button 
                onClick={() => onNavigate(AppRoute.STUDY_MODE)}
                className="px-16 py-8 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-white transition-all active:scale-95 flex items-center gap-4 mx-auto md:mx-0"
              >
                Iniciar Investigação Profunda
              </button>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
