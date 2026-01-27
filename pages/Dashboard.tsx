
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { AppRoute, User } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';
import { getDailyNativeContent } from '../services/nativeData';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t, handleInstall } = useContext(LangContext);
  const [dailyData, setDailyData] = useState<any>(getDailyNativeContent());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carrega nativo imediatamente. Poderia haver um re-fetch silencioso depois,
    // mas o importante é o conteúdo estar lá desde o tempo zero.
    setDailyData(getDailyNativeContent());
  }, []);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  return (
    <div className="space-y-24 pb-48 animate-in fade-in duration-700 -mt-10">
      {/* SEÇÃO HERO: O VERBO HOJE (IMEDIATO) */}
      <section className="relative h-[85vh] md:h-[95vh] mx-[-1rem] md:mx-[-4rem] lg:mx-[-6rem] overflow-hidden group shadow-4xl bg-stone-950 border-b border-gold/10">
        <div className="absolute inset-0 z-0">
          <SacredImage 
            src={dailyData?.verse?.imageUrl || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600"} 
            alt="Palavra do Dia" 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[40000ms]" 
            priority={true} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/40 to-transparent" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-24 space-y-12 max-w-7xl">
          <div className="space-y-8 animate-in slide-in-from-left-12 duration-1000">
            <div className="flex items-center gap-6">
              <div className="px-8 py-3 bg-sacred text-white text-[11px] font-black uppercase tracking-[0.5em] rounded-full shadow-2xl border border-white/10 backdrop-blur-md">
                Lumen Diei
              </div>
              <span className="text-gold/80 text-2xl font-serif italic border-l-2 border-gold/30 pl-6 leading-none">{dailyData?.verse?.reference}</span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[9.5rem] font-serif font-bold text-white tracking-tighter leading-[0.82] drop-shadow-4xl max-w-5xl">
               {dailyData?.verse?.verse}
            </h1>
          </div>

          <div className="flex flex-wrap gap-6 pt-4">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-16 py-8 bg-gold text-stone-900 rounded-[3rem] font-black uppercase tracking-widest text-[12px] shadow-2xl hover:bg-white transition-all active:scale-95 flex items-center gap-5 group">
              <Icons.Book className="w-7 h-7 group-hover:rotate-12 transition-transform" /> Adentrar as Escrituras
            </button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="px-16 py-8 bg-white/10 backdrop-blur-3xl text-white border border-white/20 rounded-[3rem] font-black uppercase tracking-widest text-[12px] hover:bg-white/20 transition-all flex items-center gap-5 group">
              <Icons.History className="w-7 h-7 text-gold group-hover:rotate-[-12deg] transition-transform" /> Ver Liturgia do Dia
            </button>
          </div>
        </div>
      </section>

      {/* SENTENÇA DOS SANTOS (GRATUITO E NATIVO) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white dark:bg-stone-900 p-20 md:p-32 rounded-[6rem] shadow-4xl border border-stone-100 dark:border-white/5 relative overflow-hidden flex items-center justify-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-sacred/5 opacity-50" />
          <div className="relative z-10 text-center space-y-16 w-full">
             <div className="flex flex-col items-center gap-4">
                <Icons.Cross className="w-10 h-10 text-gold mb-2" />
                <span className="text-[16px] font-black uppercase tracking-[1.5em] text-stone-300 dark:text-stone-700">Sententia Sanctorum</span>
             </div>
             
             <div className="animate-in fade-in duration-[2000ms]">
                <p className="text-4xl md:text-7xl lg:text-8xl font-serif italic text-stone-800 dark:text-stone-100 leading-[1.05] tracking-tight max-w-6xl mx-auto indent-10">
                  "{dailyData?.saint?.quote}"
                </p>
                <div className="space-y-4 mt-16 flex flex-col items-center">
                  <div className="h-px w-24 bg-gold/40 mb-4" />
                  <h5 className="text-4xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">{dailyData?.saint?.name}</h5>
                  <p className="text-[11px] font-black uppercase tracking-[0.6em] text-stone-400">Doutor e Patrono: {dailyData?.saint?.patronage}</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ACESSO RÁPIDO (PRATELEIRA DE FERRAMENTAS) */}
      <section className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
         {[
           { title: 'Codex Fidei', sub: 'O Catecismo Completo', route: AppRoute.CATECHISM, icon: Icons.Cross, color: 'text-sacred' },
           { title: 'Magisterium', sub: 'Depósito da Verdade', route: AppRoute.MAGISTERIUM, icon: Icons.Globe, color: 'text-gold' },
           { title: 'Opera Omnia', sub: 'Obras de S. Tomás', route: AppRoute.AQUINAS_OPERA, icon: Icons.Feather, color: 'text-stone-800' }
         ].map((item, idx) => (
           <button 
             key={idx}
             onClick={() => onNavigate(item.route)}
             className="bg-white dark:bg-stone-900 p-12 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl text-left hover:border-gold hover:-translate-y-2 transition-all group overflow-hidden relative"
           >
             <div className="absolute -right-6 -bottom-6 p-6 opacity-[0.05] group-hover:scale-110 transition-transform">
                <item.icon className="w-32 h-32" />
             </div>
             <div className={`p-5 rounded-2xl bg-stone-50 dark:bg-stone-800 inline-block mb-8 transition-colors group-hover:bg-gold group-hover:text-stone-900 ${item.color}`}>
                <item.icon className="w-8 h-8" />
             </div>
             <h4 className="text-3xl font-serif font-bold mb-2 group-hover:text-gold transition-colors">{item.title}</h4>
             <p className="text-stone-400 font-serif italic text-lg">{item.sub}</p>
           </button>
         ))}
      </section>

      {/* SEÇÃO INVESTIGAÇÃO IA (PREMIUM - GEMINI) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-stone-900 p-12 md:p-24 rounded-[6rem] text-white shadow-3xl relative overflow-hidden group border border-gold/20">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
           <Icons.Feather className="absolute top-0 right-0 w-[40rem] h-[40rem] opacity-[0.02] group-hover:rotate-12 transition-transform duration-[10s]" />
           <div className="relative z-10 space-y-12 text-center md:text-left">
              <header className="space-y-6">
                 <div className="flex items-center gap-4 justify-center md:justify-start">
                    <span className="w-3 h-3 bg-gold rounded-full animate-pulse" />
                    <span className="text-[12px] font-black uppercase tracking-[0.6em] text-gold">Symphonia Intelligentia</span>
                 </div>
                 <h3 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter leading-none">Estudo e Sinfonia IA</h3>
                 <p className="text-2xl md:text-3xl text-white/60 font-serif italic max-w-3xl leading-relaxed">
                   A inteligência artificial do Google realizando analogias cruzadas instantâneas entre o Catecismo, a Patrística e as Sagradas Escrituras.
                 </p>
              </header>
              <button 
                onClick={() => onNavigate(AppRoute.STUDY_MODE)}
                className="px-20 py-8 bg-gold text-stone-900 rounded-[3rem] font-black uppercase tracking-[0.5em] text-[12px] shadow-2xl hover:bg-white transition-all active:scale-95 flex items-center gap-6 mx-auto md:mx-0 group"
              >
                <Icons.Search className="w-6 h-6 group-hover:scale-125 transition-transform" /> Iniciar Investigação Profunda
              </button>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
