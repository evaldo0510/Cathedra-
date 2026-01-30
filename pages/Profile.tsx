
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { User, StudyResult } from '../types';
import { LangContext } from '../App';
import Progress from '../components/Progress';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onSelectStudy: (study: StudyResult) => void;
  onNavigateCheckout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onSelectStudy, onNavigateCheckout }) => {
  const { handleInstall, installPrompt } = useContext(LangContext);
  const [history, setHistory] = useState<StudyResult[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(Notification.permission === 'granted');

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const toggleNotifications = async () => {
    if (notifEnabled) {
      alert("Para desativar, altere as permissões do seu navegador.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifEnabled(permission === 'granted');
  };

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

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

          <div className="text-center md:text-left space-y-6 flex-1">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h2 className="text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{user.name}</h2>
                <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${user.isPremium ? 'bg-[#d4af37] text-stone-900' : 'bg-stone-200 text-stone-500'}`}>
                  {user.role === 'scholar' || user.isPremium ? 'Membro Scholar' : 'Peregrino'}
                </span>
             </div>
             
             {/* NOVO: Barra de progresso integrada ao cabeçalho do perfil */}
             <div className="max-w-md">
                <Progress percent={user.progress.level * 15} label="Progresso na Trilha Catequética" />
             </div>
             
             <p className="text-[10px] text-stone-300 font-black uppercase tracking-[0.4em]">Membro desde {new Date(user.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div className="flex flex-col gap-3">
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

      {/* Preferências e Notificações */}
      <section className="bg-white dark:bg-stone-900 p-12 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-10">
        <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 border-b border-stone-50 dark:border-stone-800 pb-6 flex items-center gap-4">
          <Icons.Globe className="w-6 h-6 text-[#d4af37]" />
          Preferências do Aplicativo
        </h3>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif font-bold text-stone-900 dark:text-stone-100 text-xl">Notificações Diárias</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Liturgia, Santo e Citações</p>
              </div>
              <button 
                onClick={toggleNotifications}
                className={`w-14 h-7 rounded-full transition-colors relative ${notifEnabled ? 'bg-[#d4af37]' : 'bg-stone-200 dark:bg-stone-800'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${notifEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="p-6 bg-stone-50 dark:bg-stone-800/50 rounded-3xl border border-stone-100 dark:border-stone-700">
              <p className="text-xs font-serif italic text-stone-500">
                {notifEnabled ? 'Você está pronto para receber o alimento espiritual todas as manhãs diretamente no seu dispositivo.' : 'Ative para não perder as atualizações diárias do santuário.'}
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
             <p className="font-serif font-bold text-stone-900 dark:text-stone-100 text-xl">Acesso Nativo</p>
             <div className="flex items-center justify-between gap-4">
               <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isStandalone ? 'text-emerald-500' : 'text-stone-400'}`}>
                    {isStandalone ? 'Aplicativo Instalado' : 'Acesse como App Nativo'}
                  </span>
                  <p className="text-[8px] text-stone-500 mt-1 uppercase">Melhor performance e modo offline</p>
               </div>
               {!isStandalone && (
                 <button 
                  onClick={handleInstall}
                  className="px-6 py-2 bg-gold text-stone-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                 >
                   Instalar
                 </button>
               )}
             </div>
          </div>
        </div>
      </section>

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
    </div>
  );
};

export default Profile;
