
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { universalSearch, fetchDailyVerse, getDailyBundle } from '../services/gemini';
import { AppRoute, User, UniversalSearchResult, StudyResult } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t } = useContext(LangContext);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [dailyBundle, setDailyBundle] = useState<any>(null);
  const [recentStudies, setRecentStudies] = useState<StudyResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [verse, bundle] = await Promise.all([
          fetchDailyVerse(lang),
          getDailyBundle(lang)
        ]);
        setDailyVerse(verse);
        setDailyBundle(bundle);
        
        const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
        setRecentStudies(history.slice(0, 3));
      } catch (e) { console.warn(e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [lang]);

  if (loading && !dailyVerse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-pulse space-y-8">
        <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-2xl font-serif italic text-stone-400">Cruzando o Nártex...</p>
      </div>
    );
  }

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
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-24 space-y-12 max-w-7xl">
          <div className="space-y-6 animate-in slide-in-from-left-12 duration-1000">
            <div className="flex items-center gap-4">
              <span className="px-6 py-2 bg-sacred text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl border border-white/10 backdrop-blur-md">
                Luz do Dia (Lumen Diei)
              </span>
              <span className="text-white/70 text-xl font-serif italic border-l border-white/20 pl-4">{dailyVerse?.reference}</span>
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-white tracking-tighter leading-[0.85] drop-shadow-4xl max-w-5xl">
               {dailyVerse?.verse || "A Verdade vos libertará."}
            </h1>
          </div>

          <div className="flex flex-wrap gap-5 animate-in slide-in-from-bottom-12 duration-1000 delay-300">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-14 py-6 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-white transition-all active:scale-95 flex items-center gap-4 group">
              <Icons.Book className="w-6 h-6 group-hover:rotate-6 transition-transform" /> Abrir Bíblia
            </button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="px-14 py-6 bg-white/10 backdrop-blur-3xl text-white border border-white/20 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/20 transition-all flex items-center gap-4 group">
              <Icons.History className="w-6 h-6 text-gold group-hover:rotate-[-10deg] transition-transform" /> Ver Liturgia
            </button>
          </div>
        </div>
      </section>

      {/* EXPLORADOR DO DEPÓSITO */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { label: 'Bíblia', sub: 'O Verbo de Deus', route: AppRoute.BIBLE, icon: Icons.Book, img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800' },
            { label: 'Catecismo', sub: 'A Fé em Definições', route: AppRoute.CATECHISM, icon: Icons.Cross, img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800' },
            { label: 'Obras de S. Tomás', sub: 'Sabedoria Profunda', route: AppRoute.AQUINAS_OPERA, icon: Icons.Feather, img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800' }
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
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Depósito da Fé</span>
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

      {/* SENTENÇA DOS SANTOS */}
      {dailyBundle?.saint?.quote && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white dark:bg-stone-900 p-20 md:p-32 rounded-[6rem] shadow-4xl border border-stone-100 dark:border-white/5 relative overflow-hidden group">
            <div className="relative z-10 text-center space-y-16">
               <div className="flex flex-col items-center gap-6">
                  <div className="h-px w-32 bg-gold/30" />
                  <span className="text-[14px] font-black uppercase tracking-[1.2em] text-gold">Sentença dos Santos (Sententia)</span>
                  <div className="h-px w-32 bg-gold/30" />
               </div>
               <p className="text-4xl md:text-7xl lg:text-8xl font-serif italic text-stone-800 dark:text-stone-100 leading-[1.05] tracking-tight max-w-6xl mx-auto">
                 "{dailyBundle.saint.quote}"
               </p>
               <div className="space-y-2">
                 <h5 className="text-3xl font-serif font-bold text-stone-900 dark:text-gold uppercase tracking-widest">{dailyBundle.saint.name}</h5>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Rogai por nós</p>
               </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
