
import React, { useState, useContext } from 'react';
import { Icons } from '../constants';
import { User, AppRoute } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';
import { getDailyNativeContent } from '../services/nativeData';

// Modais / Páginas
import Bible from './Bible';
import Catechism from './Catechism';
import DailyLiturgy from './DailyLiturgy';
import Rosary from './Rosary';
import Missal from './Missal';
import Magisterium from './Magisterium';
import AquinasOpera from './AquinasOpera';
import ViaCrucis from './ViaCrucis';
import Certamen from './Certamen';
import LectioDivina from './LectioDivina';
import Poenitentia from './Poenitentia';
import Dogmas from './Dogmas';
import Prayers from './Prayers';
import Litanies from './Litanies';

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  source: string;
  component: React.ReactNode;
  icon: any;
}

const Dashboard: React.FC<{ onSearch: (topic: string) => void; user: User | null }> = ({ onSearch, user }) => {
  const { lang } = useContext(LangContext);
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const dailyData = getDailyNativeContent();

  const ROWS = [
    {
      title: "Prática Devocional Diária",
      items: [
        { id: 'liturgy', title: 'Liturgia', subtitle: 'Lecionário', source: 'Ano B / 2024', icon: Icons.History, component: <DailyLiturgy /> },
        { id: 'rosary', title: 'Rosário', subtitle: 'Piedade', source: 'Tradição', icon: Icons.Star, component: <Rosary /> },
        { id: 'lectio', title: 'Lectio Divina', subtitle: 'Palavra', source: 'Orante', icon: Icons.Audio, component: <LectioDivina onNavigateDashboard={() => setActiveFeature(null)} /> },
        { id: 'missal', title: 'Missal', subtitle: 'Culto', source: '3ª Edição', icon: Icons.Cross, component: <Missal /> },
      ]
    },
    {
      title: "Estudo e Doutrina",
      items: [
        { id: 'bible', title: 'Bíblia', subtitle: 'Escrituras', source: 'Nova Vulgata', icon: Icons.Book, component: <Bible /> },
        { id: 'catechism', title: 'Catecismo', subtitle: 'Doutrina', source: 'CIC', icon: Icons.Pin, component: <Catechism onDeepDive={onSearch} /> },
        { id: 'aquinas', title: 'Suma Teológica', subtitle: 'Escolástica', source: 'S. Tomás', icon: Icons.Feather, component: <AquinasOpera /> },
        { id: 'dogmas', title: 'Dogmas', subtitle: 'Verdades', source: 'Denzinger', icon: Icons.Star, component: <Dogmas /> },
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-48 animate-in fade-in duration-700 px-2 md:px-0">
      {/* BANNER DE IMPACTO - SEM IMAGEM, SÓ TEXTO SACRO */}
      <section className="relative h-[40vh] md:h-[45vh] rounded-[3rem] overflow-hidden shadow-4xl bg-stone-950 flex flex-col justify-center p-8 md:p-16 border border-white/5">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <div className="relative z-10 space-y-6 max-w-4xl">
           <div className="flex items-center gap-3">
             <span className="bg-gold text-stone-900 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Verbum Diei</span>
             <span className="text-white/40 text-[8px] font-black uppercase tracking-widest">Ano B • Ciclo II</span>
           </div>
           <h1 className="text-3xl md:text-6xl font-serif font-bold text-white leading-tight italic">"{dailyData.verse.verse}"</h1>
           <p className="text-gold font-serif text-xl md:text-2xl">{dailyData.verse.reference}</p>
        </div>
        <div className="absolute bottom-0 right-0 p-10 opacity-10">
           <Icons.Cross className="w-48 h-48 text-gold" />
        </div>
      </section>

      {/* CARDS TEXT-ONLY */}
      <div className="space-y-16">
        {ROWS.map((row, rIdx) => (
          <section key={rIdx} className="space-y-8">
            <h2 className="text-lg font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 px-2 flex items-center gap-4">
              <div className="h-px w-8 bg-gold/30" />
              {row.title}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
              {row.items.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveFeature(item as any)}
                  className="group relative aspect-square rounded-[3rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.03] bg-white dark:bg-[#151310] border border-stone-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-5 bg-stone-50 dark:bg-stone-900 rounded-3xl mb-4 group-hover:bg-gold transition-all duration-500 shadow-inner">
                    <item.icon className="w-8 h-8 text-gold group-hover:text-stone-950 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[7px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 group-hover:text-gold/60">{item.subtitle}</p>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-gold transition-colors">{item.title}</h3>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

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
                    <div className="flex flex-col">
                      <h2 className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-gold leading-none">{activeFeature.title}</h2>
                      <span className="text-[8px] font-black uppercase text-sacred tracking-widest mt-1">Fonte: {activeFeature.source}</span>
                    </div>
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
