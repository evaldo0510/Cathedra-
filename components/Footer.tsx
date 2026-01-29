
import React, { useState, useEffect } from 'react';
import { Icons, MobileLogo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [partners, setPartners] = useState<string[]>([]);

  const loadPartners = () => {
    // Carrega parceiros do localStorage ou usa padrão institucional
    setPartners(JSON.parse(localStorage.getItem('cathedra_partners') || '["Vatican Media", "CNBB Notícias", "Apostolado Digital", "Academia de Fé"]'));
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

  const referenceLinks = [
    { title: 'Santa Sé (Vaticano)', url: 'https://www.vatican.va' },
    { title: 'CNBB (Brasil)', url: 'https://www.cnbb.org.br' },
    { title: 'Catecismo da Igreja', url: 'https://www.vatican.va/archive/ccc/index_po.htm' },
    { title: 'Nova Vulgata Latina', url: 'https://www.vatican.va/archive/bible/nova_vulgata/documents/nova-vulgata_index_lt.html' },
    { title: 'Código de Direito Canônico', url: 'https://www.vatican.va/archive/cod-iuris-canonici/portuguese/codex-iuris-canonici_po.pdf' }
  ];

  return (
    <footer className="bg-[#0c0a09] text-stone-400 border-t border-white/5 pt-24 pb-12 px-6 relative overflow-hidden mt-auto">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          
          {/* COLUNA 1: IDENTIDADE */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <MobileLogo className="w-12 h-12 border border-white/10 p-2 rounded-2xl bg-white/5 shadow-2xl" />
              <div>
                <h3 className="text-xl font-serif font-bold text-white tracking-widest leading-none">CATHEDRA</h3>
                <p className="text-[9px] font-black uppercase text-gold mt-1 tracking-[0.3em]">Sanctuarium Digitale</p>
              </div>
            </div>
            <p className="text-xs font-serif italic text-stone-500 leading-relaxed max-w-xs">
              "Ex Umbris Et Imaginibus In Veritatem." <br />
              Dedicados à formação intelectual e espiritual do fiel moderno através da tecnologia sacra.
            </p>
          </div>

          {/* COLUNA 2: MAPA DO SANTUÁRIO */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-gold pl-4">Mapa do Santuário</h4>
            <nav className="flex flex-col gap-3">
              <button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-left text-sm hover:text-gold transition-colors">Bíblia Sagrada</button>
              <button onClick={() => onNavigate(AppRoute.CATECHISM)} className="text-left text-sm hover:text-gold transition-colors">Catecismo Oficial</button>
              <button onClick={() => onNavigate(AppRoute.MAGISTERIUM)} className="text-left text-sm hover:text-gold transition-colors">Magistério</button>
              <button onClick={() => onNavigate(AppRoute.SAINTS)} className="text-left text-sm hover:text-gold transition-colors">Vidas dos Santos</button>
              <button onClick={() => onNavigate(AppRoute.ABOUT)} className="text-left text-sm hover:text-gold transition-colors">Manifesto e Missão</button>
            </nav>
          </div>

          {/* COLUNA 3: REFERÊNCIAS DE FÉ */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-sacred pl-4">Referências Oficiais</h4>
            <nav className="flex flex-col gap-3">
              {referenceLinks.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-sm hover:text-gold transition-colors flex items-center gap-2 group"
                >
                  {link.title}
                  <Icons.ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </nav>
          </div>

          {/* COLUNA 4: APOIADORES */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-emerald-500 pl-4">Apoio e Parcerias</h4>
            <div className="grid grid-cols-2 gap-3">
              {partners.map((p: string, i: number) => (
                <div key={i} className="aspect-[3/2] bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-3 text-center group hover:border-gold/30 transition-all">
                  <div className="text-[8px] font-black uppercase tracking-tighter text-stone-500 group-hover:text-gold line-clamp-2">{p}</div>
                </div>
              ))}
            </div>
            <p className="text-[9px] italic text-stone-600 mt-4 leading-relaxed">
              Deseja apoiar este apostolado digital? <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="text-gold underline font-bold">Saiba como ajudar.</button>
            </p>
          </div>
        </div>

        {/* LINHA FINAL */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <p className="text-[9px] text-stone-700 font-bold uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} CATHEDRA DIGITAL • AD MAIOREM DEI GLORIAM
            </p>
            <p className="text-[8px] text-stone-800 font-black uppercase tracking-widest">
              Plataforma de Inteligência Teológica • v2.1 Market Ready
            </p>
          </div>
          <div className="flex items-center gap-6">
             <button onClick={scrollToTop} className="p-4 rounded-full bg-white/5 border border-white/10 hover:border-gold/50 shadow-xl transition-all group">
               <Icons.ArrowDown className="w-5 h-5 rotate-180 text-gold group-hover:-translate-y-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
