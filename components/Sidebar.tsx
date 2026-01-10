
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
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onClose, user, onLogout }) => {
  const { lang, setLang, t } = useContext(LangContext);

  const menuGroups = [
    {
      title: 'Principal',
      items: [
        { name: 'Início', icon: Icons.Home, path: AppRoute.DASHBOARD },
        { name: 'Sagradas Escrituras', icon: Icons.Book, path: AppRoute.BIBLE },
        { name: 'Liturgia Diária', icon: Icons.History, path: AppRoute.DAILY_LITURGY },
        { name: 'Calendário Litúrgico', icon: Icons.Globe, path: AppRoute.LITURGICAL_CALENDAR },
      ]
    },
    {
      title: 'Doutrina & Estudo',
      items: [
        { name: 'Catecismo (CIC)', icon: Icons.Cross, path: AppRoute.CATECHISM },
        { name: 'Opera Omnia', icon: Icons.Feather, path: AppRoute.AQUINAS_OPERA, subtitle: 'S. Tomás de Aquino' },
        { name: 'Magistério', icon: Icons.ExternalLink, path: AppRoute.MAGISTERIUM },
        { name: 'Verdades de Fé', icon: Icons.Pin, path: AppRoute.DOGMAS, subtitle: 'Dogmas' },
        { name: 'Sanctorum', icon: Icons.Users, path: AppRoute.SAINTS, subtitle: 'Vida dos Santos' },
      ]
    },
    {
      title: 'Vida de Oração',
      items: [
        { name: 'Lectio Divina', icon: Icons.Search, path: AppRoute.LECTIO_DIVINA },
        { name: 'Rosárium', icon: Icons.Star, path: AppRoute.ROSARY, subtitle: 'Santo Terço' },
        { name: 'Via Crucis', icon: Icons.ArrowDown, path: AppRoute.VIA_CRUCIS, subtitle: 'Via Sacra' },
        { name: 'Litaniæ', icon: Icons.Audio, path: AppRoute.LITANIES, subtitle: 'Ladainhas' },
        { name: 'Ordo Missæ', icon: Icons.Layout, path: AppRoute.ORDO_MISSAE, subtitle: 'Ordinário' },
        { name: 'Poenitentia', icon: Icons.Cross, path: AppRoute.POENITENTIA, subtitle: 'Confissão' },
        { name: 'Thesaurus Precum', icon: Icons.Feather, path: AppRoute.PRAYERS, subtitle: 'Orações' },
      ]
    }
  ];

  const handleNavigation = (route: AppRoute) => {
    onNavigate(route);
    if (onClose) onClose();
  };

  return (
    <aside className="h-full bg-[#0c0a09] text-white flex flex-col p-6 lg:p-8 shadow-2xl border-r border-[#d4af37]/20 z-50 overflow-y-auto custom-scrollbar relative">
      <button 
        onClick={onClose} 
        className="lg:hidden absolute top-6 right-6 p-2 text-stone-500 hover:text-gold transition-colors"
        aria-label="Fechar menu"
      >
        <Icons.Cross className="w-6 h-6 rotate-45" />
      </button>

      <div className="mb-8 lg:mb-10 flex flex-col items-center">
        <Logo className="w-12 h-12 lg:w-14 lg:h-14 mb-4" />
        <h1 className="text-xl lg:text-2xl font-serif font-bold text-[#d4af37] tracking-[0.1em]">CATHEDRA</h1>
        <p className="text-[7px] lg:text-[8px] uppercase tracking-[0.4em] text-white/40 font-bold">Sanctuarium Digitale</p>
      </div>
      
      <nav className="flex-1 space-y-8">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-gold/40 mb-4">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map(item => (
                <button 
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all group relative overflow-hidden ${
                    currentPath === item.path 
                      ? 'bg-white/5 border border-[#d4af37]/40' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {currentPath === item.path && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-gold rounded-r-full shadow-[0_0_10px_#d4af37]" />
                  )}
                  
                  <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${currentPath === item.path ? 'text-yellow-400' : 'text-stone-500 group-hover:text-yellow-400'}`} />
                  
                  <div className="flex flex-col items-start min-w-0">
                    <span className={`font-serif text-sm lg:text-base transition-colors leading-tight ${currentPath === item.path ? 'text-yellow-400 font-bold' : 'text-stone-300 group-hover:text-yellow-400'}`}>
                      {item.name}
                    </span>
                    {item.subtitle && (
                      <span className={`text-[8px] italic truncate w-full transition-opacity ${currentPath === item.path ? 'text-white/60' : 'text-white/20 group-hover:text-white/40'}`}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-8 pt-6 border-t border-white/5">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gold text-stone-900 flex items-center justify-center font-bold text-xs shadow-inner">{user.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate text-white">{user.name}</p>
                <p className="text-[7px] text-white/30 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-sacred hover:bg-sacred/5 rounded-xl transition-all"
            >
              Encerrar Sessão
            </button>
          </div>
        ) : (
          <button 
            onClick={() => handleNavigation(AppRoute.LOGIN)} 
            className="w-full py-4 bg-[#d4af37] text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gold/10 hover:bg-yellow-400 active:scale-95 transition-all"
          >
            Acessar Santuário
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
