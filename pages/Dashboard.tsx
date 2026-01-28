
import React, { useState, useContext } from 'react';
import { Icons } from '../constants';
import { User } from '../types';
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
import SpiritualDiary from './SpiritualDiary';

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  source: string;
  image: string;
  component: React.ReactNode;
  icon: any;
  color?: string;
}

const Dashboard: React.FC<{ onSearch: (topic: string) => void; user: User | null }> = ({ onSearch, user }) => {
  const { lang } = useContext(LangContext);
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const dailyData = getDailyNativeContent();

  const ROWS = [
    {
      title: "Prática Devocional Diária",
      items: [
        { id: 'liturgy', title: 'Liturgia Diária', subtitle: 'Lecionário Oficial', source: 'Ano B / Ciclo II', image: 'https://images.unsplash.com/photo-1543158021-00212008304f', icon: Icons.History, component: <DailyLiturgy /> },
        { id: 'rosary', title: 'Santo Rosário', subtitle: 'Mistérios Meditados', source: 'Piedade Popular', image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1', icon: Icons.Star, component: <Rosary /> },
        { id: 'lectio', title: 'Lectio Divina', subtitle: 'Mergulho na Palavra', source: 'Verbum Domini', image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65', icon: Icons.Audio, component: <LectioDivina onNavigateDashboard={() => setActiveFeature(null)} /> },
        { id: 'missal', title: 'Missal Romano', subtitle: '3ª Edição Típica', source: 'Culto Divino', image: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b', icon: Icons.Cross, component: <Missal /> },
      ]
    },
    {
      title: "Caminho de Conversão",
      items: [
        { id: 'diary', title: 'Diário Espiritual', subtitle: 'Registro Memorial', source: 'Vida Interior', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a', icon: Icons.Feather, component: <SpiritualDiary /> },
        { id: 'viacrucis', title: 'Via Crucis', subtitle: 'Paixão do Senhor', source: 'Tradição Apostólica', image: 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3', icon: Icons.Cross, component: <ViaCrucis /> },
        { id: 'poenitentia', title: 'Confissão', subtitle: 'Exame de Consciência', source: 'Moral S. Afonso', image: 'https://images.unsplash.com/photo-1515606378517-3451a42adc42', icon: Icons.Search, component: <Poenitentia /> },
        { id: 'quiz', title: 'Certamen Sacrum', subtitle: 'Desafio Teológico', source: 'Academy IA', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765', icon: Icons.Layout, component: <Certamen /> },
      ]
    },
    {
      title: "Estudo e Doutrina",
      items: [
        { id: 'bible', title: 'Escrituras', subtitle: 'Scriptura Sacra', source: 'Cânon de Trento', image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df', icon: Icons.Book, component: <Bible /> },
        { id: 'catechism', title: 'Catecismo', subtitle: 'Codex Fidei (CIC)', source: 'Editio Typica', image: 'https://images.unsplash.com/photo-1541339907198-e08759df9a73', icon: Icons.Pin, component: <Catechism onDeepDive={onSearch} /> },
        { id: 'aquinas', title: 'Suma Teológica', subtitle: 'Doutor Angélico', source: 'Opera Omnia', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a', icon: Icons.Feather, component: <AquinasOpera /> },
        { id: 'dogmas', title: 'Dogmas e Verdades', subtitle: 'Depositum Fidei', source: 'Denzinger (DH)', image: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d', icon: Icons.Star, component: <Dogmas /> },
      ]
    },
    {
      title: "Tesouros da Tradição",
      items: [
        { id: 'magisterium', title: 'Magistério', subtitle: 'Documentos Papais', source: 'Santa Sé', image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149', icon: Icons.Globe, component: <Magisterium /> },
        { id: 'prayers', title: 'Orações Clássicas', subtitle: 'Thesaurus Precum', source: 'Enchiridion', image: 'https://images.unsplash.com/photo-1520694478166-dafeb4d0b9de', icon: Icons.Heart, component: <Prayers /> },
        { id: 'litanies', title: 'Ladainhas', subtitle: 'Súplicas Rítmicas', source: 'Litanarium', image: 'https://images.unsplash.com/photo-1563242636-6e465a39626e', icon: Icons.History, component: <Litanies /> },
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
           <div className="flex items-center gap-3">
             <span className="bg-gold text-stone-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Verbum Diei</span>
             <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Fonte: Ano B / 2024</span>
           </div>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-left">
                    <p className="text-[7px] font-black uppercase tracking-[0.3em] text-gold/80 mb-1">{item.subtitle}</p>
                    <h3 className="text-lg md:text-xl font-serif font-bold text-white leading-tight">{item.title}</h3>
                    <p className="text-[6px] font-black uppercase text-white/30 tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Fonte: {item.source}</p>
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
                    <div className="flex flex-col">
                      <h2 className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-gold leading-none">{activeFeature.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">{activeFeature.subtitle}</span>
                        <div className="w-1 h-1 rounded-full bg-stone-200" />
                        <span className="text-[8px] font-black uppercase text-sacred tracking-widest">Fonte: {activeFeature.source}</span>
                      </div>
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
