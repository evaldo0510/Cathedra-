
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getAdminStats, Telemetry, getRegisteredUsers, getFinancialPreview, Financials, updatePartnersList } from '../services/adminService';
import { User } from '../types';

const Admin: React.FC = () => {
  const [stats, setStats] = useState<Telemetry | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [newPartner, setNewPartner] = useState('');

  useEffect(() => {
    const s = getAdminStats();
    const u = getRegisteredUsers();
    setStats(s);
    setUsers(u);
    setPartners(JSON.parse(localStorage.getItem('cathedra_partners') || '["CNBB", "Vaticano", "Academia IA", "Teologia Online"]'));
  }, []);

  const handleAddPartner = () => {
    if (!newPartner.trim()) return;
    const next = [...partners, newPartner.trim()];
    setPartners(next);
    updatePartnersList(next);
    setNewPartner('');
  };

  const handleRemovePartner = (idx: number) => {
    const next = partners.filter((_, i) => i !== idx);
    setPartners(next);
    updatePartnersList(next);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      <header className="bg-stone-900 p-10 md:p-16 rounded-[4rem] border border-gold/20 shadow-4xl text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <div className="relative z-10 space-y-4">
           <Icons.Layout className="w-16 h-16 text-gold mx-auto mb-4" />
           <h2 className="text-5xl font-serif font-bold text-white tracking-tight">Painel do Diretor</h2>
           <p className="text-gold/60 font-serif italic text-xl uppercase tracking-widest">Gestão do Santuário Digital</p>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-xl border border-stone-100 dark:border-white/5 space-y-4">
           <Icons.Users className="w-8 h-8 text-gold" />
           <p className="text-4xl font-serif font-bold">{users.length}</p>
           <p className="text-[10px] font-black uppercase text-stone-400">Total de Cadastros</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-xl border border-stone-100 dark:border-white/5 space-y-4">
           <Icons.Feather className="w-8 h-8 text-sacred" />
           <p className="text-4xl font-serif font-bold">{stats?.aiRequests || 0}</p>
           <p className="text-[10px] font-black uppercase text-stone-400">Consultas de IA Efetuadas</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-xl border border-stone-100 dark:border-white/5 space-y-4">
           <Icons.Globe className="w-8 h-8 text-emerald-500" />
           <p className="text-4xl font-serif font-bold">100%</p>
           <p className="text-[10px] font-black uppercase text-stone-400">Integridade do Sistema</p>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* LISTA DE USUÁRIOS */}
        <div className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] shadow-2xl border border-stone-100 dark:border-white/5">
           <h3 className="text-2xl font-serif font-bold mb-8 flex items-center gap-4">
             <Icons.Users className="w-6 h-6 text-gold" />
             Custódios da Fé (Membros)
           </h3>
           <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
              {users.map((u, i) => (
                <div key={i} className="p-6 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-900 text-gold rounded-xl flex items-center justify-center font-bold">{u.name.charAt(0)}</div>
                      <div>
                        <p className="font-serif font-bold text-stone-800 dark:text-stone-100">{u.name}</p>
                        <p className="text-[10px] text-stone-400 uppercase">{u.email}</p>
                      </div>
                   </div>
                   <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-sacred text-white' : u.role === 'scholar' ? 'bg-gold text-stone-900' : 'bg-stone-200 text-stone-500'}`}>{u.role}</span>
                </div>
              ))}
           </div>
        </div>

        {/* GESTÃO DE PARCEIROS */}
        <div className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] shadow-2xl border border-stone-100 dark:border-white/5 space-y-8">
           <h3 className="text-2xl font-serif font-bold flex items-center gap-4">
             <Icons.Globe className="w-6 h-6 text-emerald-500" />
             Gestão de Parceiros
           </h3>
           <div className="flex gap-2">
              <input 
                type="text" 
                value={newPartner}
                onChange={e => setNewPartner(e.target.value)}
                placeholder="Novo Parceiro de Apoio..."
                className="flex-1 px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl outline-none"
              />
              <button onClick={handleAddPartner} className="px-8 py-4 bg-gold text-stone-950 rounded-2xl font-black uppercase text-[10px]">Add</button>
           </div>
           <div className="grid grid-cols-2 gap-3">
              {partners.map((p, i) => (
                <div key={i} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-between group">
                   <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{p}</span>
                   <button onClick={() => handleRemovePartner(i)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icons.Cross className="w-4 h-4 rotate-45" />
                   </button>
                </div>
              ))}
           </div>
           <p className="text-[9px] text-stone-400 italic">Alterações refletem instantaneamente no rodapé do santuário.</p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
