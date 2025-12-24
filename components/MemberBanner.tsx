
import React from 'react';
import { Icons } from '../constants';

interface MemberBannerProps {
  onJoin: () => void;
}

const MemberBanner: React.FC<MemberBannerProps> = ({ onJoin }) => {
  return (
    <div className="bg-white rounded-[4rem] border border-[#d4af37]/30 shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-10 duration-1000">
      <div className="absolute inset-0 bg-gradient-to-r from-[#fcf8e8] via-transparent to-[#fcf8e8] opacity-50" />
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
        <Icons.Cross className="w-64 h-64 text-[#d4af37]" />
      </div>
      
      <div className="relative z-10 p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-shrink-0">
          <div className="p-8 bg-[#1a1a1a] rounded-[2.5rem] shadow-sacred rotate-3 group-hover:rotate-0 transition-transform">
            <Icons.Feather className="w-12 h-12 text-[#d4af37]" />
          </div>
        </div>
        
        <div className="flex-1 text-center lg:text-left space-y-4">
          <h3 className="text-4xl font-serif font-bold text-stone-900 tracking-tight">O Caminho do Estudioso</h3>
          <p className="text-stone-500 font-serif italic text-xl">
            Desbloqueie ferramentas de inteligência para uma compreensão mais profunda da Fé.
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
            {[
              { label: 'Síntese Teológica IA', icon: Icons.Layout },
              { label: 'Disputatio Escolástica', icon: Icons.Feather },
              { label: 'Memorial de Estudos', icon: Icons.History }
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#8b0000]/60">
                <b.icon className="w-4 h-4" />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={onJoin}
          className="px-12 py-6 bg-[#1a1a1a] text-[#d4af37] rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-[#8b0000] hover:text-white transition-all active:scale-95"
        >
          Tornar-me Membro • R$ 9,90
        </button>
      </div>
    </div>
  );
};

export default MemberBanner;
