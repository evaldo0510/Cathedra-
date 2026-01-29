
import React, { useState } from 'react';
import { Icons } from '../constants';
import { User, AppRoute } from '../types';

interface CommunityProps {
  user: User | null;
  onNavigateLogin: () => void;
}

const Community: React.FC<CommunityProps> = ({ user, onNavigateLogin }) => {
  // Simulação de Gating de Plano Pago
  const isPremium = user?.isPremium || user?.role === 'admin';

  if (!isPremium) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-1000">
        <div className="p-10 bg-white dark:bg-stone-900 rounded-[4rem] shadow-4xl border border-gold/20 text-center space-y-8 max-w-3xl">
           <div className="flex justify-center">
              <div className="p-8 bg-sacred rounded-3xl rotate-3 shadow-2xl">
                 <Icons.Users className="w-16 h-16 text-white" />
              </div>
           </div>
           <div className="space-y-4">
              <h2 className="text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">Círculo de Diálogo Exclusivo</h2>
              <p className="text-2xl font-serif italic text-stone-400 max-w-xl mx-auto leading-relaxed">
                "Onde dois ou três estiverem reunidos..." A Aula Magna e as Disputationes comunitárias são recursos exclusivos para nossos **Membros Scholars**.
              </p>
           </div>
           <div className="grid md:grid-cols-2 gap-4 pt-6">
              <div className="p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl text-left border border-stone-100 dark:border-stone-700">
                 <Icons.Audio className="w-6 h-6 text-gold mb-3" />
                 <h4 className="font-serif font-bold text-lg">Aulas Multimídia</h4>
                 <p className="text-[10px] text-stone-500 uppercase mt-1">Sessões profundas com IA Live</p>
              </div>
              <div className="p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl text-left border border-stone-100 dark:border-stone-700">
                 <Icons.Message className="w-6 h-6 text-gold mb-3" />
                 <h4 className="font-serif font-bold text-lg">Fórum de Disputa</h4>
                 <p className="text-[10px] text-stone-500 uppercase mt-1">Debates teológicos moderados</p>
              </div>
           </div>
           <button 
            onClick={() => window.location.href = AppRoute.CHECKOUT}
            className="w-full py-6 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all"
           >
             Fazer Upgrade para Scholar • R$ 19,90/mês
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
       {/* Conteúdo da Comunidade para usuários Premium */}
       <header className="text-center space-y-6">
          <h2 className="text-6xl font-serif font-bold">Aula Magna</h2>
          <p className="text-stone-400 italic text-2xl">A comunhão dos santos no ambiente digital.</p>
       </header>
       <div className="bg-white dark:bg-stone-900 p-20 rounded-[4rem] text-center border-2 border-dashed border-gold/30">
          <Icons.Users className="w-20 h-20 text-gold mx-auto mb-8 animate-pulse" />
          <p className="text-3xl font-serif italic text-stone-400">Ambiente de membros em fase final de preparação.</p>
       </div>
    </div>
  );
};

export default Community;