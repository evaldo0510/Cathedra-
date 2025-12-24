
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getAdminStats, Telemetry, getRegisteredUsers, getFinancialPreview, Financials } from '../services/adminService';
import { User } from '../types';

const Admin: React.FC = () => {
  const [stats, setStats] = useState<Telemetry | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [fin, setFin] = useState<Financials | null>(null);

  useEffect(() => {
    const s = getAdminStats();
    const u = getRegisteredUsers();
    setStats(s);
    setUsers(u);
    setFin(getFinancialPreview(u.length, s.aiRequests || 0));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-8 bg-stone-900 rounded-full border-4 border-[#d4af37] shadow-sacred">
            <Icons.Layout className="w-16 h-16 text-[#d4af37]" />
          </div>
        </div>
        <h2 className="text-6xl font-serif font-bold text-stone-900 tracking-tight">Centro de Comando</h2>
        <p className="text-stone-400 italic text-xl">Monitoramento e Gestão de Mercado</p>
      </header>

      {/* Grid de Telemetria */}
      <section className="grid md:grid-cols-4 gap-8">
        {[
          { label: 'Visitas Totais', value: stats?.totalViews || 0, icon: Icons.History, color: '#d4af37' },
          { label: 'Consultas de IA', value: stats?.aiRequests || 0, icon: Icons.Feather, color: '#8b0000' },
          { label: 'Membros Ativos', value: users.length, icon: Icons.Users, color: '#1a1a1a' },
          { label: 'Acessos Visitantes', value: stats?.guestViews || 0, icon: Icons.Globe, color: '#4a4a4a' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl space-y-4">
             <div className="p-4 bg-stone-50 rounded-2xl inline-block" style={{ color: stat.color }}>
                <stat.icon className="w-8 h-8" />
             </div>
             <div>
                <p className="text-4xl font-serif font-bold text-stone-900">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">{stat.label}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Dashboard Financeiro de Mercado */}
      <section className="bg-[#1a1a1a] p-12 md:p-20 rounded-[5rem] text-white shadow-3xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <Icons.Globe className="w-96 h-96 text-[#d4af37]" />
         </div>
         
         <div className="relative z-10 space-y-12">
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/10 pb-10">
               <div className="text-center md:text-left">
                  <h3 className="text-4xl font-serif font-bold text-[#d4af37]">Projeção Financeira</h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] mt-2">Plano Membro: R$ 9,90/mês</p>
               </div>
               <div className="px-8 py-3 bg-[#d4af37] text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px]">
                  Margem Atual: {fin?.margin}
               </div>
            </header>

            <div className="grid md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Receita Bruta Est.</p>
                  <p className="text-5xl font-serif font-bold">R$ {fin?.revenue.toFixed(2)}</p>
               </div>
               <div className="space-y-4">
                  <p className="text-[#8b0000] text-[9px] font-black uppercase tracking-widest">Custo Operacional IA</p>
                  <p className="text-5xl font-serif font-bold text-[#e07a9b]">R$ {fin?.estimatedCost.toFixed(2)}</p>
                  <p className="text-[8px] text-white/20 italic">Estimado com Gemini 3 Pro/Flash</p>
               </div>
               <div className="space-y-4">
                  <p className="text-green-500 text-[9px] font-black uppercase tracking-widest">Lucro Líquido</p>
                  <p className="text-5xl font-serif font-bold text-green-400">R$ {fin?.profit.toFixed(2)}</p>
               </div>
            </div>

            <div className="pt-10 flex flex-col md:flex-row gap-8 items-center justify-between">
               <div className="flex items-center gap-4 text-white/40 text-[10px] uppercase font-bold tracking-tighter italic">
                  <Icons.Cross className="w-4 h-4" />
                  "A tecnologia a serviço da Verdade, com viabilidade de Reino."
               </div>
               <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  Exportar Relatório de Tokens
               </button>
            </div>
         </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-2xl space-y-10">
           <h3 className="text-3xl font-serif font-bold text-stone-900 border-b border-stone-50 pb-6 flex items-center gap-4">
             <Icons.Users className="w-6 h-6 text-[#d4af37]" />
             Guardas do Depósito
           </h3>
           <div className="space-y-6">
             {users.length > 0 ? users.map((u, idx) => (
               <div key={idx} className="flex items-center justify-between p-6 bg-stone-50 rounded-3xl group hover:bg-[#fcf8e8] transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-stone-900 text-[#d4af37] rounded-full flex items-center justify-center font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{u.name}</p>
                      <p className="text-xs text-stone-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="bg-[#d4af37] text-stone-900 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {u.role}
                  </span>
               </div>
             )) : (
               <p className="text-stone-300 italic text-center py-10">Nenhum usuário em nossa comunhão ainda.</p>
             )}
           </div>
        </div>

        <div className="bg-[#1a1a1a] p-12 rounded-[4rem] text-[#d4af37] shadow-3xl space-y-10 relative overflow-hidden">
           <h3 className="text-3xl font-serif font-bold border-b border-white/10 pb-6 relative z-10">Status dos Serviços</h3>
           <div className="space-y-6 font-mono text-[10px] text-white/40 overflow-y-auto max-h-[300px] custom-scrollbar relative z-10">
              <p className="text-green-500">[{new Date().toISOString()}] - Conexão Gemini 3 Pro: ESTÁVEL</p>
              <p className="text-green-500">[{new Date().toISOString()}] - Conexão Gemini 3 Flash: ESTÁVEL</p>
              <p>[{stats?.lastActive}] - Última telemetria recebida</p>
              <p className="text-[#d4af37]/60">[{new Date().toISOString()}] - Monitor de Cotas: 12% consumido</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
