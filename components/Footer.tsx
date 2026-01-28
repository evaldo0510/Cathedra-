
import React from 'react';
import { Icons, MobileLogo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    const mainArea = document.getElementById('main-content');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0c0a09] text-stone-400 border-t border-white/5 pt-20 pb-12 px-6 relative overflow-hidden mt-auto">
      {/* Background Texture & Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          
          {/* Branding & Mission */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <MobileLogo className="w-12 h-12 border border-white/10 p-2 rounded-2xl bg-white/5 shadow-2xl" />
              <div>
                <h3 className="text-xl font-serif font-bold text-white tracking-widest leading-none">CATHEDRA</h3>
                <p className="text-[9px] font-black uppercase text-gold mt-1 tracking-[0.3em]">Sanctuarium Digitale</p>
              </div>
            </div>
            <p className="text-sm font-serif italic leading-relaxed text-stone-500 max-w-xs">
              "A tecnologia a serviço da Verdade Eterna. Um repositório vivo da tradição apostólica para o fiel moderno."
            </p>
            <div className="flex gap-4 pt-2">
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-stone-400 hover:text-gold transition-all"><Icons.Message className="w-4 h-4" /></button>
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-stone-400 hover:text-gold transition-all"><Icons.Globe className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Core Navigation */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-gold pl-4">Navegação</h4>
            <nav className="flex flex-col gap-4">
              {[
                { label: 'Bíblia Sagrada', route: AppRoute.BIBLE },
                { label: 'Catecismo Universal', route: AppRoute.CATECHISM },
                { label: 'Liturgia das Horas', route: AppRoute.BREVIARY },
                { label: 'Suma Teológica', route: AppRoute.AQUINAS_OPERA },
                { label: 'Perfil do Membro', route: AppRoute.PROFILE }
              ].map(item => (
                <button 
                  key={item.label}
                  onClick={() => onNavigate(item.route)} 
                  className="text-left text-sm hover:text-gold transition-all flex items-center gap-3 group"
                >
                  <div className="w-1 h-1 rounded-full bg-stone-700 group-hover:bg-gold transition-colors" /> 
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Official References */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-sacred pl-4">Fontes Oficiais</h4>
            <nav className="flex flex-col gap-4">
              <a href="https://www.vatican.va" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-all flex items-center gap-3 group">
                <Icons.ExternalLink className="w-4 h-4 text-stone-600 group-hover:text-gold transition-colors" /> 
                Santa Sé (Vaticano)
              </a>
              <a href="https://www.vaticannews.va/pt.html" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-all flex items-center gap-3 group">
                <Icons.ExternalLink className="w-4 h-4 text-stone-600 group-hover:text-gold transition-colors" /> 
                Vatican News
              </a>
              <a href="https://www.cnbb.org.br" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-all flex items-center gap-3 group">
                <Icons.ExternalLink className="w-4 h-4 text-stone-600 group-hover:text-gold transition-colors" /> 
                Portal CNBB
              </a>
              <a href="https://www.vatican.va/archive/cod-iuris-canonici/cic_index_pt.html" target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-all flex items-center gap-3 group">
                <Icons.ExternalLink className="w-4 h-4 text-stone-600 group-hover:text-gold transition-colors" /> 
                Direito Canônico
              </a>
            </nav>
          </div>

          {/* Partners Area */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-emerald-500 pl-4">Parceiros & Apoio</h4>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/2] bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all cursor-pointer group">
                  <div className="text-[8px] font-black uppercase tracking-tighter text-stone-600 group-hover:text-gold">Sócio {i}</div>
                </div>
              ))}
            </div>
            <p className="text-[9px] italic text-stone-600 leading-relaxed">
              Deseja apoiar a digitalização da fé? <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="text-gold underline">Saiba como ser um parceiro.</button>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <Icons.Cross className="w-5 h-5 text-sacred" />
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-500">Ad Maiorem Dei Gloriam</p>
            </div>
            <p className="text-[9px] text-stone-700 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} CATHEDRA DIGITAL • SISTEMA NACIONAL DE INTELIGÊNCIA TEOLÓGICA • V1.5.0
            </p>
          </div>

          <div className="flex items-center gap-10">
            <button 
              onClick={scrollToTop} 
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className="p-3.5 rounded-full bg-white/5 border border-white/10 group-hover:border-gold/50 group-hover:bg-gold/10 shadow-xl transition-all">
                <Icons.ArrowDown className="w-5 h-5 rotate-180 text-gold" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-stone-600 group-hover:text-gold transition-colors">Sursum Corda</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
