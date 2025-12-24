
import React, { useState } from 'react';
import { Icons } from '../constants';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      // Regra de Admin para teste (Email: admin@cathedra.com)
      const isAdmin = email === 'admin@cathedra.com';
      
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: isAdmin ? 'Administrador' : (isRegister ? name : email.split('@')[0]),
        email: email,
        role: isAdmin ? 'admin' : 'scholar',
        joinedAt: new Date().toISOString(),
        stats: {
          versesSaved: 0,
          studiesPerformed: 0,
          daysActive: 1
        }
      };
      
      localStorage.setItem('cathedra_user', JSON.stringify(mockUser));
      onLogin(mockUser);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="w-full max-w-xl bg-white rounded-[4.5rem] shadow-3xl border border-stone-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-3 bg-[#d4af37]" />
        
        <div className="p-12 md:p-20 space-y-12">
          <header className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred relative group">
                <Icons.Cross className="w-12 h-12 text-[#8b0000] relative z-10 group-hover:rotate-180 transition-transform duration-1000" />
              </div>
            </div>
            <h2 className="text-5xl font-serif font-bold text-stone-900 tracking-tight">
              {isRegister ? 'Registro de Estudioso' : 'Acesso ao Santuário'}
            </h2>
            <p className="text-stone-400 italic font-serif text-xl">
              "Para acessar a IA, torne-se um Membro."
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {isRegister && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-6">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-10 py-6 bg-stone-50 border border-stone-200 rounded-[2rem] outline-none focus:ring-8 focus:ring-[#d4af37]/5 font-serif italic text-xl transition-all"
                  placeholder="Seu nome"
                />
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-6">Correio Eletrônico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-10 py-6 bg-stone-50 border border-stone-200 rounded-[2rem] outline-none focus:ring-8 focus:ring-[#d4af37]/5 font-serif italic text-xl transition-all"
                placeholder="exemplo@igreja.com"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-6">Senha de Acesso</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-10 py-6 bg-stone-50 border border-stone-200 rounded-[2rem] outline-none focus:ring-8 focus:ring-[#d4af37]/5 font-serif italic text-xl transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-8 bg-[#1a1a1a] text-[#d4af37] rounded-[2rem] font-black uppercase tracking-[0.5em] text-xs shadow-2xl hover:bg-[#8b0000] hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                isRegister ? 'Registrar por R$ 9,90/mês' : 'Entrar na Cathedra'
              )}
            </button>
          </form>

          <footer className="text-center pt-8 border-t border-stone-50 space-y-4">
             <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:text-[#8b0000] transition-colors"
             >
               {isRegister ? 'Já possuo acesso de membro' : 'Não sou membro? Criar conta por R$ 9,90'}
             </button>
             <p className="text-[8px] text-stone-300 uppercase tracking-tighter">Acesso a Bíblia, Catecismo e Magistério é Gratuito para todos.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
