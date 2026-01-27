
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
  const { t } = useContext(LangContext);

  const menuGroups = [
    {
      title: 'Hodie',
      items: [
        { name: 'Dashboard', icon: Icons.Home, path: AppRoute.DASHBOARD },
        { name: 'Escrituras', icon: Icons.Book, path: AppRoute.BIBLE },
        { name: 'Liturgia', icon: Icons.History, path: AppRoute.DAILY_LITURGY },
      ]
    },
    {
      title: 'Sacra Doctrina',
      items: [
        { name: 'Catecismo', icon: Icons.Cross, path: AppRoute.CATECHISM },
        { name: 'Magistério', icon: Icons.Globe, path: AppRoute.MAGISTERIUM },
        { name: 'Suma IA', icon: Icons.Feather, path: AppRoute.AQUINAS_OPERA },
      ]
    },
    {
      title: 'Cultus',
      items: [
        { name: 'Missal', icon: Icons.Cross, path: AppRoute.ORDO_MISSAE },
        { name: 'Rosário', icon: Icons.Star, path: AppRoute.ROSARY },
        { name: 'Confissão', icon: Icons.Pin, path: AppRoute.POENITENTIA },
      ]
    }
  ];

  const handleNavigation = (route: AppRoute) => {
    onNavigate(route);
    if (onClose) onClose();
  };

  return (
    <aside className="h-full bg-stone-950/80 backdrop-blur-3xl text-white flex flex-col p-6 shadow-4xl border-r border-white/5 z-50 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

      <div className="mb-12 flex flex-col items-center justify-center pt-8 text-center">
        <Logo className="w-16 h-16 mb-6 transition-all duration-1000 hover:scale-110" />
        <h1 className="text-3xl font-serif font-bold text-gold tracking-widest">CATHEDRA</h1>
        <p className="text-[8px] uppercase tracking-[0.6em] text-white/30 font-black mt-2">Sanctuarium Digitale</p>
      </div>

      <nav className="flex-1 space-y-10 overflow-y-auto no-scrollbar pb-10">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4">
            <h3 className="px-4 text-[8px] font-black uppercase tracking-[0.5em] text-gold/40">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = currentPath === item.path;
                return (
                  <button 
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      isActive ? 'bg-white/10 border border-gold/30 shadow-xl' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'text-gold' : 'text-stone-500'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-bold tracking-widest ${isActive ? 'text-white' : 'text-stone-400'}`}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5">
        {user ? (
          <button onClick={() => handleNavigation(AppRoute.PROFILE)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">{user.name.charAt(0)}</div>
            <div className="text-left truncate flex-1">
              <p className="text-xs font-bold">{user.name}</p>
              <p className="text-[8px] text-gold/60 uppercase font-black">Scholar Member</p>
            </div>
          </button>
        ) : (
          <button onClick={() => handleNavigation(AppRoute.LOGIN)} className="w-full py-5 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
            Acessar Cátedra
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
