
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getAdminStats, Telemetry, getRegisteredUsers } from '../services/adminService';

const Stat: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = "text-gold" }) => (
  <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl group hover:border-gold/30 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <Icons.ArrowDown className="w-4 h-4 -rotate-90 text-stone-200 opacity-0 group-hover:opacity-100 transition-all" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">{title}</p>
    <p className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{value}</p>
  </div>
);

export function VerseForm() {
  return (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-6">
      <header className="flex items-center gap-4 border-b border-stone-50 dark:border-stone-800 pb-4">
        <div className="p-3 bg-stone-900 rounded-xl"><Icons.Book className="w-5 h-5 text-gold" /></div>
        <h3 className="text-xl font-serif font-bold">Scriptorium: Bíblia</h3>
      </header>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-3 gap-4">
          <input placeholder="Livro" className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all" />
          <input type="number" placeholder="Cap." className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all" />
          <input type="number" placeholder="Ver." className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all" />
        </div>
        <textarea placeholder="Texto do versículo..." rows={3} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-2xl outline-none focus:border-gold transition-all font-serif italic" />
        <button className="w-full py-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:scale-[1.02] transition-all">Salvar Versículo</button>
      </form>
    </div>
  );
}

export function CatechismForm() {
  return (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-6">
      <header className="flex items-center gap-4 border-b border-stone-50 dark:border-stone-800 pb-4">
        <div className="p-3 bg-sacred rounded-xl"><Icons.Cross className="w-5 h-5 text-white" /></div>
        <h3 className="text-xl font-serif font-bold">Scriptorium: CIC</h3>
      </header>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="Parágrafo (§)" className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all" />
          <select className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all text-[10px] font-bold uppercase">
            <option>Profissão de Fé</option>
            <option>Sacramentos</option>
            <option>Vida Moral</option>
            <option>Oração</option>
          </select>
        </div>
        <input placeholder="Título do Parágrafo" className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all" />
        <textarea placeholder="Texto Doutrinário..." rows={3} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-2xl outline-none focus:border-gold transition-all font-serif" />
        <button className="w-full py-4 bg-sacred text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:scale-[1.02] transition-all">Salvar Parágrafo</button>
      </form>
    </div>
  );
}

export function DocumentForm() {
  return (
    <div className="bg-stone-900 p-8 rounded-[3rem] border border-gold/20 shadow-2xl space-y-6">
      <header className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="p-3 bg-gold rounded-xl"><Icons.Globe className="w-5 h-5 text-stone-900" /></div>
        <h3 className="text-xl font-serif font-bold text-white">Magistério: Documentos</h3>
      </header>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Título do Documento (Ex: Lumen Gentium)" className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 text-white rounded-xl outline-none focus:border-gold transition-all" />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Tipo (Encíclica, Concílio...)" className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 text-white rounded-xl outline-none focus:border-gold transition-all" />
          <input type="number" placeholder="Ano de Proclamação" className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 text-white rounded-xl outline-none focus:border-gold transition-all" />
        </div>
        <textarea placeholder="Conteúdo Integral ou Resumo..." rows={4} className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 text-white rounded-2xl outline-none focus:border-gold transition-all font-serif italic text-sm" />
        <button className="w-full py-4 bg-gold text-stone-900 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:bg-white transition-all">Salvar no Arquivo</button>
      </form>
    </div>
  );
}

export function TrailForm() {
  return (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-6">
      <header className="flex items-center gap-4 border-b border-stone-50 dark:border-stone-800 pb-4">
        <div className="p-3 bg-emerald-600 rounded-xl"><Icons.History className="w-5 h-5 text-white" /></div>
        <h3 className="text-xl font-serif font-bold">Scriptorium: Trilhas</h3>
      </header>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Nome da Trilha Formativa" className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all font-bold" />
        <textarea placeholder="Descrição da jornada espiritual..." rows={3} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-2xl outline-none focus:border-gold transition-all font-serif italic" />
        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase text-stone-500 ml-2 tracking-widest">Nível de Rigor</label>
          <select className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all text-[10px] font-bold uppercase">
            <option>Iniciante</option>
            <option>Intermediário</option>
            <option>Avançado</option>
          </select>
        </div>
        <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:bg-emerald-700 transition-all">Criar Nova Trilha</button>
      </form>
    </div>
  );
}

export function ReferenceForm() {
  return (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-6">
      <header className="flex items-center gap-4 border-b border-stone-50 dark:border-stone-800 pb-4">
        <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl"><Icons.Layout className="w-5 h-5 text-gold" /></div>
        <h3 className="text-xl font-serif font-bold">Nexus Theologicus</h3>
      </header>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-stone-500 ml-2">Origem</label>
                 <select className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all text-[10px] font-bold uppercase">
                   <option>Bíblia</option>
                   <option>Catecismo</option>
                   <option>Documento</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-stone-500 ml-2">Ref. Origem</label>
                 <input placeholder="Ex: Jo 1,1" className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all text-xs" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-stone-500 ml-2">Destino</label>
                 <select className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all text-[10px] font-bold uppercase">
                   <option>Catecismo</option>
                   <option>Documento</option>
                   <option>Bíblia</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-stone-500 ml-2">Ref. Destino</label>
                 <input placeholder="Ex: §52" className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-xl outline-none focus:border-gold transition-all text-xs" />
              </div>
           </div>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase text-stone-500 ml-2">Descrição da Relação</label>
          <textarea placeholder="Explique o nexo teológico entre as fontes..." rows={2} className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-2xl outline-none focus:border-gold transition-all font-serif italic text-xs" />
        </div>
        
        <button className="w-full py-4 bg-stone-900 dark:bg-stone-700 text-gold dark:text-stone-100 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:scale-[1.02] transition-all">Conectar Conteúdos</button>
      </form>
    </div>
  );
}

const Admin: React.FC = () => {
  const [stats, setStats] = useState<Telemetry | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    setStats(getAdminStats());
    setUsers(getRegisteredUsers());
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-48 animate-in fade-in duration-1000">
      <header className="bg-stone-900 p-12 rounded-[4rem] border border-gold/20 shadow-4xl text-center relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <div className="relative z-10 space-y-4">
           <Icons.Layout className="w-16 h-16 text-gold mx-auto mb-4" />
           <h2 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tighter">Painel Administrativo</h2>
           <p className="text-gold font-serif italic text-lg tracking-widest uppercase">Gestão do Depósito da Fé</p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat title="Livros Bíblicos" value="73" icon={<Icons.Book className="w-5 h-5" />} />
        <Stat title="Parágrafos CIC" value="2865" icon={<Icons.Cross className="w-5 h-5" />} color="text-sacred" />
        <Stat title="Documentos" value="42" icon={<Icons.Globe className="w-5 h-5" />} color="text-blue-500" />
        <Stat title="Trilhas Formativas" value="6" icon={<Icons.History className="w-5 h-5" />} color="text-emerald-500" />
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        <VerseForm />
        <CatechismForm />
        <DocumentForm />
        <TrailForm />
        <ReferenceForm />
        
        <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800 lg:col-span-1">
           <h3 className="text-2xl font-serif font-bold mb-8 flex items-center gap-4">
             <Icons.Users className="w-6 h-6 text-gold" />
             Telemetria de Sistema
           </h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
                 <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Total Views</p>
                 <p className="text-xl font-serif font-bold">{stats?.totalViews || 0}</p>
              </div>
              <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
                 <p className="text-[8px] font-black uppercase text-stone-400 mb-1">IA Requests</p>
                 <p className="text-xl font-serif font-bold text-gold">{stats?.aiRequests || 0}</p>
              </div>
              <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
                 <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Membros</p>
                 <p className="text-xl font-serif font-bold text-sacred">{stats?.memberViews || 0}</p>
              </div>
              <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
                 <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Visitantes</p>
                 <p className="text-xl font-serif font-bold">{stats?.guestViews || 0}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
