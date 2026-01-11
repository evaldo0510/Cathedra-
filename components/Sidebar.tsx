
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
      title: 'Devotio (Oração)',
      items: [
        { name: 'Rosárium', icon: Icons.Star, path: AppRoute.ROSARY, subtitle: 'A coroa de rosas da Virgem' },
        { name: 'Via Crucis', icon: Icons.Cross, path: AppRoute.VIA_CRUCIS, subtitle: 'O caminho doloroso da Redenção' },
        { name: 'Litaniæ', icon: Icons.Audio, path: AppRoute.LITANIES, subtitle: 'Súplicas rítmicas da tradição' },
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
      {/* Background Decorativo */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

      {/* Botão de Fechar Mobile */}
      <button 
        onClick={onClose} 
        className="lg:hidden absolute top-5 right-5 p-3 text-stone-500 hover:text-gold transition-all active:scale-90 bg-white/5 rounded-2xl border border-white/5 z-20"
        aria-label="Fechar menu"
      >
        <Icons.Cross className="w-6 h-6 rotate-45" />
      </button>

      {/* Header Centralizado */}
      <div className="mb-10 flex flex-col items-center justify-center relative z-10 pt-4 text-center">
        <Logo className="w-14 h-14 lg:w-16 lg:h-16 mb-4 transition-transform duration-[2000ms] hover:rotate-[360deg] drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" />
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#d4af37] tracking-[0.18em]">CATHEDRA</h1>
        <p className="text-[9px] uppercase tracking-[0.5em] text-white/40 font-black mt-1">Sanctuarium Digitale</p>
      </div>
      
      {/* Navegação Scrollable */}
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
                        ? 'bg-white/10 border border-[#d4af37]/40 shadow-[inset_0_0_20px_rgba(212,175,55,0.08)]' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-gold shadow-[0_0_15px_#d4af37]" />
                    )}
                    
                    <div className={`p-2.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-gold/10 text-gold scale-110' : 'text-stone-600 group-hover:text-gold/70'}`}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    </div>
                    
                    <div className="flex flex-col items-start min-w-0 text-left">
                      <span className={`font-serif text-[15px] lg:text-[17px] transition-colors leading-tight ${isActive ? 'text-gold font-bold' : 'text-stone-300 group-hover:text-white'}`}>
                        {item.name}
                      </span>
                      <span className={`text-[9px] italic truncate w-full transition-opacity mt-0.5 ${isActive ? 'text-white/70 opacity-100' : 'text-white/20 group-hover:text-white/40'}`}>
                        {item.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Perfil e Acesso */}
      <div className="mt-auto pt-6 border-t border-white/10 pb-4 relative z-10 bg-[#0c0a09]">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner group/user cursor-pointer" onClick={() => handleNavigation(AppRoute.PROFILE)}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-yellow-600 text-stone-900 flex items-center justify-center font-black text-sm shadow-lg border border-white/10 group-hover/user:scale-105 transition-transform">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-white tracking-wide">{user.name}</p>
                <p className="text-[8px] text-gold/60 uppercase font-black tracking-widest mt-0.5 flex items-center gap-1">
                  <Icons.Star className="w-2 h-2 fill-current" />
                  {user.role}
                </p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="w-full py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-sacred hover:bg-sacred/5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Icons.Cross className="w-3.5 h-3.5 rotate-45" />
              Sair do Santuário
            </button>
          </div>
        ) : (
          <button 
            onClick={() => handleNavigation(AppRoute.LOGIN)} 
            className="w-full py-5 bg-gradient-to-r from-gold to-[#b8952e] text-stone-900 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Icons.Cross className="w-4 h-4" />
            Acessar o Santuário
          </button>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </aside>
  );
};

export default Sidebar;
