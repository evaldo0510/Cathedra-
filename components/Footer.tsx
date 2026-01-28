
import React, { useState, useEffect } from 'react';
import { Icons, MobileLogo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [partners, setPartners] = useState<string[]>([]);

  const loadPartners = () => {
    setPartners(JSON.parse(localStorage.getItem('cathedra_partners') || '["CNBB", "Vaticano", "Academia IA", "Teologia Online"]'));
  };

  useEffect(() => {
    loadPartners();
    window.addEventListener('cathedra-partners-updated', loadPartners);
    return () => window.removeEventListener('cathedra-partners-updated', loadPartners);
  }, []);

  const scrollToTop = () => {
    const mainArea = document.getElementById('main-content');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0c0a09] text-stone-400 border-t border-white/5 pt-24 pb-12 px-6 relative overflow-hidden mt-auto">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <MobileLogo className="w-12 h-12 border border-white/10 p-2 rounded-2xl bg-white/5 shadow-2xl" />
              <div>
                <h3 className="text-xl font-serif font-bold text-white tracking-widest leading-none">CATHEDRA</h3>
                <p className="text-[9px] font-black uppercase text-gold mt-1 tracking-[0.3em]">Sanctuarium Digitale</p>
              </div>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/60">Missão</h4>
                  <p className="text-xs font-serif italic text-stone-500 leading-relaxed">"Sistematizar o acesso ao depósito da fé através da inteligência teológica moderna."</p>
               </div>
               <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/60">Visão</h4>
                  <p className="text-xs font-serif italic text-stone-500 leading-relaxed">"Tornar-se a referência mundial em exegese e estudo assistido por IA para o fiel católico."</p>
               </div>
               <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/60">Valores</h4>
                  <div className="flex flex-wrap gap-2">
                     {['Fidelidade', 'Rigor', 'Piedade', 'Inovação'].map(v => (
                       <span key={v} className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-[8px] font-bold uppercase">{v}</span>
                     ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-gold pl-4">Mapa do Santuário</h4>
            <nav className="flex flex-col gap-4">
              <button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-left text-sm hover:text-gold transition-all">Bíblia Sagrada</button>
              <button onClick={() => onNavigate(AppRoute.CATECHISM)} className="text-left text-sm hover:text-gold transition-all">Catecismo Oficial</button>
              <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="text-left text-sm hover:text-gold transition-all">Liturgia Diária</button>
              <button onClick={() => onNavigate(AppRoute.AQUINAS_OPERA)} className="text-left text-sm hover:text-gold transition-all">Suma Teológica</button>
            </nav>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-sacred pl-4">Referências</h4>
            <nav className="flex flex-col gap-4">
              <a href="https://www.vatican.va" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-all">Santa Sé (Vaticano)</a>
              <a href="https://www.cnbb.org.br" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-all">Portal CNBB</a>
            </nav>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-emerald-500 pl-4">Apoio e Parcerias</h4>
            <div className="grid grid-cols-2 gap-3">
              {partners.map((p: string, i: number) => (
                <div key={i} className="aspect-[3/2] bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-2 text-center">
                  <div className="text-[8px] font-black uppercase tracking-tighter text-stone-600 group-hover:text-gold line-clamp-1">{p}</div>
                </div>
              ))}
            </div>
            <p className="text-[9px] italic text-stone-600">
              Deseja apoiar o projeto? <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="text-gold underline">Seja um Membro Scholar.</button>
            </p>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[9px] text-stone-700 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} CATHEDRA DIGITAL • INTELIGÊNCIA TEOLÓGICA • V1.7.0
            </p>
          </div>
          <button onClick={scrollToTop} className="p-3.5 rounded-full bg-white/5 border border-white/10 hover:border-gold/50 shadow-xl transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-180 text-gold" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
