
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Icons, Logo } from '../constants';
import { getDailyBundle, DEFAULT_BUNDLE } from '../services/gemini';
import { AppRoute, User } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-stone-200 dark:bg-stone-800 rounded-3xl ${className}`} />
);

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t } = useContext(LangContext);
  
  const [bundleData, setBundleData] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem(`cathedra_daily_${lang}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.isoDate === today) return parsed;
    }
    return { ...DEFAULT_BUNDLE, isPlaceholder: true, isoDate: today };
  });

  const [isLoading, setIsLoading] = useState(bundleData.isPlaceholder);

  useEffect(() => {
    const fetchBundle = async () => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const bundle = await getDailyBundle(lang);
        if (bundle?.gospel?.reference) {
          const newData = { ...bundle, isPlaceholder: false, isoDate: today };
          setBundleData(newData);
          localStorage.setItem(`cathedra_daily_${lang}`, JSON.stringify(newData));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBundle();
  }, [lang]);

  const { gospel, saint } = bundleData;

  const Portals = [
    { 
      id: 'bible', 
      title: 'Scriptura', 
      subtitle: 'Sagradas Escrituras', 
      route: AppRoute.BIBLE, 
      img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800',
      icon: Icons.Book
    },
    { 
      id: 'catechism', 
      title: 'Doctrina', 
      subtitle: 'Catecismo da Igreja', 
      route: AppRoute.CATECHISM, 
      img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800',
      icon: Icons.Cross
    },
    { 
      id: 'saints', 
      title: 'Sanctorum', 
      subtitle: 'Vidas dos Santos', 
      route: AppRoute.SAINTS, 
      img: 'https://images.unsplash.com/photo-1594905103927-de6aacc5c9d8?q=80&w=800',
      icon: Icons.Users
    },
    { 
      id: 'study', 
      title: 'Disputatio', 
      subtitle: 'Estudo com Inteligência', 
      route: AppRoute.STUDY_MODE, 
      img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800',
      icon: Icons.Feather
    },
    { 
      id: 'magisterium', 
      title: 'Magisterium', 
      subtitle: 'Ensino da Igreja', 
      route: AppRoute.MAGISTERIUM, 
      img: 'https://images.unsplash.com/photo-1519810755548-39cd217da494?q=80&w=800',
      icon: Icons.Globe
    },
    { 
      id: 'lectio', 
      title: 'Lectio', 
      subtitle: 'Oração Esculpida', 
      route: AppRoute.LECTIO_DIVINA, 
      img: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800',
      icon: Icons.History
    }
  ];

  return (
    <div className="space-y-12 md:space-y-16 pb-32 page-enter">
      {/* FEATURED HERO (ESTILO NETFLIX) */}
      <section className="relative h-[450px] md:h-[600px] w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-3xl group cursor-pointer" onClick={() => onNavigate(AppRoute.LECTIO_DIVINA)}>
        <div className="absolute inset-0 z-0">
           <SacredImage 
            src={saint?.image || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1200"} 
            alt="Destaque do Dia" 
            className="w-full h-full scale-105 group-hover:scale-100 transition-transform duration-[10s] ease-out"
            priority={true}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-20 space-y-4 md:space-y-6 max-w-4xl">
           <div className="flex items-center gap-3 animate-in slide-in-from-left duration-700">
              <span className="px-4 py-1.5 bg-gold text-stone-900 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                Destaque de Hoje
              </span>
              <span className="text-white/60 text-xs font-serif italic">
                {gospel?.calendar?.dayName || 'Sincronizando...'}
              </span>
           </div>
           
           <h2 className="text-4xl md:text-8xl font-serif font-bold text-white leading-none tracking-tighter animate-in slide-in-from-left duration-1000">
             {saint?.name || 'Maternidade Divina'}
           </h2>
           
           <p className="text-lg md:text-2xl text-white/70 font-serif italic leading-relaxed line-clamp-2 md:line-clamp-3 animate-in slide-in-from-left duration-[1.2s]">
             {saint?.biography || 'Um convite ao silêncio e à contemplação da Verdade que liberta.'}
           </p>

           <div className="flex gap-4 pt-6 animate-in slide-in-from-bottom-8 duration-[1.5s]">
              <button 
                onClick={(e) => { e.stopPropagation(); onNavigate(AppRoute.LECTIO_DIVINA); }}
                className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center gap-3 hover:bg-gold transition-colors active:scale-95"
              >
                <Icons.History className="w-4 h-4" /> Começar Agora
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onNavigate(AppRoute.SAINTS); }}
                className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95"
              >
                <Icons.Search className="w-4 h-4" /> Ver Detalhes
              </button>
           </div>
        </div>
      </section>

      {/* PORTALS GRID (ESTILO SELEÇÃO DE PERFIL/CATEGORIA) */}
      <section className="space-y-8">
        <header className="flex items-center justify-between px-4">
           <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Portais de Conhecimento</h3>
           <div className="h-px flex-1 mx-8 bg-stone-100 dark:bg-stone-800" />
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 px-4">
           {Portals.map((portal, idx) => (
             <button 
              key={portal.id}
              onClick={() => onNavigate(portal.route)}
              className="group relative aspect-[3/4] md:aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-gold/20"
             >
                <div className="absolute inset-0 z-0">
                   <SacredImage src={portal.img} alt={portal.title} className="w-full h-full group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                </div>
                
                <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end items-center text-center space-y-2">
                   <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white group-hover:bg-gold group-hover:text-stone-900 transition-all mb-2">
                      <portal.icon className="w-5 h-5 md:w-6 md:h-6" />
                   </div>
                   <h4 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">{portal.title}</h4>
                   <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-gold transition-colors">{portal.subtitle}</p>
                </div>

                <div className="absolute inset-0 border-4 border-transparent group-hover:border-gold/50 rounded-[2rem] md:rounded-[3rem] transition-all" />
             </button>
           ))}
        </div>
      </section>

      {/* LOWER SECTION: INSIGHTS & QUOTES */}
      <section className="grid md:grid-cols-2 gap-8 px-4">
          {!isLoading && bundleData.insight && (
            <div className="p-10 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-lg flex flex-col gap-4 group">
               <span className="text-[10px] font-black uppercase tracking-widest text-gold">Lumen Diei</span>
               <p className="text-xl md:text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">
                 "{bundleData.insight}"
               </p>
            </div>
          )}
          
          {!isLoading && bundleData.quote?.quote && (
            <div className="p-10 bg-[#1a1a1a] rounded-[3rem] shadow-2xl flex flex-col justify-center items-center text-center space-y-6">
               <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gold/50">Sententia Sanctorum</span>
               <p className="text-xl md:text-3xl font-serif italic text-white leading-tight">
                 "{bundleData.quote.quote}"
               </p>
               <cite className="block text-sm font-serif font-bold text-gold not-italic">— {bundleData.quote.author}</cite>
            </div>
          )}
      </section>
    </div>
  );
};

export default Dashboard;
