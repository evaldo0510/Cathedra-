
import React from 'react';
import { Icons } from '../constants';
import { AppRoute } from '../types';

const Footer: React.FC<{ onNavigate: (r: AppRoute) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-900 mt-20 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Coluna 1: Branding */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-stone-900 dark:bg-[#d4af37] rounded-xl shadow-lg">
                <Icons.Cross className="w-5 h-5 text-[#d4af37] dark:text-stone-900" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white tracking-tighter">Cathedra</h3>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-serif italic leading-relaxed">
              O Santuário Digital da Tradição Católica. Inteligência teológica a serviço do Magistério e da vida espiritual dos fiéis.
            </p>
            <div className="flex gap-4">
              <button className="p-2 text-stone-400 hover:text-[#d4af37] transition-colors"><Icons.Globe className="w-5 h-5" /></button>
              <button className="p-2 text-stone-400 hover:text-[#d4af37] transition-colors"><Icons.Users className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Coluna 2: Navegação Interna */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37]">Navegação</h4>
            <ul className="space-y-4">
              <li><button onClick={() => onNavigate(AppRoute.STUDY_MODE)} className="text-sm text-stone-500 hover:text-[#8b0000] transition-colors">Estudo Relacional</button></li>
              <li><button onClick={() => onNavigate(AppRoute.BIBLE)} className="text-sm text-stone-500 hover:text-[#8b0000] transition-colors">Sagrada Escritura</button></li>
              <li><button onClick={() => onNavigate(AppRoute.CATECHISM)} className="text-sm text-stone-500 hover:text-[#8b0000] transition-colors">Catecismo Oficial</button></li>
              <li><button onClick={() => onNavigate(AppRoute.SAINTS)} className="text-sm text-stone-500 hover:text-[#8b0000] transition-colors">Vida dos Santos</button></li>
            </ul>
          </div>

          {/* Coluna 3: Referências Oficiais (Vaticano) */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37]">Referências Oficiais</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://www.vatican.va" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#8b0000] transition-colors">
                  <Icons.ExternalLink className="w-3 h-3" /> A Santa Sé (Vaticano)
                </a>
              </li>
              <li>
                <a href="https://www.vaticannews.va/pt.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#8b0000] transition-colors">
                  <Icons.ExternalLink className="w-3 h-3" /> Vatican News
                </a>
              </li>
              <li>
                <a href="https://www.cnbb.org.br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#8b0000] transition-colors">
                  <Icons.ExternalLink className="w-3 h-3" /> CNBB
                </a>
              </li>
              <li>
                <a href="https://acidigital.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#8b0000] transition-colors">
                  <Icons.ExternalLink className="w-3 h-3" /> ACI Digital
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Suporte e Doações */}
          <div className="bg-[#fcf8e8] dark:bg-stone-900 p-8 rounded-[2.5rem] border border-[#d4af37]/20">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b0000] dark:text-[#d4af37] mb-4">Apoie o Projeto</h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              Ajude-nos a manter os servidores do Santuário Digital ativos e gratuitos para todos.
            </p>
            <button 
              onClick={() => onNavigate(AppRoute.CHECKOUT)}
              className="w-full py-3 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg active:scale-95 transition-all"
            >
              Fazer uma Oferta
            </button>
          </div>
        </div>

        <div className="pt-12 border-t border-stone-100 dark:border-stone-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">
            Ad Maiorem Dei Gloriam
          </p>
          <div className="flex gap-8">
            <button className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-[#d4af37]">Termos</button>
            <button className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-[#d4af37]">Privacidade</button>
            <button className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-[#d4af37]">Cookies</button>
          </div>
          <p className="text-[9px] text-stone-400">© {new Date().getFullYear()} Cathedra Digital Sanctuarium. Todos os direitos reservados.</p>
        </div>
      </div>
      
      {/* Detalhe Decorativo Inferior */}
      <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
    </footer>
  );
};

export default Footer;
