
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { AppRoute, User } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';
import { getDailyNativeContent } from '../services/nativeData';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang } = useContext(LangContext);
  const dailyData = getDailyNativeContent();

  const streak = user?.progress?.streak || 0;
  
  return (
    <div className="space-y-12 pb-48 animate-in fade-in duration-700 -mt-8">
      {/* SEÇÃO HERO: O VERBO HOJE */}
      <section className="relative h-[70vh] md:h-[80vh] mx-[-1rem] md:mx-[-3rem] lg:mx-[-3rem] overflow-hidden rounded-b-[4rem] md:rounded-b-[6rem] shadow-4xl bg-stone-950">
        <div className="absolute inset-0 z-0">
          <SacredImage 
            src={dailyData?.verse?.imageUrl || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600"} 
            alt="Palavra do Dia" 
            className="w-full h-full object-cover scale-105" 
            priority={true} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/50 to-transparent" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-20 space-y-8 max-w-7xl mx-auto">
          <div className="space-y-6 animate-in slide-in-from-left-8 duration-1000">
            <div className="flex items-center gap-4">
              <div className="px-6 py-2 bg-gold/90 backdrop-blur-md text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl">
                Lumen Diei
              </div>
              <div className="flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                 <Icons.Star className="w-3 h-3 text-gold fill-current" />
                 <span className="text-white text-[10px] font-black uppercase tracking-widest">{streak} Dias de Fé</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-7xl font-serif font-bold text-white tracking-tighter leading-tight drop-shadow-2xl max-w-4xl italic">
               "{dailyData?.verse?.verse}"
            </h1>
            <p className="text-gold text-xl md:text-2xl font-serif">{dailyData?.verse?.reference}</p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-10 py-5 bg-gold text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
              <Icons.Book className="w-5 h-5" /> Adentrar Escrituras
            </button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="px-10 py-5 bg-white/10 backdrop-blur-3xl text-white border border-white/20 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all flex items-center gap-4">
              <Icons.History className="w-5 h-5 text-gold" /> Liturgia
            </button>
          </div>
        </div>
      </section>

      {/* BENTO GRID DE FERRAMENTAS */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Card Longo: Progresso de Leitura */}
          <div className="md:col-span-2 bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icons.History className="w-40 h-40" />
             </div>
             <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                <div className="space-y-2">
                   <h3 className="text-3xl font-serif font-bold">Iter Sanctum</h3>
                   <p className="text-stone-400 font-serif italic">Sua jornada contínua pelo Depósito da Fé.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black uppercase text-stone-400">
                         <span>Bíblia</span>
                         <span>{user?.progress?.completedBooks?.length || 0}/73 Livros</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                         <div className="h-full bg-gold" style={{ width: `${((user?.progress?.completedBooks?.length || 0) / 73) * 100}%` }} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black uppercase text-stone-400">
                         <span>Catecismo</span>
                         <span>{user?.progress?.lastCatechismPara || 0}/2865 §§</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                         <div className="h-full bg-sacred" style={{ width: `${((user?.progress?.lastCatechismPara || 0) / 2865) * 100}%` }} />
                      </div>
                   </div>
                </div>

                <button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-2 hover:translate-x-2 transition-transform">
                   Retomar de onde parei <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
                </button>
             </div>
          </div>

          {/* Card Quadrado: Quiz */}
          <button onClick={() => onNavigate(AppRoute.CERTAMEN)} className="bg-sacred p-10 rounded-[3.5rem] shadow-2xl text-white text-left relative overflow-hidden group">
             <Icons.Layout className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="p-4 bg-white/10 rounded-2xl w-fit"><Icons.Layout className="w-6 h-6" /></div>
                <div className="space-y-2">
                   <h4 className="text-2xl font-serif font-bold">Certamen</h4>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Desafie seu Intelecto</p>
                </div>
             </div>
          </button>

          {/* Card Quadrado: Rosário */}
          <button onClick={() => onNavigate(AppRoute.ROSARY)} className="bg-stone-900 p-10 rounded-[3.5rem] shadow-2xl text-gold text-left relative overflow-hidden group border border-gold/10">
             <Icons.Star className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:rotate-45 transition-transform duration-[3s]" />
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="p-4 bg-gold/10 rounded-2xl w-fit"><Icons.Star className="w-6 h-6 text-gold" /></div>
                <div className="space-y-2">
                   <h4 className="text-2xl font-serif font-bold">Rosarium</h4>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Oração Meditada</p>
                </div>
             </div>
          </button>
        </div>
      </section>

      {/* SEÇÃO IA: SYMPHONIA (PREMIUM) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-stone-50 dark:bg-[#111] p-12 md:p-24 rounded-[5rem] shadow-xl border border-stone-200 dark:border-white/5 relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.03]" />
           <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <span className="w-3 h-3 bg-gold rounded-full animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gold">Intelligentia Artificialis</span>
                 </div>
                 <h3 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">A Sinfonia do Depósito da Fé</h3>
                 <p className="text-2xl font-serif italic text-stone-500 leading-relaxed">
                    Conecte o Catecismo às Escrituras através da inteligência do Gemini Pro. Realize exegeses imediatas e analogias teológicas profundas.
                 </p>
                 <button onClick={() => onNavigate(AppRoute.STUDY_MODE)} className="px-12 py-6 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all">
                    Iniciar Nova Investigação
                 </button>
              </div>
              <div className="relative hidden lg:block">
                 <div className="p-16 bg-white dark:bg-stone-800 rounded-[4rem] shadow-4xl border border-stone-100 dark:border-white/5 rotate-3 relative z-10">
                    <Icons.Feather className="w-24 h-24 text-gold mx-auto mb-8" />
                    <div className="space-y-4">
                       <div className="h-2 w-3/4 bg-stone-100 dark:bg-stone-700 rounded-full" />
                       <div className="h-2 w-full bg-stone-100 dark:bg-stone-700 rounded-full" />
                       <div className="h-2 w-1/2 bg-stone-100 dark:bg-stone-700 rounded-full" />
                    </div>
                 </div>
                 <div className="absolute -inset-10 bg-gold/10 blur-[80px] rounded-full" />
              </div>
           </div>
        </div>
      </section>

      {/* SENTENÇA DOS SANTOS (FINAL) */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-10 py-20">
         <Icons.Cross className="w-10 h-10 text-stone-200 dark:text-stone-800 mx-auto" />
         <p className="text-3xl md:text-5xl font-serif italic text-stone-400 dark:text-stone-600 leading-tight">
            "{dailyData?.saint?.quote}"
         </p>
         <div className="space-y-2">
            <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{dailyData?.saint?.name}</h5>
            <p className="text-[10px] font-black uppercase tracking-widest text-gold">{dailyData?.saint?.patronage}</p>
         </div>
      </section>
    </div>
  );
};

export default Dashboard;
