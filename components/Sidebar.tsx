
import React, { useContext } from 'react';
import { Icons, Logo } from '../constants';
import { AppRoute, User } from '../types';
import { LangContext } from '../App';

interface SidebarProps {
  currentPath: AppRoute;
  onNavigate: (p: AppRoute) => void;
  onClose?: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenSearch: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onClose, user, onLogout, onOpenSearch }) => {
  const { t, installPrompt, handleInstall } = useContext(LangContext);

  const menuGroups = [
    {
      title: 'Vida Litúrgica',
      items: [
        { name: 'Painel Principal', icon: Icons.Home, path: AppRoute.DASHBOARD },
        { name: 'Bíblia Sagrada', icon: Icons.Book, path: AppRoute.BIBLE },
        { name: 'Liturgia Diária', icon: Icons.History, path: AppRoute.DAILY_LITURGY },
        { name: 'Missal Romano', icon: Icons.Cross, path: AppRoute.ORDO_MISSAE },
        { name: 'Breviário (Horas)', icon: Icons.Audio, path: AppRoute.BREVIARY },
      ]
    },
    {
      title: 'Depósito da Fé',
      items: [
        { name: 'Catecismo (CIC)', icon: Icons.Pin, path: AppRoute.CATECHISM },
        { name: 'Magistério', icon: Icons.Globe, path: AppRoute.MAGISTERIUM },
        { name: 'Dogmas e Verdades', icon: Icons.Star, path: AppRoute.DOGMAS },
        { name: 'Suma Teológica', icon: Icons.Feather, path: AppRoute.AQUINAS_OPERA },
      ]
    },
    {
      title: 'Caminho Espiritual',
      items: [
        { name: 'Santo Rosário', icon: Icons.Star, path: AppRoute.ROSARY },
        { name: 'Via Crucis', icon: Icons.Cross, path: AppRoute.VIA_CRUCIS },
        { name: 'Lectio Divina', icon: Icons.Audio, path: AppRoute.LECTIO_DIVINA },
        { name: 'Confissão (Exame)', icon: Icons.Search, path: AppRoute.POENITENTIA },
        { name: 'Tesouro de Orações', icon: Icons.Heart, path: AppRoute.PRAYERS },
      ]
    }
  ];

  const handleNavigation = (route: AppRoute) => {
    onNavigate(route);
    if (onClose) onClose();
  };

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <aside className="h-full bg-stone-950 text-white flex flex-col p-6 shadow-4xl border-r border-white/5 z-50 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

      <div className="mb-8 flex flex-col items-center justify-center pt-8 text-center">
        <Logo className="w-16 h-16 mb-4 transition-all duration-1000 hover:scale-110" />
        <h1 className="text-2xl font-serif font-bold text-gold tracking-widest leading-none">CATHEDRA</h1>
        <p className="text-[7px] uppercase tracking-[0.5em] text-white/30 font-black mt-2">Santuário de Inteligência Teológica</p>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-10">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-3">
            <h3 className="px-4 text-[7px] font-black uppercase tracking-[0.4em] text-gold/40">{group.title}</h3>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = currentPath === item.path;
                return (
                  <button 
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                      isActive ? 'bg-white/10 border border-gold/30 shadow-lg text-gold' : 'hover:bg-white/5 border border-transparent text-stone-400'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-stone-600'}`} />
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-4">
        {installPrompt && !isStandalone && (
          <button 
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-3 py-4 bg-sacred/20 border border-sacred/40 text-white rounded-xl font-black uppercase text-[8px] tracking-[0.2em] animate-pulse-soft hover:bg-sacred/30 transition-all"
          >
            <Icons.Globe className="w-4 h-4 text-gold" />
            <span>Baixar App (PWA)</span>
          </button>
        )}

        {user ? (
          <button onClick={() => handleNavigation(AppRoute.PROFILE)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">{user.name.charAt(0)}</div>
            <div className="text-left truncate flex-1">
              <p className="text-[10px] font-bold">{user.name}</p>
              <p className="text-[7px] text-gold/60 uppercase font-black">Membro Scholar</p>
            </div>
          </button>
        ) : (
          <button onClick={() => handleNavigation(AppRoute.LOGIN)} className="w-full py-4 bg-gold text-stone-900 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl active:scale-95 transition-transform">
            Acessar Cátedra
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
