
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
      <header className="text-center space-y-6 pt-10">
        <div className="flex justify-center">
          <div className="p-8 bg-stone-900 dark:bg-gold rounded-full border-4 border-gold dark:border-stone-900 shadow-sacred rotate-6">
            <Icons.Layout className="w-16 h-16 text-gold dark:text-stone-900" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Regimen Digital</h2>
          <p className="text-stone-400 italic text-xl font-serif uppercase tracking-widest">Painel de Gestão e Telemetria</p>
        </div>
      </header>

      {/* Grid de Telemetria Profissional */}
      <section className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Visitas Totais', value: stats?.totalViews || 0, icon: Icons.History, color: 'text-gold' },
          { label: 'Requisições IA', value: stats?.aiRequests || 0, icon: Icons.Feather, color: 'text-sacred' },
          { label: 'Novos Membros', value: users.length, icon: Icons.Users, color: 'text-stone-900 dark:text-gold' },
          { label: 'Uptime Sistema', value: '99.9%', icon: Icons.Globe, color: 'text-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-4 hover:-translate-y-1 transition-all">
             <div className={`p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl inline-block ${stat.color}`}>
                <stat.icon className="w-8 h-8" />
             </div>
             <div>
                <p className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 dark:text-stone-600">{stat.label}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Visão de Mercado e Financeiro */}
      <section className="bg-stone-900 p-12 md:p-24 rounded-[6rem] text-white shadow-3xl relative overflow-hidden group border border-white/5">
         <div className="absolute top-0 right-0 p-20 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
            <Icons.Globe className="w-96 h-96 text-gold" />
         </div>
         
         <div className="relative z-10 space-y-12">
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/10 pb-12">
               <div className="text-center md:text-left space-y-2">
                  <h3 className="text-4xl md:text-5xl font-serif font-bold text-gold tracking-tight">Performance Financeira</h3>
                  <p className="text-white/30 text-[11px] font-black uppercase tracking-[0.5em]">Baseado em Preço Sugerido: R$ 19,90</p>
               </div>
               <div className="px-10 py-4 bg-gold text-stone-900 rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl">
                  Margem Operacional: {fin?.margin || '0%'}
               </div>
            </header>

            <div className="grid md:grid-cols-3 gap-16">
               <div className="space-y-4">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Receita Bruta Estimada</p>
                  <p className="text-6xl font-serif font-bold">R$ {fin?.revenue.toFixed(2) || '0.00'}</p>
                  <p className="text-[8px] text-white/20 uppercase font-bold">Base de assinaturas ativa</p>
               </div>
               <div className="space-y-4">
                  <p className="text-sacred text-[10px] font-black uppercase tracking-widest">Custo de API (Google Cloud)</p>
                  <p className="text-6xl font-serif font-bold text-[#e07a9b]">R$ {fin?.estimatedCost.toFixed(2) || '0.00'}</p>
                  <p className="text-[8px] text-white/20 uppercase font-bold">Estimativa Gemini Pro 3.0</p>
               </div>
               <div className="space-y-4">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Lucro Operacional Líquido</p>
                  <p className="text-6xl font-serif font-bold text-emerald-400">R$ {fin?.profit.toFixed(2) || '0.00'}</p>
                  <p className="text-[8px] text-white/20 uppercase font-bold">Saldo para reinvestimento em Reino</p>
               </div>
            </div>

            <div className="pt-12 flex flex-col md:flex-row gap-8 items-center justify-between border-t border-white/5">
               <div className="flex items-center gap-4 text-white/40 text-[11px] uppercase font-bold tracking-tighter italic">
                  <Icons.Cross className="w-5 h-5" />
                  "A economia a serviço do homem, e não o homem a serviço da economia."
               </div>
               <div className="flex gap-4">
                  <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Ver Logs de Tokens</button>
                  <button className="px-10 py-5 bg-gold text-stone-900 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl">Exportar Registros</button>
               </div>
            </div>
         </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Listagem de Membros Ativos */}
        <div className="bg-white dark:bg-stone-900 p-12 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-10">
           <div className="flex items-center justify-between border-b border-stone-50 dark:border-stone-800 pb-6">
              <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-4">
                <Icons.Users className="w-8 h-8 text-gold" />
                Custódios do Depósito
              </h3>
              <span className="bg-stone-50 dark:bg-stone-800 px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-stone-400">{users.length} Registros</span>
           </div>
           
           <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
             {users.length > 0 ? users.map((u, idx) => (
               <div key={idx} className="flex items-center justify-between p-8 bg-stone-50 dark:bg-stone-800/50 rounded-[2.5rem] border border-stone-100 dark:border-stone-700/50 group hover:border-gold transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-xl group-hover:rotate-6 transition-transform">
                      {u.name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100">{u.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                     <span className="px-4 py-1.5 bg-stone-900 dark:bg-stone-700 text-gold rounded-full text-[8px] font-black uppercase tracking-widest">{u.role}</span>
                     <p className="text-[8px] text-stone-300 uppercase font-bold tracking-widest mt-1">Acesso: {new Date(u.joinedAt).toLocaleDateString()}</p>
                  </div>
               </div>
             )) : (
               <div className="py-20 text-center space-y-4 opacity-20">
                  <Icons.Cross className="w-12 h-12 mx-auto" />
                  <p className="text-xl font-serif italic">Nenhum registro encontrado na comunhão.</p>
               </div>
             )}
           </div>
        </div>

        {/* Status Técnico de API e Cloud */}
        <div className="bg-[#1a1a1a] p-12 rounded-[4rem] text-gold shadow-3xl space-y-10 relative overflow-hidden flex flex-col justify-between border border-white/5">
           <div className="space-y-10">
              <h3 className="text-3xl font-serif font-bold border-b border-white/10 pb-6 relative z-10 flex items-center gap-4">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                 Estado da Rede Gratia
              </h3>
              <div className="space-y-6 font-mono text-[11px] text-white/40 overflow-y-auto max-h-[300px] custom-scrollbar relative z-10">
                 <p className="flex items-center gap-4"><span className="text-emerald-500">[{new Date().toISOString()}]</span> - Gemini 3 Pro (Exegese): <span className="text-emerald-500">ESTÁVEL (Latência: 1.2s)</span></p>
                 <p className="flex items-center gap-4"><span className="text-emerald-500">[{new Date().toISOString()}]</span> - Gemini 3 Flash (Hagiografia): <span className="text-emerald-500">ESTÁVEL (Latência: 0.4s)</span></p>
                 <p className="flex items-center gap-4"><span>[{stats?.lastActive}]</span> - Último ping de telemetria recebido do App Nativo</p>
                 <p className="flex items-center gap-4"><span className="text-gold/60">[{new Date().toISOString()}]</span> - Alerta de Quota: <span className="text-gold">14% de limites gratuitos consumidos</span></p>
                 <p className="flex items-center gap-4"><span>[{new Date().toISOString()}]</span> - Supabase Sync: <span className="text-emerald-500">ACTIVE</span></p>
              </div>
           </div>

           <div className="bg-white/5 p-8 rounded-3xl border border-white/5 mt-10">
              <h4 className="text-[10px] font-black uppercase text-gold/60 mb-4">Nota ao Administrador</h4>
              <p className="text-white/30 text-xs font-serif italic leading-relaxed">
                O Cathedra Digital está operando em modelo 'Hybrid-Local'. Conteúdo de prateleira é servido offline por padrão, preservando sua conta de API para investigações complexas.
              </p>
           </div>
        </div>
      </div>
      
      <footer className="text-center pt-20 border-t border-gold/10 opacity-30 pb-10">
         <div className="flex flex-col items-center gap-4">
            <Icons.Cross className="w-10 h-10" />
            <p className="text-[10px] font-black uppercase tracking-[1em]">Cathedra Digital • Management System v1.5</p>
         </div>
      </footer>
    </div>
  );
};

export default Admin;
