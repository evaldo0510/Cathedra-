
import React, { useContext } from 'react';
import { Icons, Logo } from '../constants';
import { AppRoute, User, Language } from '../types';
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

  const languages: { code: Language, label: string, flag: string }[] = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'la', label: 'Latina', flag: '🇻🇦' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ];

  const menuItems = [
    { name: 'Nártex (Início)', icon: Icons.Home, path: AppRoute.DASHBOARD },
    { name: 'Sagradas Escrituras', icon: Icons.Book, path: AppRoute.BIBLE },
    { name: 'Doutrina & Verdade', icon: Icons.Cross, path: AppRoute.CATECHISM },
    { name: 'Testemunhas da Fé', icon: Icons.Users, path: AppRoute.SAINTS },
    { name: 'Conexões Divinas', icon: Icons.Layout, path: AppRoute.STUDY_MODE, subtitle: 'Bíblia + Tradição' },
    { name: 'Cátedra do Mestre', icon: Icons.Feather, path: AppRoute.COMMUNITY },
  ];

  const handleNavigation = (route: AppRoute) => {
    onNavigate(route);
    if (onClose) onClose();
  };

  return (
    <aside className="h-full bg-[#0c0a09] text-white flex flex-col p-8 shadow-2xl border-r border-[#d4af37]/20 z-50 overflow-y-auto custom-scrollbar">
      <div className="mb-12 flex flex-col items-center">
        <Logo className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-serif font-bold text-[#d4af37] tracking-[0.1em]">CATHEDRA</h1>
        <p className="text-[8px] uppercase tracking-[0.4em] text-white/40 font-bold">Sanctuarium Digitale</p>
      </div>
      
      <nav className="flex-1 space-y-4">
        {menuItems.map(item => (
          <button 
            key={item.name}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center gap-5 px-4 py-3 rounded-xl transition-all group ${currentPath === item.path ? 'bg-white/5 border border-[#d4af37]/30' : 'hover:bg-white/5'}`}
          >
            <item.icon className={`w-6 h-6 flex-shrink-0 ${currentPath === item.path ? 'text-yellow-400' : 'text-stone-500 group-hover:text-yellow-400'}`} />
            <div className="flex flex-col items-start min-w-0">
              <span className={`font-serif text-lg transition-colors ${currentPath === item.path ? 'text-yellow-400 font-bold' : 'text-yellow-500 hover:text-yellow-400'}`}>
                {item.name}
              </span>
              {item.subtitle && <span className="text-[9px] italic text-white/30 truncate w-full">{item.subtitle}</span>}
            </div>
          </button>
        ))}
      </nav>

      <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 ml-4">Linguam Elige</p>
        <div className="grid grid-cols-2 gap-2">
           {languages.map(l => (
             <button 
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] transition-all border ${lang === l.code ? 'bg-[#d4af37] text-stone-900 border-[#d4af37]' : 'bg-white/5 text-white/40 border-white/5 hover:border-[#d4af37]/30'}`}
             >
                <span className="font-bold truncate">{l.label}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gold text-stone-900 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{user.name}</p>
                <p className="text-[9px] text-white/40 truncate">{user.role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-sacred transition-colors">
              {t('exit')}
            </button>
          </div>
        ) : (
          <button onClick={() => handleNavigation(AppRoute.LOGIN)} className="w-full py-4 bg-[#d4af37] text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gold/20">
            {t('login')}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
