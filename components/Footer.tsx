
import React from 'react';
import { Icons, Logo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const vaticanLinks = [
    { title: 'Santa Sé (Vaticano)', url: 'https://www.vatican.va' },
    { title: 'Catecismo da Igreja', url: 'https://www.vatican.va/archive/ccc/index_po.htm' },
    { title: 'Nova Vulgata Latina', url: 'https://www.vatican.va/archive/bible/nova_vulgata/documents/nova-vulgata_index_lt.html' },
    { title: 'CNBB Brasil', url: 'https://www.cnbb.org.br' }
  ];

  const partners = [
    { name: 'Academia de Letras Cristãs', icon: '📜' },
    { name: 'Instituto Tomista', icon: '✍️' },
    { name: 'Schola Cantorum', icon: '🎵' },
    { name: 'Vatican Media', icon: '🏛️' }
  ];

  const scrollToTop = () => {
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#080706] text-stone-400 border-t border-white/5 pt-24 pb-12 px-6 relative overflow-hidden mt-auto">
      {/* Textura de fundo sutil */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* 1. SEÇÃO INSTITUCIONAL: MISSÃO, VISÃO, VALORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24 pb-16 border-b border-white/5">
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-gold">
                 <Icons.Star className="w-5 h-5 fill-current" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Missão</h4>
              </div>
              <p className="text-lg font-serif italic text-stone-300 leading-relaxed">
                "Propagar o Depósito da Fé através da síntese entre a Tradição e a tecnologia, iluminando a inteligência dos fiéis."
              </p>
           </div>
           
           <div className="space-y-6 md:border-x border-white/5 md:px-12">
              <div className="flex items-center gap-3 text-gold">
                 <Icons.Globe className="w-5 h-5" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Visão</h4>
              </div>
              <p className="text-lg font-serif italic text-stone-300 leading-relaxed">
                "Tornar-se a referência global em curadoria teológica digital, unindo erudição escolástica e acessibilidade moderna."
              </p>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3 text-gold">
                 <Icons.Cross className="w-5 h-5" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Valores</h4>
              </div>
              <ul className="space-y-3">
                 {['Fidelidade ao Magistério', 'Rigor Intelectual', 'Excelência Técnica', 'Caridade na Verdade'].map(v => (
                   <li key={v} className="flex items-center gap-3 text-sm font-serif text-stone-500">
                      <div className="w-1 h-1 rounded-full bg-sacred shadow-[0_0_8px_#8b0000]" />
                      {v}
                   </li>
                 ))}
              </ul>
           </div>
        </div>

        {/* 2. SITEMAP E NAVEGAÇÃO DE PRODUTO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-24">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <Logo className="w-16 h-16 border border-white/10 p-2 rounded-2xl bg-white/5 shadow-2xl" />
              <div>
                <h3 className="text-2xl font-serif font-bold text-white tracking-widest leading-none">CATHEDRA</h3>
                <p className="text-[9px] font-black uppercase text-gold mt-1 tracking-[0.3em]">Digital Sanctuarium</p>
              </div>
            </div>
            <p className="text-sm font-serif italic text-stone-500 leading-relaxed max-w-sm">
              "Ex Umbris Et Imaginibus In Veritatem." <br />
              Unindo a sabedoria milenar à Inteligência Teológica para o crescimento espiritual e intelectual.
            </p>
            <div className="flex gap-4 opacity-30">
               <div className="px-3 py-1 border border-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">v4.5 PRO</div>
               <div className="px-3 py-1 border border-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">SSL SECURE</div>
            </div>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white border-l-2 border-sacred pl-4">Formação</h4>
             <nav className="flex flex-col gap-3">
                <button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Bíblia Sagrada</button>
                <button onClick={() => onNavigate(AppRoute.CATECHISM)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Catecismo (CIC)</button>
                <button onClick={() => onNavigate(AppRoute.TRILHAS)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Trilhas de Estudo</button>
                <button onClick={() => onNavigate(AppRoute.MAGISTERIUM)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Magistério</button>
             </nav>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white border-l-2 border-gold pl-4">Liturgia</h4>
             <nav className="flex flex-col gap-3">
                <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Liturgia Diária</button>
                <button onClick={() => onNavigate(AppRoute.MISSAL)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Missal Romano</button>
                <button onClick={() => onNavigate(AppRoute.ROSARY)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Santo Rosário</button>
                <button onClick={() => onNavigate(AppRoute.VIA_CRUCIS)} className="text-left text-xs hover:text-gold transition-colors font-bold opacity-60 hover:opacity-100 uppercase">Via Crucis</button>
             </nav>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60 border-l-2 border-white/20 pl-4">Restrito (Admin)</h4>
             <nav className="flex flex-col gap-3">
                <button className="text-left text-[10px] hover:text-sacred transition-colors font-bold opacity-50 hover:opacity-100 uppercase">Dashboard Geral</button>
                <button className="text-left text-[10px] hover:text-sacred transition-colors font-bold opacity-50 hover:opacity-100 uppercase">Gestão Bíblica</button>
                <button className="text-left text-[10px] hover:text-sacred transition-colors font-bold opacity-50 hover:opacity-100 uppercase">Parágrafos CIC</button>
                <button className="text-left text-[10px] hover:text-sacred transition-colors font-bold opacity-50 hover:opacity-100 uppercase">Documentos</button>
                <button className="text-left text-[10px] hover:text-sacred transition-colors font-bold opacity-50 hover:opacity-100 uppercase">Módulos de Trilha</button>
                <button className="text-left text-[10px] hover:text-sacred transition-colors font-bold opacity-50 hover:opacity-100 uppercase">Nexus Theologicus</button>
             </nav>
          </div>
        </div>

        {/* 3. SEÇÃO DE APOIO E REFERÊNCIAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 pt-12 border-t border-white/5">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Fontes Oficiais da Sé</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vaticanLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-[10px] hover:text-gold transition-colors flex items-center gap-2 group uppercase font-bold tracking-tighter opacity-50 hover:opacity-100">
                  <span>{link.title}</span>
                  <Icons.ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Parcerias e Apoio</h4>
            <div className="flex flex-wrap gap-4">
               {partners.map((p, idx) => (
                 <div key={idx} className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 grayscale hover:grayscale-0 transition-all cursor-default group hover:border-gold/30">
                    <span className="text-lg group-hover:scale-110 transition-transform">{p.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">{p.name}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* 4. FOOTER FINAL BAR */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <p className="text-[9px] text-stone-700 font-bold uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} CATHEDRA DIGITAL • AD MAIOREM DEI GLORIAM
            </p>
            <div className="flex items-center gap-4 justify-center md:justify-start">
               <button onClick={() => onNavigate(AppRoute.ABOUT)} className="text-[8px] text-stone-800 font-black uppercase hover:text-gold transition-colors">Manifesto</button>
               <div className="w-1 h-1 rounded-full bg-stone-900" />
               <button className="text-[8px] text-stone-800 font-black uppercase hover:text-gold transition-colors">Termos de Uso</button>
               <div className="w-1 h-1 rounded-full bg-stone-900" />
               <button className="text-[8px] text-stone-800 font-black uppercase hover:text-gold transition-colors">Suporte</button>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end hidden md:block">
                <p className="text-[8px] font-black uppercase text-stone-700 tracking-widest">Desenvolvimento</p>
                <p className="text-[10px] font-serif italic text-stone-500">Ex Umbris In Veritatem</p>
             </div>
             <button onClick={scrollToTop} className="p-4 rounded-full bg-white/5 border border-white/10 hover:border-gold/50 shadow-xl transition-all group hover:scale-110">
               <Icons.ArrowDown className="w-5 h-5 rotate-180 text-gold group-hover:-translate-y-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
