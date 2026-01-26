
import React from 'react';
import { Icons, MobileLogo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0c0a09] text-stone-400 border-t border-white/5 pt-16 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <MobileLogo className="w-10 h-10 border border-white/10 p-1.5 rounded-xl bg-white/5" />
            <div>
              <h3 className="text-lg font-serif font-bold text-white tracking-widest leading-none">CATHEDRA</h3>
              <p className="text-[8px] font-black uppercase text-gold/60 mt-1">Sanctuarium Digitale</p>
            </div>
          </div>
          <p className="text-xs font-serif italic leading-relaxed text-stone-500">
            A tecnologia a serviço da Tradição. Um santuário digital para o estudo, a oração e a contemplação da Verdade.
          </p>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Navigatio</h4>
          <nav className="flex flex-col gap-3">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-left text-sm hover:text-gold transition-colors">Bíblia Sagrada</button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="text-left text-sm hover:text-gold transition-colors">Liturgia Diária</button>
            <button onClick={() => onNavigate(AppRoute.CATECHISM)} className="text-left text-sm hover:text-gold transition-colors">Catecismo Oficial</button>
          </nav>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Fontes Oficiais</h4>
          <nav className="flex flex-col gap-3">
            <a href="https://www.vatican.va" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2">
              <Icons.ExternalLink className="w-3 h-3" /> Santa Sé (Vaticano)
            </a>
            <a href="https://www.cnbb.org.br" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2">
              <Icons.ExternalLink className="w-3 h-3" /> CNBB
            </a>
            <a href="https://www.vaticannews.va" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2">
              <Icons.ExternalLink className="w-3 h-3" /> Vatican News
            </a>
          </nav>
        </div>

        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
          <h4 className="text-[10px] font-black uppercase text-gold mb-3">Membro Scholar</h4>
          <p className="text-[10px] italic mb-4 leading-relaxed">Assine para desbloquear o Cathedra AI e ferramentas avançadas de exegese.</p>
          <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="w-full py-3 bg-gold text-stone-900 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">Upgrade</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-black uppercase tracking-widest text-stone-600">
        <p>© {new Date().getFullYear()} Cathedra Digital. Ad Maiorem Dei Gloriam.</p>
        <div className="flex gap-6">
          <button className="hover:text-gold transition-colors">Privacidade</button>
          <button className="hover:text-gold transition-colors">Termos</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
