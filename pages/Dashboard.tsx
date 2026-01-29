
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Icons } from '../constants';
import { User, AppRoute } from '../types';
import { LangContext } from '../App';
import { fetchLatestPapalAudience } from '../services/gemini';
import Progress from '../components/Progress';

// Modais / Páginas
import DailyLiturgy from './DailyLiturgy';
import Rosary from './Rosary';
import Missal from './Missal';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; user: User | null, onNavigate: (r: AppRoute) => void }> = ({ onSearch, user, onNavigate }) => {
  const { lang } = useContext(LangContext);
  const [activeFeature, setActiveFeature] = useState<any>(null);
  const [papalAudience, setPapalAudience] = useState<any>(null);
  const [loadingPapal, setLoadingPapal] = useState(false);

  useEffect(() => {
    const loadPapal = async () => {
      setLoadingPapal(true);
      try {
        const data = await fetchLatestPapalAudience(lang);
        setPapalAudience(data);
      } catch (e) {
        console.error("Falha ao carregar audiência papal");
      } finally {
        setLoadingPapal(false);
      }
    };
    loadPapal();
  }, [lang]);

  const userProgress = useMemo(() => user?.progress || {
    xp: 0,
    level: 1,
    streak: 0,
    totalMinutesRead: 0
  }, [user]);

  const QUICK_ACTIONS = [
    { id: 'liturgy', title: 'Liturgia', subtitle: 'Hodie', icon: Icons.History, component: <DailyLiturgy /> },
    { id: 'rosary', title: 'Rosário', subtitle: 'Oratio', icon: Icons.Star, component: <Rosary /> },
    { id: 'mass', title: 'Missal', subtitle: 'Cultus', icon: Icons.Cross, component: <Missal /> },
    { id: 'ia', title: 'Investigação', subtitle: 'Symphonia', icon: Icons.Search, action: () => onNavigate(AppRoute.STUDY_MODE) },
  ];

  return (
    <div className="space-y-12 pb-48 animate-in fade-in duration-700">
      
      {/* 1. SEÇÃO INSTITUCIONAL & STATUS */}
      <section className="grid lg:grid-cols-12 gap-8 px-2 md:px-0">
        <div className="lg:col-span-8 bg-stone-900 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden border border-white/5 shadow-2xl group">
           <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                 <span className="bg-gold text-stone-900 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Propósito Cathedra</span>
                 <div className="h-px w-12 bg-white/20" />
                 <span className="text-white/40 text-[8px] font-black uppercase tracking-widest">Inteligência Teológica Nativa</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight tracking-tight">
                Formar a mente, <br />
                <span className="italic text-gold">ordenar a vida.</span>
              </h1>
              <p className="text-white/60 font-serif italic text-xl max-w-2xl leading-relaxed">
                "A fé não é apenas um conjunto de ideias, mas uma luz que ordena toda a existência." No Cathedra, sistematizamos o acesso ao depósito da fé.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                 <button onClick={() => onNavigate(AppRoute.ABOUT)} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gold hover:text-stone-900 hover:border-gold transition-all shadow-xl flex items-center gap-3">
                   <Icons.Globe className="w-4 h-4" /> Manifesto
                 </button>
              </div>
           </div>
           <Icons.Cross className="absolute bottom-[-15%] right-[-10%] w-72 h-72 text-gold/5 pointer-events-none group-hover:rotate-12 transition-transform duration-[15s]" />
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-[3rem] p-10 border border-stone-100 dark:border-white/5 shadow-xl flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold dark:text-stone-100">Seu Progresso</h3>
                <div className="px-3 py-1 bg-sacred text-white rounded-full text-[8px] font-black uppercase">Nível {userProgress.level}</div>
              </div>
              
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <span>{userProgress.xp} XP</span>
                    <span>{userProgress.level * 1000} XP</span>
                 </div>
                 <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gold shadow-[0_0_10px_#d4af37]" style={{ width: `${(userProgress.xp % 1000) / 10}%` }} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                 <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700 text-center">
                    <p className="text-[18px] font-serif font-bold text-stone-900 dark:text-gold">{userProgress.streak} Dias</p>
                    <p className="text-[8px] font-black uppercase text-stone-400">Fidelidade</p>
                 </div>
                 <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700 text-center">
                    <p className="text-[18px] font-serif font-bold text-stone-900 dark:text-gold">{userProgress.totalMinutesRead}m</p>
                    <p className="text-[8px] font-black uppercase text-stone-400">Meditação</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 2. CÁTEDRA DE PEDRO - BANNER AUDIÊNCIA PAPAL */}
      <section className="px-2 md:px-0">
        <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[3.5rem] border border-stone-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Icons.Globe className="w-48 h-48" /></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-stone-900 dark:bg-gold rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sacred">
               <Icons.History className="w-10 h-10 text-gold dark:text-stone-900" />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <span className="text-[9px] font-black uppercase text-sacred tracking-widest">Cátedra de Pedro</span>
                 <span className="text-stone-300 dark:text-stone-700">•</span>
                 <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{papalAudience?.date || "Consultando Vaticano..."}</span>
              </div>
              {loadingPapal ? (
                <div className="h-8 w-64 bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse" />
              ) : (
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {papalAudience?.topic || "Audiência Geral de Quarta-feira"}
                </h3>
              )}
              <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg leading-relaxed line-clamp-2">
                {papalAudience?.summary || "Conectando ao site da Santa Sé para as últimas exortações do Santo Padre..."}
              </p>
            </div>
            {papalAudience?.vaticanUrl && (
              <a 
                href={papalAudience.vaticanUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-500 dark:text-gold rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-sacred hover:text-white transition-all shadow-sm"
              >
                Ler no Vaticano
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 3. GRANDES JORNADAS */}
      <section className="space-y-8">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400 text-center flex items-center justify-center gap-6">
           <div className="h-px w-20 bg-gold/20" /> Caminhos de Santidade <div className="h-px w-20 bg-gold/20" />
        </h2>
        <div className="grid md:grid-cols-2 gap-8 px-2">
           <button 
             onClick={() => onNavigate(AppRoute.BIBLE)}
             className="group bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] text-left border border-stone-100 dark:border-white/5 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02]"
           >
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-[10s]"><Icons.Book className="w-48 h-48" /></div>
              <div className="relative z-10 space-y-4">
                 <span className="text-[9px] font-black uppercase text-sacred tracking-widest bg-sacred/5 px-3 py-1 rounded-full">Estrada de Emaús</span>
                 <h3 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">Jornada da Bíblia</h3>
                 <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg leading-relaxed">Estudo integral do Cânon Sagrado.</p>
                 <div className="pt-6">
                    <Progress percent={12} label="Progresso no Cânon" />
                 </div>
              </div>
           </button>

           <button 
             onClick={() => onNavigate(AppRoute.CATECHISM)}
             className="group bg-stone-900 dark:bg-[#151310] p-10 rounded-[3.5rem] text-left border border-white/5 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02]"
           >
              <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:scale-125 transition-transform duration-[10s] text-gold"><Icons.Pin className="w-48 h-48" /></div>
              <div className="relative z-10 space-y-4">
                 <span className="text-[9px] font-black uppercase text-gold tracking-widest bg-gold/10 px-3 py-1 rounded-full">Coluna da Verdade</span>
                 <h3 className="text-3xl md:text-4xl font-serif font-bold text-white">Jornada do Catecismo</h3>
                 <p className="text-white/60 font-serif italic text-lg leading-relaxed">O depósito da fé sistematizado.</p>
                 <div className="pt-6">
                    <Progress percent={5} label="Progresso Doutrinário" />
                 </div>
              </div>
           </button>
        </div>
      </section>

      {/* 4. AÇÕES RÁPIDAS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
        {QUICK_ACTIONS.map(action => (
          <button 
            key={action.id}
            onClick={() => action.action ? action.action() : setActiveFeature(action)}
            className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-50 dark:border-white/5 shadow-xl transition-all hover:scale-105 group"
          >
             <div className="w-14 h-14 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold transition-all duration-500 shadow-inner">
                <action.icon className="w-6 h-6 text-gold group-hover:text-stone-900 transition-colors" />
             </div>
             <p className="text-[7px] font-black uppercase text-stone-400 tracking-widest text-center">{action.subtitle}</p>
             <h4 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 text-center">{action.title}</h4>
          </button>
        ))}
      </section>

      {/* MODAL IMERSIVO */}
      {activeFeature && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl" onClick={() => setActiveFeature(null)} />
           <div className="relative w-full max-w-7xl h-[95dvh] md:h-[90vh] bg-[#fdfcf8] dark:bg-[#0c0a09] md:rounded-[4rem] shadow-4xl border-t border-white/10 overflow-hidden flex flex-col animate-modal-zoom">
              <header className="p-4 md:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between sticky top-0 bg-inherit z-50">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-stone-900 rounded-xl shadow-xl">
                       <activeFeature.icon className="w-5 h-5 text-gold" />
                    </div>
                    <h2 className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-gold">{activeFeature.title}</h2>
                 </div>
                 <button onClick={() => setActiveFeature(null)} className="p-3 bg-stone-100 dark:bg-stone-800 hover:bg-sacred hover:text-white rounded-full transition-all">
                    <Icons.Cross className="w-5 h-5 rotate-45" />
                 </button>
              </header>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 <div className="max-w-6xl mx-auto">{activeFeature.component}</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
