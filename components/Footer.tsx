
import React from 'react';
import { Icons, MobileLogo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const vaticanLinks = [
    { title: 'Santa Sé (Vaticano)', url: 'https://www.vatican.va' },
    { title: 'Vatican News', url: 'https://www.vaticannews.va' },
    { title: 'L\'Osservatore Romano', url: 'https://www.osservatoreromano.va' },
    { title: 'Catecismo Oficial', url: 'https://www.vatican.va/archive/ccc/index_po.htm' }
  ];

  const formationLinks = [
    { title: 'Corpus Thomisticum', url: 'https://www.corpusthomisticum.org/' },
    { title: 'New Advent (Summa)', url: 'https://www.newadvent.org/summa/' },
    { title: 'ACI Digital', url: 'https://www.acidigital.com' },
    { title: 'Liturgia das Horas', url: 'https://www.liturgiadashoras.org' }
  ];

  const scrollToTop = () => {
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
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
            <p className="text-xs font-serif italic text-stone-500 leading-relaxed max-w-xs">
              "Ex Umbris Et Imaginibus In Veritatem." <br />
              Um apostolado digital dedicado à preservação e ensino do Depósito da Fé através da inteligência teológica avançada.
            </p>
            <div className="flex gap-4 opacity-50">
               <div className="px-3 py-1 border border-white/20 rounded-full text-[7px] font-black uppercase tracking-tighter">SSL Secure</div>
               <div className="px-3 py-1 border border-white/20 rounded-full text-[7px] font-black uppercase tracking-tighter">Offline Ready</div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-gold pl-4">Acesso Direto</h4>
            <nav className="flex flex-col gap-3">
              {[
                { n: 'Bíblia Sagrada', r: AppRoute.BIBLE },
                { n: 'Catecismo da Igreja', r: AppRoute.CATECHISM },
                { n: 'Suma Teológica', r: AppRoute.AQUINAS_OPERA },
                { n: 'Liturgia Diária', r: AppRoute.DAILY_LITURGY },
                { n: 'Investigação IA', r: AppRoute.STUDY_MODE },
                { n: 'Certamen (Quiz)', r: AppRoute.CERTAMEN }
              ].map(item => (
                <button key={item.n} onClick={() => onNavigate(item.r)} className="text-left text-sm hover:text-gold transition-colors uppercase font-bold tracking-tighter text-[11px] opacity-80 hover:opacity-100">{item.n}</button>
              ))}
            </nav>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-sacred pl-4">Fontes da Tradição</h4>
            <nav className="flex flex-col gap-3">
              {vaticanLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2 group">
                  <span className="font-bold text-[11px] tracking-tighter uppercase">{link.title}</span>
                  <Icons.ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
              <div className="h-px w-10 bg-white/10 my-2" />
              {formationLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-sm hover:text-gold transition-colors flex items-center gap-2 group">
                  <span className="font-bold text-[11px] tracking-tighter uppercase opacity-60">{link.title}</span>
                  <Icons.ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </nav>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white border-l-2 border-emerald-500 pl-4">Comunidade</h4>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-4">
              <Icons.Users className="w-8 h-8 text-gold mx-auto opacity-30" />
              <p className="text-[10px] italic text-stone-500 leading-relaxed">
                Este projeto é sustentado por Membros Scholars. Deseja apoiar nossa infraestrutura de IA?
              </p>
              <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="w-full py-3 bg-gold/10 hover:bg-gold text-gold hover:text-stone-900 border border-gold/30 rounded-xl font-black uppercase text-[9px] transition-all">Seja um Apoiador</button>
            </div>
            <div className="flex flex-col gap-1 text-[9px] font-bold text-stone-600">
               <p>CONTATO: suporte@cathedra.digital</p>
               <p>CNBB REGIONAL SUL • PARCEIRO PASTORAL</p>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <p className="text-[9px] text-stone-700 font-bold uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} CATHEDRA DIGITAL • AD MAIOREM DEI GLORIAM
            </p>
            <p className="text-[8px] text-stone-800 font-black uppercase tracking-widest">
              Desenvolvido para uso Eclesial e Acadêmico • v3.5 Production Build
            </p>
          </div>
          <button onClick={scrollToTop} className="p-4 rounded-full bg-white/5 border border-white/10 hover:border-gold/50 shadow-xl transition-all group">
            <Icons.ArrowDown className="w-5 h-5 rotate-180 text-gold group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
