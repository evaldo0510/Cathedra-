
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
      title: 'Hoje (Hodie)',
      items: [
        { name: t('home'), icon: Icons.Home, path: AppRoute.DASHBOARD, subtitle: t('home_sub') },
        { name: t('bible'), icon: Icons.Book, path: AppRoute.BIBLE, subtitle: t('bible_sub') },
        { name: 'Liturgia Diária', icon: Icons.History, path: AppRoute.DAILY_LITURGY, subtitle: 'O Alimento da Palavra' },
        { name: t('calendar'), icon: Icons.Globe, path: AppRoute.LITURGICAL_CALENDAR, subtitle: t('calendar_sub') },
      ]
    },
    {
      title: 'Liturgia (Cultus)',
      items: [
        { name: 'Ordinário da Missa', icon: Icons.Cross, path: AppRoute.ORDO_MISSAE, subtitle: 'Missale Romanum' },
        { name: 'Breviário', icon: Icons.Book, path: AppRoute.BREVIARY, subtitle: 'Ofício Divino' },
        { name: 'Santo Rosário', icon: Icons.Star, path: AppRoute.ROSARY, subtitle: 'Mistérios de Maria' },
        { name: 'Via Sacra', icon: Icons.Pin, path: AppRoute.VIA_CRUCIS, subtitle: 'Paixão do Senhor' },
      ]
    },
    {
      title: 'Doutrina (Sacra Doctrina)',
      items: [
        { name: t('catechism'), icon: Icons.Cross, path: AppRoute.CATECHISM, subtitle: t('catechism_sub') },
        { name: 'Magistério', icon: Icons.Globe, path: AppRoute.MAGISTERIUM, subtitle: 'Documentos da Igreja' },
        { name: 'Dogmas', icon: Icons.Pin, path: AppRoute.DOGMAS, subtitle: 'Verdades Imutáveis' },
        { name: 'Suma Teológica', icon: Icons.Feather, path: AppRoute.AQUINAS_OPERA, subtitle: 'Opera Omnia' },
      ]
    },
    {
      title: 'Espiritualidade (Anima)',
      items: [
        { name: 'Confissão (Poenitentia)', icon: Icons.Cross, path: AppRoute.POENITENTIA, subtitle: 'Exame de Consciência' },
        { name: 'Ladainhas', icon: Icons.Message, path: AppRoute.LITANIES, subtitle: 'Súplicas da Igreja' },
        { name: 'Lectio Divina', icon: Icons.Book, path: AppRoute.LECTIO_DIVINA, subtitle: 'Oração Escriturística' },
        { name: 'Quiz (Certamen)', icon: Icons.Layout, path: AppRoute.CERTAMEN, subtitle: 'Testar Conhecimentos' },
      ]
    },
    {
      title: 'Estudos (Academia)',
      items: [
        { name: 'Investigação IA', icon: Icons.Search, path: AppRoute.STUDY_MODE, subtitle: 'Analogias Teológicas' },
        { name: 'Aula Magna', icon: Icons.Users, path: AppRoute.COMMUNITY, subtitle: 'Recurso Scholar' },
        { name: 'Favoritos', icon: Icons.Star, path: AppRoute.FAVORITES, subtitle: 'Florilégio Pessoal' },
      ]
    }
  ];

  const handleNavigation = (route: AppRoute) => {
    onNavigate(route);
    if (onClose) onClose();
  };

  return (
    <aside className="h-full bg-[#0c0a09] text-white flex flex-col p-5 md:p-6 shadow-2xl border-r border-[#d4af37]/20 z-50 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

      <button 
        onClick={onClose} 
        className="lg:hidden absolute top-5 right-5 p-3 text-stone-500 hover:text-gold transition-all active:scale-90 bg-white/5 rounded-2xl border border-white/5 z-20"
      >
        <Icons.Cross className="w-6 h-6 rotate-45" />
      </button>

      <div className="mb-8 flex flex-col items-center justify-center relative z-10 pt-4 text-center">
        <Logo className="w-14 h-14 lg:w-16 lg:h-16 mb-4 transition-transform duration-[2000ms] hover:rotate-[360deg]" />
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#d4af37] tracking-[0.18em]">CATHEDRA</h1>
        <p className="text-[9px] uppercase tracking-[0.5em] text-white/40 font-black mt-1">Santuário Digital</p>
      </div>

      <nav className="flex-1 space-y-10 overflow-y-auto no-scrollbar pb-10 relative z-10 pr-1">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4">
            <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.4em] text-gold/30 flex items-center gap-3">
              <div className="h-px w-3 bg-gold/10" />
              {group.title}
            </h3>
            <div className="space-y-1.5">
              {group.items.map(item => {
                const isActive = currentPath === item.path;
                return (
                  <button 
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                      isActive ? 'bg-white/10 border border-[#d4af37]/40 shadow-inner' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-gold text-stone-900 shadow-lg' : 'bg-stone-800 text-stone-400 group-hover:text-gold'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-stone-300 group-hover:text-white'}`}>{item.name}</p>
                      <p className="text-[9px] text-stone-500 font-serif italic truncate">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative z-10 pt-6 border-t border-white/10 mt-4">
        {user ? (
          <button onClick={() => handleNavigation(AppRoute.PROFILE)} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all">
            <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold">{user.name.charAt(0)}</div>
            <div className="text-left truncate flex-1">
              <p className="text-xs font-bold text-white">{user.name}</p>
              <p className="text-[8px] text-gold/60 uppercase tracking-widest">Scholar</p>
            </div>
            <Icons.ArrowDown className="w-4 h-4 rotate-[-90deg] text-stone-500" />
          </button>
        ) : (
          <button 
            onClick={() => handleNavigation(AppRoute.LOGIN)}
            className="w-full py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
          >
            Entrar no Santuário
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
