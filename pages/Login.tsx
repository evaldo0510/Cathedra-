
import React, { useState } from 'react';
import { Icons } from '../constants';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de registro profissional com integração Supabase futura
    setTimeout(() => {
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
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in duration-1000">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-[4rem] shadow-4xl border border-stone-100 dark:border-stone-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-3 bg-gold" />
        
        <div className="p-10 md:p-20 space-y-12">
          <header className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-8 bg-[#1a1a1a] rounded-[2.5rem] shadow-sacred relative group rotate-3">
                <Icons.Feather className="w-12 h-12 text-gold" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {isRegister ? 'Criar sua Cátedra' : 'Acessar Santuário'}
              </h2>
              <p className="text-stone-400 italic font-serif text-xl">
                {isRegister ? 'Registre-se gratuitamente para desbloquear a Investigação IA.' : 'Bem-vindo de volta ao centro de estudos.'}
              </p>
            </div>
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
                  className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-[2rem] outline-none focus:ring-8 focus:ring-gold/5 font-serif italic text-xl transition-all dark:text-white"
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
                className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-[2rem] outline-none focus:ring-8 focus:ring-gold/5 font-serif italic text-xl transition-all dark:text-white"
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
                className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-[2rem] outline-none focus:ring-8 focus:ring-gold/5 font-serif italic text-xl transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-8 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-xs shadow-2xl hover:bg-sacred hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                isRegister ? 'Criar Conta Gratuita' : 'Entrar no Santuário'
              )}
            </button>
          </form>

          <footer className="text-center pt-8 border-t border-stone-100 dark:border-stone-800 space-y-6">
             <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-[10px] font-black uppercase tracking-widest text-gold hover:text-sacred transition-colors"
             >
               {isRegister ? 'Já possuo registro de membro' : 'Não sou membro? Criar conta gratuita'}
             </button>
             <div className="p-6 bg-[#fcf8e8] dark:bg-stone-800/40 rounded-3xl border border-gold/10">
                <p className="text-[9px] text-stone-500 dark:text-stone-400 uppercase tracking-widest leading-relaxed">
                  Nota: A Bíblia e o Catecismo permanecem acessíveis offline para todos os peregrinos. O registro é exclusivo para uso de ferramentas de IA.
                </p>
             </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
