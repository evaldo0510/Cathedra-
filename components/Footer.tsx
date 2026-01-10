
import React from 'react';
import { Icons, Logo } from '../constants';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-900 mt-auto overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Coluna 1: Branding & Identidade */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-stone-900 dark:bg-gold rounded-xl shadow-lg transition-transform hover:rotate-3">
                <Logo className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-tighter">Cathedra</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gold/60">Sanctuarium Digitale</p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-serif italic leading-relaxed">
              Plataforma de inteligência teológica dedicada à preservação e difusão do Depósito da Fé no ambiente digital.
            </p>
            <div className="flex gap-4 pt-2">
              <button className="p-3 bg-stone-50 dark:bg-stone-900 text-stone-400 hover:text-gold rounded-full transition-all hover:scale-110 shadow-sm border border-stone-100 dark:border-stone-800">
                <Icons.Globe className="w-4 h-4" />
              </button>
              <button className="p-3 bg-stone-50 dark:bg-stone-900 text-stone-400 hover:text-gold rounded-full transition-all hover:scale-110 shadow-sm border border-stone-100 dark:border-stone-800">
                <Icons.Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Coluna 2: Navegação Sacra */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred dark:text-gold">Navegação</h4>
            <ul className="space-y-4">
              {[
                { name: 'Sagradas Escrituras', route: AppRoute.BIBLE },
                { name: 'Catecismo Oficial', route: AppRoute.CATECHISM },
                { name: 'Liturgia Diária', route: AppRoute.DAILY_LITURGY },
                { name: 'Certamen (Quiz)', route: AppRoute.CERTAMEN },
                { name: 'Vida dos Santos', route: AppRoute.SAINTS },
                { name: 'Opera Omnia', route: AppRoute.AQUINAS_OPERA },
              ].map((link) => (
                <li key={link.name}>
                  <button 
                    onClick={() => onNavigate(link.route)} 
                    className="text-sm text-stone-500 dark:text-stone-400 hover:text-sacred dark:hover:text-gold transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Referências Oficiais da Igreja */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred dark:text-gold">Referências Oficiais</h4>
            <ul className="space-y-4">
              {[
                { name: 'A Santa Sé (Vaticano)', url: 'https://www.vatican.va' },
                { name: 'Vatican News', url: 'https://www.vaticannews.va/pt.html' },
                { name: 'CNBB Brasil', url: 'https://www.cnbb.org.br' },
                { name: 'ACI Digital', url: 'https://acidigital.com' },
                { name: 'Dicionário Teológico', url: '#' },
              ].map((ref) => (
                <li key={ref.name}>
                  <a 
                    href={ref.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400 hover:text-sacred dark:hover:text-gold transition-colors group"
                  >
                    <Icons.ExternalLink className="w-3.5 h-3.5 text-stone-300 dark:text-stone-700 group-hover:text-gold" /> 
                    {ref.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Suporte e Filantropia */}
          <div className="space-y-8">
            <div className="bg-[#fcf8e8] dark:bg-stone-900 p-8 rounded-[2.5rem] border border-gold/20 shadow-xl relative overflow-hidden group">
              <Icons.Cross className="absolute -bottom-6 -right-6 w-24 h-24 text-gold/5 group-hover:rotate-12 transition-transform duration-1000" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b0000] dark:text-gold mb-4">Apoie o Santuário</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed font-serif italic">
                Sua generosidade mantém nossos servidores ativos e a inteligência teológica gratuita para todos os peregrinos.
              </p>
              <button 
                onClick={() => onNavigate(AppRoute.CHECKOUT)}
                className="w-full py-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                Fazer uma Oferta
              </button>
            </div>
            
            <div className="flex items-center gap-4 px-4 opacity-50">
               <Icons.Mobile className="w-5 h-5 text-stone-400" />
               <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">PWA Ativo • v5.2.0</p>
            </div>
          </div>
        </div>

        {/* Linha Final: Legal & Copyright */}
        <div className="pt-12 border-t border-stone-100 dark:border-stone-900 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-300 dark:text-stone-700">
              Ad Maiorem Dei Gloriam
            </p>
            <p className="text-[9px] text-stone-400">© {new Date().getFullYear()} Cathedra Digital. Desenvolvido para a Nova Evangelização.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {['Termos de Uso', 'Privacidade', 'Cookies', 'Segurança'].map(legal => (
              <button key={legal} className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-colors">{legal}</button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Detalhe Decorativo de Fundo */}
      <div className="h-2 w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-50" />
    </footer>
  );
};

export default Footer;
