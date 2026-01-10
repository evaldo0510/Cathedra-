
import React from 'react';
import { Icons, Logo, MobileLogo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    const mainArea = document.querySelector('main');
    if (mainArea) {
      mainArea.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0c0a09] text-stone-400 border-t border-white/5 pt-16 md:pt-24 pb-12 relative overflow-hidden">
      {/* Aura de fundo sutil */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gold/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
          
          {/* Coluna 1: Manifesto & Branding */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate(AppRoute.DASHBOARD)}>
              <MobileLogo className="w-12 h-12 bg-white/5 p-2 rounded-2xl border border-white/10 group-hover:border-gold/50 transition-all shadow-2xl" />
              <div>
                <h3 className="text-xl font-serif font-bold text-white tracking-widest leading-none">CATHEDRA</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gold/60 mt-1">Sanctuarium Digitale</p>
              </div>
            </div>
            <p className="text-sm font-serif italic leading-relaxed text-stone-500">
              "A tecnologia a serviço da Verdade Eterna. Nossa missão é iluminar o intelecto e inflamar o coração através da Sagrada Tradição no ambiente digital."
            </p>
            <div className="flex gap-3">
              {['Instagram', 'YouTube', 'Telegram'].map(social => (
                <button key={social} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-all">
                  <Icons.Globe className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Coluna 2: Navigatio Sacra */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Navigatio</h4>
            <nav className="grid grid-cols-1 gap-4">
              {[
                { name: 'Bíblia Sagrada', route: AppRoute.BIBLE },
                { name: 'Liturgia Diária', route: AppRoute.DAILY_LITURGY },
                { name: 'Catecismo Oficial', route: AppRoute.CATECHISM },
                { name: 'Biblioteca Tomista', route: AppRoute.AQUINAS_OPERA },
                { name: 'Calendário Litúrgico', route: AppRoute.LITURGICAL_CALENDAR }
              ].map(item => (
                <button 
                  key={item.name}
                  onClick={() => onNavigate(item.route)}
                  className="text-left text-sm hover:text-gold transition-colors flex items-center gap-3 group"
                >
                  <div className="h-px w-3 bg-stone-800 group-hover:w-5 group-hover:bg-gold transition-all" />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Coluna 3: Communio & Ref */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Referências</h4>
            <nav className="grid grid-cols-1 gap-4">
              {[
                { name: 'A Santa Sé (Vaticano)', url: 'https://vatican.va' },
                { name: 'Vatican News', url: 'https://vaticannews.va' },
                { name: 'Magistério IA', route: AppRoute.MAGISTERIUM },
                { name: 'Certamen (Quiz)', route: AppRoute.CERTAMEN },
                { name: 'Área do Membro', route: AppRoute.PROFILE }
              ].map(item => (
                <button 
                  key={item.name}
                  onClick={() => item.route ? onNavigate(item.route) : window.open(item.url, '_blank')}
                  className="text-left text-sm hover:text-gold transition-colors flex items-center gap-3 group"
                >
                  <Icons.ExternalLink className="w-3.5 h-3.5 text-stone-800 group-hover:text-gold/40" />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Coluna 4: Gazofilácio (Apoio) */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
              <Icons.Cross className="absolute -bottom-6 -right-6 w-24 h-24 text-gold/5 group-hover:rotate-12 transition-transform duration-1000" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-4">Apoie esta Obra</h4>
              <p className="text-xs italic leading-relaxed mb-6">
                Sua contribuição mantém o santuário digital gratuito e a nossa IA teológica em constante evolução.
              </p>
              <button 
                onClick={() => onNavigate(AppRoute.CHECKOUT)}
                className="w-full py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                Tornar-me Scholar
              </button>
            </div>
            <div className="flex items-center justify-between px-2 opacity-40 grayscale group-hover:grayscale-0 transition-all">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase">Segurança</span>
                  <div className="flex gap-2 mt-1">
                    <div className="w-6 h-4 bg-white/20 rounded-sm" title="Stripe" />
                    <div className="w-6 h-4 bg-white/20 rounded-sm" title="SSL" />
                  </div>
               </div>
               <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest">v5.3.0 Pro</span>
                  <p className="text-[7px]">PWA Architecture</p>
               </div>
            </div>
          </div>
        </div>

        {/* Linha Final */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-stone-600">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20 mb-2">Ad Maiorem Dei Gloriam</p>
            <p className="text-[9px] tracking-wide">© {new Date().getFullYear()} Cathedra Digital. Desenvolvido para a Nova Evangelização.</p>
          </div>

          <button 
            onClick={scrollToTop}
            className="flex flex-col items-center gap-2 group transition-all"
          >
            <div className="p-3 rounded-full bg-white/5 border border-white/5 group-hover:border-gold/30 group-hover:text-gold transition-all animate-bounce">
              <Icons.ArrowDown className="w-5 h-5 rotate-180" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.5em] opacity-0 group-hover:opacity-100 transition-opacity">Sursum Corda</span>
          </button>
          
          <div className="flex gap-6">
            {['Privacidade', 'Termos', 'Cookies'].map(link => (
              <button key={link} className="text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">{link}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
