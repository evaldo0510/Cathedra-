
import React from 'react';
import { Icons } from '../constants';
import { AppRoute } from '../types';

interface SidebarProps {
  currentPath: AppRoute;
  onNavigate: (p: AppRoute) => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onClose }) => {
  const items = [
    { r: AppRoute.DASHBOARD, l: 'Início', i: Icons.Home },
    { r: AppRoute.LITURGICAL_CALENDAR, l: 'Calendário Litúrgico', i: Icons.History },
    { r: AppRoute.STUDY_MODE, l: 'Estudo Relacional', i: Icons.Layout },
    { r: AppRoute.COLLOQUIUM, l: 'Colloquium', i: Icons.Feather },
    { r: AppRoute.AQUINAS, l: 'Biblioteca do Aquinate', i: Icons.Feather },
    { r: AppRoute.BIBLE, l: 'Bíblia Sagrada', i: Icons.Book },
    { r: AppRoute.CATECHISM, l: 'Catecismo', i: Icons.Cross },
    { r: AppRoute.DOGMAS, l: 'Dogmas e Verdades', i: Icons.Feather },
    { r: AppRoute.SAINTS, l: 'Nuvem de Testemunhas', i: Icons.Users },
    { r: AppRoute.SOCIAL_DOCTRINE, l: 'Compêndio Social', i: Icons.Globe },
  ];

  return (
    <aside className="h-full sacred-gradient text-white flex flex-col p-8 md:p-10 shadow-2xl border-r border-[#d4af37]/20 z-50 overflow-y-auto custom-scrollbar">
      <button 
        onClick={onClose}
        className="lg:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"
        aria-label="Fechar Menu"
      >
        <Icons.Cross className="w-6 h-6 rotate-45 text-[#d4af37]" />
      </button>

      <div className="mb-12 md:mb-16 flex flex-col items-center">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-[#d4af37] rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <Icons.Cross className="w-8 h-8 md:w-10 md:h-10 text-stone-900" />
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#d4af37] tracking-[0.1em] text-center">CATHEDRA</h1>
        <div className="h-px w-8 bg-white/20 my-2" />
        <p className="text-[8px] md:text-[9px] uppercase tracking-[0.5em] text-white/40 font-bold">Digital Sanctuarium</p>
      </div>
      
      <nav className="flex-1 space-y-1 md:space-y-2">
        {items.map(item => (
          <button 
            key={item.l}
            onClick={() => {
              onNavigate(item.r);
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-4 md:gap-5 px-5 md:px-7 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] transition-all duration-300 group relative ${currentPath === item.r ? 'bg-[#d4af37] text-stone-900 shadow-xl scale-[1.02]' : 'hover:bg-white/5 text-white/60'}`}
          >
            {currentPath === item.r && (
              <div className="absolute left-0 w-1.5 h-6 md:h-8 bg-[#8b0000] rounded-r-full" />
            )}
            <item.i className={`w-5 h-5 transition-colors duration-300 ${currentPath === item.r ? 'text-stone-900' : 'text-[#d4af37] group-hover:text-white'}`} />
            <span className={`font-semibold tracking-wide text-sm md:text-base ${currentPath === item.r ? 'font-bold' : ''}`}>{item.l}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
        <button 
          onClick={() => { onNavigate(AppRoute.ABOUT); if(onClose) onClose(); }}
          className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all ${currentPath === AppRoute.ABOUT ? 'text-[#d4af37] bg-white/5' : 'text-white/30 hover:text-white/60'}`}
        >
          <Icons.Feather className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Sobre o Projeto</span>
        </button>
        <p className="text-[10px] italic text-white/20 uppercase tracking-[0.3em] text-center font-serif">
          Ad Maiorem Dei Gloriam
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
