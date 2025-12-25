
import React from 'react';
import { Icons } from '../constants';
import { AppRoute, User } from '../types';

interface SidebarProps {
  currentPath: AppRoute;
  onNavigate: (p: AppRoute) => void;
  onClose?: () => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onClose, user, onLogout }) => {
  const items = [
    { r: AppRoute.DASHBOARD, l: 'Início', i: Icons.Home, guest: true },
    { r: AppRoute.LITURGICAL_CALENDAR, l: 'Calendário Litúrgico', i: Icons.History, guest: true },
    { r: AppRoute.LECTIO_DIVINA, l: 'Lectio Divina', i: Icons.Cross, guest: true, freeBadge: true },
    { r: AppRoute.COMMUNITY, l: 'Aula Magna', i: Icons.Users, guest: true },
    { r: AppRoute.STUDY_MODE, l: 'Estudo Relacional', i: Icons.Layout, guest: true },
    { r: AppRoute.COLLOQUIUM, l: 'Colloquium', i: Icons.Feather, guest: true },
    { r: AppRoute.AQUINAS, l: 'Biblioteca do Aquinate', i: Icons.Feather, guest: true },
    { r: AppRoute.BIBLE, l: 'Bíblia Sagrada', i: Icons.Book, guest: true },
    { r: AppRoute.CATECHISM, l: 'Catecismo', i: Icons.Cross, guest: true, freeBadge: true },
    { r: AppRoute.MAGISTERIUM, l: 'Magistério', i: Icons.Globe, guest: true, freeBadge: true },
    { r: AppRoute.DOGMAS, l: 'Dogmas e Verdades', i: Icons.Feather, guest: true },
    { r: AppRoute.SAINTS, l: 'Nuvem de Testemunhas', i: Icons.Users, guest: true },
    { r: AppRoute.SOCIAL_DOCTRINE, l: 'Compêndio Social', i: Icons.Globe, guest: true },
    { r: AppRoute.ABOUT, l: 'Sobre o Projeto', i: Icons.History, guest: true },
  ];

  if (user?.role === 'admin') {
    items.push({ r: AppRoute.ADMIN, l: 'Administração', i: Icons.Layout, guest: false });
  }

  const handleNavigation = (route: AppRoute) => {
    onNavigate(route);
    if (onClose) {
      setTimeout(onClose, 100);
    }
  };

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
        <div 
          onClick={() => handleNavigation(AppRoute.DASHBOARD)}
          className="w-14 h-14 md:w-16 md:h-16 bg-[#d4af37] rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 cursor-pointer"
        >
          <Icons.Cross className="w-8 h-8 md:w-10 md:h-10 text-stone-900" />
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#d4af37] tracking-[0.1em] text-center">CATHEDRA</h1>
        <div className="h-px w-8 bg-white/20 my-2" />
        <p className="text-[8px] md:text-[9px] uppercase tracking-[0.5em] text-white/40 font-bold">Digital Sanctuarium</p>
      </div>
      
      <nav className="flex-1 space-y-1 md:space-y-2">
        {items.map(item => {
          const isSelected = currentPath === item.r;
          return (
            <button 
              key={item.l}
              onClick={() => handleNavigation(item.r)}
              className={`w-full flex items-center gap-4 md:gap-5 px-5 md:px-7 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] transition-all duration-300 group relative ${isSelected ? 'bg-[#d4af37] text-stone-900 shadow-xl scale-[1.02]' : 'hover:bg-white/5 text-white/60'}`}
            >
              {isSelected && (
                <div className="absolute left-0 w-1.5 h-6 md:h-8 bg-[#8b0000] rounded-r-full" />
              )}
              <item.i className={`w-5 h-5 transition-colors duration-300 ${isSelected ? 'text-stone-900' : 'text-[#d4af37] group-hover:text-white'}`} />
              <div className="flex-1 text-left">
                <span className={`font-semibold tracking-wide text-sm md:text-base ${isSelected ? 'font-bold' : ''}`}>
                  {item.l}
                </span>
                {item.freeBadge && (
                  <span className="ml-2 text-[7px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">Aberto</span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-10 pt-8 border-t border-white/10 space-y-6">
        <div className="space-y-3">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20 ml-4">Apoio & Comunidade</p>
          <a 
            href="https://instagram.com/seu-perfil" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/5 text-stone-300 hover:text-[#d4af37] hover:bg-white/10 transition-all group"
          >
            <div className="p-2 bg-[#d4af37]/10 rounded-lg group-hover:scale-110 transition-transform">
               <Icons.Globe className="w-4 h-4 text-[#d4af37]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Siga no Instagram</span>
          </a>
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
        {user ? (
          <div className="space-y-4">
             <button 
              onClick={() => handleNavigation(AppRoute.PROFILE)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-stone-900 font-black text-[10px]">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-xs font-bold truncate">{user.name}</p>
                <p className="text-[8px] text-[#d4af37] uppercase tracking-widest">{user.role}</p>
              </div>
            </button>
            <button 
              onClick={onLogout}
              className="w-full py-3 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-[#8b0000] transition-colors"
            >
              Sair do Santuário
            </button>
          </div>
        ) : (
          <button 
            onClick={() => handleNavigation(AppRoute.LOGIN)}
            className="w-full py-5 bg-[#d4af37] text-stone-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95"
          >
            Acesso do Membro
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
