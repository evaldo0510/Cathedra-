
import React from 'react';
import { Icons, MobileLogo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    const mainArea = document.querySelector('main');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0c0a09] text-stone-400 border-t border-white/5 pt-16 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {/* Branding */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <MobileLogo className="w-10 h-10 border border-white/10 p-1.5 rounded-xl bg-white/5" />
            <div>
              <h3 className="text-lg font-serif font-bold text-white tracking-widest leading-none">CATHEDRA</h3>
              <p className="text-[8px] font-black uppercase text-gold/60 mt-1 tracking-[0.2em]">Sanctuarium Digitale</p>
            </div>
          </div>
          <p className="text-xs font-serif italic leading-relaxed text-stone-500 max-w-xs">
            "A tecnologia a serviço da Tradição. Um santuário digital para o estudo, a oração e a contemplação da Verdade Eterna."
          </p>
        </div>

        {/* Navegação */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Navegação</h4>
          <nav className="flex flex-col gap-3">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-left text-sm hover:text-gold transition-colors flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold/20" /> Bíblia Sagrada
            </button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="text-left text-sm hover:text-gold transition-colors flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold/20" /> Liturgia Diária
            </button>
            <button onClick={() => onNavigate(AppRoute.CATECHISM)} className="text-left text-sm hover:text-gold transition-colors flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold/20" /> Catecismo da Igreja
            </button>
          </nav>
        </div>

        {/* Fontes Oficiais */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Fontes Oficiais</h4>
          <nav className="flex flex-col gap-3">
            <a href="https://www.vatican.va" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2">
              <Icons.ExternalLink className="w-3 h-3 text-gold/40" /> Santa Sé (Vaticano)
            </a>
            <a href="https://www.vaticannews.va/pt.html" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2">
              <Icons.ExternalLink className="w-3 h-3 text-gold/40" /> Vatican News
            </a>
            <a href="https://www.vatican.va/archive/cod-iuris-canonici/cic_index_pt.html" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2">
              <Icons.ExternalLink className="w-3 h-3 text-gold/40" /> Direito Canônico
            </a>
            <a href="https://www.cnbb.org.br" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2">
              <Icons.ExternalLink className="w-3 h-3 text-gold/40" /> Portal CNBB
            </a>
          </nav>
        </div>

        {/* Suporte/Membro */}
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
          <Icons.Cross className="absolute -bottom-6 -right-6 w-24 h-24 text-gold/5 group-hover:rotate-12 transition-transform duration-1000" />
          <h4 className="text-[10px] font-black uppercase text-gold mb-3">Membro Scholar</h4>
          <p className="text-[10px] italic mb-6 leading-relaxed text-stone-400">Desbloqueie o Cathedra AI e ferramentas avançadas de exegese para um estudo profundo.</p>
          <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="w-full py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Tornar-me Membro</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-black uppercase tracking-[0.4em] text-stone-600">
        <div className="text-center md:text-left">
          <p>Ad Maiorem Dei Gloriam</p>
          <p className="mt-1 opacity-50">© {new Date().getFullYear()} Cathedra Digital • Product v1.2</p>
        </div>
        
        <button onClick={scrollToTop} className="flex flex-col items-center gap-2 group">
          <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:border-gold/50 transition-all">
            <Icons.ArrowDown className="w-4 h-4 rotate-180 text-gold" />
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Sursum Corda</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
