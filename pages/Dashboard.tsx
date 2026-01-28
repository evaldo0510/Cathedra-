
import React, { useState, useContext } from 'react';
import { Icons } from '../constants';
import { User } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';
import { getDailyNativeContent } from '../services/nativeData';

// Modais
import Bible from './Bible';
import Catechism from './Catechism';
import DailyLiturgy from './DailyLiturgy';
import Rosary from './Rosary';
import Missal from './Missal';
import Magisterium from './Magisterium';
import AquinasOpera from './AquinasOpera';
import ViaCrucis from './ViaCrucis';
import Certamen from './Certamen';

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  component: React.ReactNode;
  icon: any;
}

const Dashboard: React.FC<{ onSearch: (topic: string) => void; user: User | null }> = ({ onSearch, user }) => {
  const { lang } = useContext(LangContext);
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const dailyData = getDailyNativeContent();

  const ROWS = [
    {
      title: "Prática Devocional",
      items: [
        { id: 'liturgy', title: 'Liturgia Diária', subtitle: 'Pão da Vida 2025', image: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800', icon: Icons.History, component: <DailyLiturgy /> },
        { id: 'rosary', title: 'Santo Rosário', subtitle: 'Mistérios Meditados', image: 'https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=800', icon: Icons.Star, component: <Rosary /> },
        { id: 'missal', title: 'Missal Romano', subtitle: '3ª Edição Típica', image: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800', icon: Icons.Cross, component: <Missal /> },
      ]
    },
    {
      title: "Estudo e Doutrina",
      items: [
        { id: 'bible', title: 'Escrituras', subtitle: 'Verbum Dei', image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800', icon: Icons.Book, component: <Bible /> },
        { id: 'catechism', title: 'Catecismo', subtitle: 'Compêndio da Fé', image: 'https://images.unsplash.com/photo-1593526612308-d46fd73f2edb?q=80&w=800', icon: Icons.Pin, component: <Catechism onDeepDive={onSearch} /> },
        { id: 'aquinas', title: 'Suma Teológica', subtitle: 'Doutor Angélico', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800', icon: Icons.Feather, component: <AquinasOpera /> },
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-48 animate-in fade-in duration-700 px-2 md:px-0">
      {/* DESTAQUE PRINCIPAL */}
      <section className="relative h-[45vh] md:h-[55vh] rounded-[3.5rem] overflow-hidden shadow-4xl group">
        <SacredImage src={dailyData.verse.imageUrl} alt="Hero" className="w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-110" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-16 space-y-4 max-w-4xl">
           <span className="bg-gold text-stone-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Verbum Diei</span>
           <h1 className="text-2xl md:text-5xl font-serif font-bold text-white leading-tight italic">"{dailyData.verse.verse}"</h1>
           <p className="text-gold font-serif text-xl">{dailyData.verse.reference}</p>
        </div>
      </section>

      {/* TRILHOS NETFLIX */}
      <div className="space-y-12">
        {ROWS.map((row, rIdx) => (
          <section key={rIdx} className="space-y-6">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 px-2">{row.title}</h2>
            <div className="flex overflow-x-auto gap-5 no-scrollbar pb-6 px-2 scroll-smooth">
              {row.items.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveFeature(item as Feature)}
                  className="flex-shrink-0 w-64 md:w-80 group relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.05] hover:z-10"
                >
                  <SacredImage src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 text-left">
                    <p className="text-[7px] font-black uppercase tracking-[0.3em] text-gold/80 mb-1">{item.subtitle}</p>
                    <h3 className="text-lg md:text-xl font-serif font-bold text-white">{item.title}</h3>
                  </div>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold/30 rounded-[2.5rem] transition-all pointer-events-none" />
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
