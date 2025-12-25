
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { User, StudyResult } from '../types';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onSelectStudy: (study: StudyResult) => void;
  onNavigateCheckout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onSelectStudy, onNavigateCheckout }) => {
  const [history, setHistory] = useState<StudyResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
          <Icons.Users className="w-64 h-64 text-[#d4af37]" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="relative">
            <div className="w-40 h-40 rounded-full border-8 border-[#fcf8e8] dark:border-stone-800 shadow-2xl overflow-hidden">
               <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-5xl font-serif text-[#d4af37]">
                  {user.name.charAt(0)}
               </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#8b0000] text-white p-3 rounded-full border-4 border-white dark:border-stone-900 shadow-lg">
               <Icons.Cross className="w-5 h-5" />
            </div>
          </div>

          <div className="text-center md:text-left space-y-4">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h2 className="text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{user.name}</h2>
                <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${user.isPremium ? 'bg-[#d4af37] text-stone-900' : 'bg-stone-200 text-stone-500'}`}>
                  {user.role === 'scholar' || user.isPremium ? 'Membro Scholar' : 'Peregrino'}
                </span>
             </div>
             <p className="text-stone-400 font-serif italic text-2xl">{user.email}</p>
             <p className="text-[10px] text-stone-300 font-black uppercase tracking-[0.4em]">Membro desde {new Date(user.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div className="md:ml-auto flex flex-col gap-3">
             {!user.isPremium && (
               <button 
                 onClick={onNavigateCheckout}
                 className="px-10 py-4 bg-[#d4af37] text-stone-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
               >
                 Upgrade para Scholar
               </button>
             )}
             <button 
               onClick={onLogout}
               className="px-10 py-4 bg-stone-50 dark:bg-stone-800 text-stone-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-stone-100 dark:border-stone-700 hover:bg-[#8b0000] hover:text-white hover:border-[#8b0000] transition-all active:scale-95"
             >
               Encerrar Sessão
             </button>
          </div>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-8">
         {[
           { label: 'Versículos Salvos', value: user.stats.versesSaved, icon: Icons.Book, color: '#8b0000' },
           { label: 'Estudos Realizados', value: history.length, icon: Icons.Layout, color: '#d4af37' },
           { label: 'Dias de Atividade', value: user.stats.daysActive, icon: Icons.History, color: '#1a1a1a' }
         ].map(stat => (
           <div key={stat.label} className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border border-stone-50 dark:border-stone-800 shadow-xl flex items-center gap-8 group hover:-translate-y-2 transition-all duration-500">
              <div className="p-5 rounded-2xl group-hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: `${stat.color}15` }}>
                 <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
              </div>
              <div>
                 <p className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{stat.value}</p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">{stat.label}</p>
              </div>
           </div>
         ))}
      </section>

      <section className="space-y-10">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-8">
           <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Memorial de Estudos</h3>
           <Icons.History className="w-8 h-8 text-[#d4af37]/40" />
        </div>

        {history.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {history.map((study, idx) => (
              <button 
                key={idx}
                onClick={() => onSelectStudy(study)}
                className="bg-white dark:bg-stone-900 p-12 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-xl text-left group hover:border-[#d4af37] transition-all relative overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                 <div className="relative z-10 space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Quaestio Disputata</span>
                    <h4 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-[#8b0000] transition-colors">{study.topic}</h4>
                    <p className="text-stone-400 font-serif italic text-lg line-clamp-2 leading-relaxed">"{study.summary}"</p>
                 </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-32 bg-stone-50 dark:bg-stone-900/50 rounded-[5rem] border-2 border-dashed border-stone-200 dark:border-stone-800 text-center space-y-6">
             <Icons.History className="w-20 h-20 text-stone-200 dark:text-stone-800 mx-auto" />
             <h4 className="text-2xl font-serif italic text-stone-300 dark:text-stone-600">Nenhum estudo registrado em sua biblioteca privada.</h4>
          </div>
        )}
      </section>

      <footer className="text-center pt-24 border-t border-stone-100 dark:border-stone-800">
         <p className="text-[11px] font-black uppercase tracking-[0.8em] text-stone-200 dark:text-stone-800">Ex Umbris Et Imaginibus In Veritatem</p>
      </footer>
    </div>
  );
};

export default Profile;
