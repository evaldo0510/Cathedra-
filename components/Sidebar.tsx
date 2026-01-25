
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
  const { lang, t } = useContext(LangContext);

  const menuGroups = [
    {
      title: 'Santuário (Hodie)',
      items: [
        { name: 'Nártex (Início)', icon: Icons.Home, path: AppRoute.DASHBOARD, subtitle: 'Onde o silêncio começa' },
        { name: 'Scriptuarium (Bíblia)', icon: Icons.Book, path: AppRoute.BIBLE, subtitle: 'A voz de Deus na história' },
        { name: 'Lecionário (Liturgia)', icon: Icons.History, path: AppRoute.DAILY_LITURGY, subtitle: 'O alimento espiritual cotidiano' },
        { name: 'Cronos (Calendário)', icon: Icons.Globe, path: AppRoute.LITURGICAL_CALENDAR, subtitle: 'O ritmo da eternidade no tempo' },
      ]
    },
    {
      title: 'Sacra Doctrina',
      items: [
        { name: 'Codex Fidei (Catecismo)', icon: Icons.Cross, path: AppRoute.CATECHISM, subtitle: 'O mapa seguro da fé católica' },
        { name: 'Magistério da Igreja', icon: Icons.Globe, path: AppRoute.MAGISTERIUM, subtitle: 'O Ensino Oficial' },
        { name: 'Verdades (Dogmas)', icon: Icons.Pin, path: AppRoute.DOGMAS, subtitle: 'A rocha imutável da verdade' },
        { name: 'Sanctorum (Santos)', icon: Icons.Users, path: AppRoute.SAINTS, subtitle: 'Aqueles que viram a Luz' },
      ]
    },
    {
      title: 'Academia (Estudo)',
      items: [
        { name: 'Symphonia (Estudo)', icon: Icons.Search, path: AppRoute.STUDY_MODE, subtitle: 'Bíblia + Tradição via Inteligência IA' },
        { name: 'Aula Magna (Comunidade)', icon: Icons.Users, path: AppRoute.COMMUNITY, subtitle: 'Lições profundas e mistério' },
        { name: 'Opera Omnia', icon: Icons.Feather, path: AppRoute.AQUINAS_OPERA, subtitle: 'A sabedoria de S. Tomás de Aquino' },
        { name: 'Certamen (Quiz)', icon: Icons.Layout, path: AppRoute.CERTAMEN, subtitle: 'Duelo intelectual sacro' },
      ]
    },
    {
      title: 'Sistema (Admin)',
      items: [
        { name: 'Diagnóstico PWA', icon: Icons.Layout, path: AppRoute.DIAGNOSTICS, subtitle: 'Verificar integridade offline' },
        { name: 'Preces (Orações)', icon: Icons.Feather, path: AppRoute.PRAYERS, subtitle: 'O tesouro universal de orações' },
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
        aria-label="Fechar menu"
      >
        <Icons.Cross className="w-6 h-6 rotate-45" />
      </button>

      <div className="mb-8 flex flex-col items-center justify-center relative z-10 pt-4 text-center">
        <Logo className="w-14 h-14 lg:w-16 lg:h-16 mb-4 transition-transform duration-[2000ms] hover:rotate-[360deg] drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" />
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#d4af37] tracking-[0.18em]">CATHEDRA</h1>
        <p className="text-[9px] uppercase tracking-[0.5em] text-white/40 font-black mt-1">Sanctuarium Digitale</p>
      </div>

      <button 
        onClick={onOpenSearch}
        className="mb-8 relative z-10 w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:border-gold/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <Icons.Search className="w-4 h-4 text-gold/60 group-hover:text-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60">Busca Rápida</span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[8px] font-black text-white/20">
           <span className="opacity-50">CMD</span>
           <span>K</span>
        </div>
      </button>
      
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
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden active:bg-white/10 ${
                      isActive 
                        ? 'bg-white/10 border border-[#d4af37]/40 shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-gold text-stone-900 shadow-lg' : 'bg-stone-800 text-stone-400 group-hover:text-gold'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-stone-300 group-hover:text-white'}`}>{item.name}</p>
                      <p className="text-[9px] text-stone-500 font-serif italic truncate">{item.subtitle}</p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section - Professional Footer */}
      <div className="relative z-10 pt-6 border-t border-white/10 mt-4 space-y-4">
        {user ? (
          <div className="flex items-center justify-between group">
            <button 
              onClick={() => handleNavigation(AppRoute.PROFILE)}
              className="flex items-center gap-3 flex-1 overflow-hidden p-2 rounded-2xl hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="text-left truncate">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[9px] text-gold/60 uppercase tracking-widest font-black">Membro Scholar</p>
              </div>
            </button>
            <button 
              onClick={onLogout}
              className="p-3 text-stone-500 hover:text-sacred transition-colors active:scale-90"
              title="Sair"
            >
              <Icons.Cross className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => handleNavigation(AppRoute.LOGIN)}
            className="w-full py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
          >
            Acessar Santuário
          </button>
        )}
        <div className="text-center">
          <p className="text-[8px] text-stone-600 font-black uppercase tracking-[0.3em]">Ex Umbris In Veritatem</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
