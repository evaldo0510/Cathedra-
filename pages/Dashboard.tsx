
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { universalSearch, fetchDailyVerse, getDailyBundle } from '../services/gemini';
import { AppRoute, User, UniversalSearchResult, StudyResult } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang } = useContext(LangContext);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [dailyBundle, setDailyBundle] = useState<any>(null);
  const [recentStudies, setRecentStudies] = useState<StudyResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [verse, bundle] = await Promise.all([
          fetchDailyVerse(lang),
          getDailyBundle(lang)
        ]);
        setDailyVerse(verse);
        setDailyBundle(bundle);
        
        const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
        setRecentStudies(history.slice(0, 3));
      } catch (e) {
        console.error("Erro ao carregar dados do nártex:", e);
      }
    };
    fetchData();
  }, [lang]);

  return (
    <div className="space-y-24 pb-32 animate-in fade-in duration-1000 -mt-10">
      {/* SEÇÃO HERO: O VERBO HOJE */}
      <section className="relative h-[80vh] md:h-[90vh] mx-[-1rem] md:mx-[-4rem] lg:mx-[-6rem] overflow-hidden group shadow-4xl border-b border-gold/20">
        <div className="absolute inset-0 z-0">
          <SacredImage 
            src={dailyVerse?.imageUrl || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600"} 
            alt="Palavra do Dia" 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[30000ms]" 
            priority={true} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/40 to-transparent" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-24 space-y-12 max-w-7xl">
          <div className="space-y-6 animate-in slide-in-from-left-12 duration-1000">
            <div className="flex items-center gap-4">
              <span className="px-6 py-2 bg-sacred text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl border border-white/10 backdrop-blur-md">
                Lumen Diei • Hodie
              </span>
              <span className="text-white/70 text-xl font-serif italic border-l border-white/20 pl-4">{dailyVerse?.reference}</span>
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-white tracking-tighter leading-[0.85] drop-shadow-4xl max-w-5xl">
               {dailyVerse?.verse || "Veritas vos liberabit."}
            </h1>
          </div>

          <div className="flex flex-wrap gap-5 animate-in slide-in-from-bottom-12 duration-1000 delay-300">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-14 py-6 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-[0_20px_50px_rgba(212,175,55,0.4)] hover:bg-white transition-all active:scale-95 flex items-center gap-4 group">
              <Icons.Book className="w-6 h-6 group-hover:rotate-6 transition-transform" /> Abrir Scriptuarium
            </button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="px-14 py-6 bg-white/10 backdrop-blur-3xl text-white border border-white/20 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/20 transition-all flex items-center gap-4 group">
              <Icons.History className="w-6 h-6 text-gold group-hover:rotate-[-10deg] transition-transform" /> Ver Liturgia
            </button>
          </div>
        </div>
      </section>

      {/* EXPLORADOR DO DEPÓSITO - CARDS MAJESTOSOS */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { label: 'Scriptuarium', sub: 'O Verbo Encarnado', route: AppRoute.BIBLE, icon: Icons.Book, img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800' },
            { label: 'Codex Fidei', sub: 'O Mapa da Alma', route: AppRoute.CATECHISM, icon: Icons.Cross, img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800' },
            { label: 'Opera Omnia', sub: 'Sabedoria Angelical', route: AppRoute.AQUINAS_OPERA, icon: Icons.Feather, img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800' }
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => onNavigate(item.route)}
              className="group relative h-[32rem] rounded-[4rem] overflow-hidden shadow-4xl border border-stone-200 dark:border-white/5 bg-stone-900 transition-all hover:-translate-y-4 duration-500"
            >
              <SacredImage src={item.img} alt={item.label} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[8s]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-12 left-12 text-left space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-gold/20 rounded-2xl border border-gold/30 backdrop-blur-md">
                      <item.icon className="w-5 h-5 text-gold" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Depositum Fidei</span>
                 </div>
                 <div>
                    <h3 className="text-4xl font-serif font-bold text-white group-hover:text-gold transition-colors">{item.label}</h3>
                    <p className="text-white/50 text-base font-serif italic mt-1">{item.sub}</p>
                 </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* BUSCA UNIVERSAL ELEVADA - OMNISEARCH TRIGGER */}
      <section className="max-w-6xl mx-auto px-4">
        <div 
          onClick={() => (window as any).dispatchEvent(new CustomEvent('open-omnisearch'))}
          className="relative group cursor-text"
        >
           <div className="flex items-center bg-white dark:bg-[#151310] backdrop-blur-3xl rounded-[4rem] shadow-4xl border border-stone-200 dark:border-white/10 group-hover:border-gold/50 transition-all overflow-hidden p-4">
              <div className="pl-10 text-gold/40 group-hover:text-gold transition-colors group-hover:scale-110 duration-500">
                <Icons.Search className="w-12 h-12" />
              </div>
              <div className="flex-1 px-10 py-10 font-serif text-3xl italic text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-colors">
                O que sua alma busca no santuário?
              </div>
              <div className="hidden md:flex items-center gap-3 px-10 py-8 bg-stone-50 dark:bg-stone-800/80 rounded-[3rem] font-black uppercase tracking-[0.4em] text-[11px] text-stone-400 group-hover:text-gold group-hover:bg-gold/10 transition-all border border-transparent group-hover:border-gold/20">
                Pressione <span className="px-3 py-1.5 bg-black/5 dark:bg-white/10 rounded-xl">CMD + K</span>
              </div>
           </div>
        </div>
      </section>

      {/* SENTENTIA SANCTORUM - CITAÇÃO EM DESTAQUE */}
      {dailyBundle?.saint?.quote && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white dark:bg-stone-900 p-20 md:p-32 rounded-[6rem] shadow-4xl border border-stone-100 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-24 opacity-[0.03] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-[5000ms] pointer-events-none">
              <Icons.Feather className="w-[30rem] h-[30rem] text-gold" />
            </div>
            <div className="relative z-10 text-center space-y-16">
               <div className="flex flex-col items-center gap-6">
                  <div className="h-px w-32 bg-gold/30" />
                  <span className="text-[14px] font-black uppercase tracking-[1.2em] text-gold">Sententia Sanctorum</span>
                  <div className="h-px w-32 bg-gold/30" />
               </div>
               <p className="text-4xl md:text-7xl lg:text-8xl font-serif italic text-stone-800 dark:text-stone-100 leading-[1.05] tracking-tight max-w-6xl mx-auto">
                 "{dailyBundle.saint.quote}"
               </p>
               <div className="flex flex-col items-center gap-8">
                  <div className="w-20 h-20 bg-sacred/10 rounded-full flex items-center justify-center border border-sacred/20 shadow-inner group-hover:scale-110 transition-transform duration-700">
                     <Icons.Cross className="w-8 h-8 text-sacred" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-3xl font-serif font-bold text-stone-900 dark:text-gold uppercase tracking-widest">{dailyBundle.saint.name}</h5>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Ora pro nobis</p>
                  </div>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO DE ESTUDOS RECENTES PARA USUÁRIOS */}
      {user && recentStudies.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 space-y-10">
          <div className="flex items-center justify-between px-6">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Sua Biblioteca</h4>
              <h3 className="text-4xl font-serif font-bold dark:text-white">Investigações Memoradas</h3>
            </div>
            <button onClick={() => onNavigate(AppRoute.STUDY_MODE)} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-colors flex items-center gap-2">
              Ver Histórico Completo <Icons.ArrowDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {recentStudies.map((study, idx) => (
              <button 
                key={idx}
                onClick={() => onSearch(study.topic)}
                className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] border border-stone-100 dark:border-white/5 shadow-2xl text-left hover:border-gold/30 hover:-translate-y-2 transition-all group"
              >
                <span className="text-[9px] font-black uppercase tracking-widest text-gold/60 mb-4 block">Estudo Scholar</span>
                <h4 className="text-2xl font-serif font-bold mb-3 group-hover:text-gold transition-colors">{study.topic}</h4>
                <p className="text-stone-400 font-serif italic text-base line-clamp-2 leading-relaxed">"{study.summary}"</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER DO NÁRTEX */}
      <section className="text-center py-20 border-t border-gold/10 max-w-4xl mx-auto">
         <Icons.Cross className="w-12 h-12 mx-auto mb-8 text-stone-200 dark:text-white/5" />
         <p className="text-stone-400 font-serif italic text-2xl px-8 leading-relaxed">
           "A fé e a razão são como duas asas pelas quais o espírito humano se eleva para a contemplação da verdade."
         </p>
         <cite className="block text-[10px] font-black uppercase tracking-[0.5em] text-gold mt-6">Fides et Ratio • São João Paulo II</cite>
      </section>
    </div>
  );
};

export default Dashboard;
