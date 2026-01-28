
import React, { useState } from 'react';
import { Icons } from '../constants';
import { PLANS, paymentService } from '../services/payment';

const Checkout: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const result = await paymentService.createCheckoutSession(planId);
      if (result.success) {
        // Redirecionamento simulado para o provedor de pagamento (Stripe)
        alert("Encaminhando para o checkout seguro...");
        window.location.href = "https://checkout.stripe.com/pay/simulated_cathedra_session";
      }
    } catch (err) {
      alert("Falha ao iniciar processo. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <header className="text-center space-y-6 mb-20">
        <div className="flex justify-center">
           <div className="p-6 bg-stone-900 rounded-full shadow-sacred border-4 border-gold">
              <Icons.Star className="w-12 h-12 text-gold fill-current" />
           </div>
        </div>
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Caminho do Estudioso</h2>
        <p className="text-stone-500 italic text-2xl max-w-2xl mx-auto">
          Assine o plano <span className="text-[#8b0000] dark:text-gold font-bold">Scholar</span> e desbloqueie o pleno potencial da IA teológica no seu dia a dia.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white dark:bg-stone-900 rounded-[4rem] p-12 shadow-2xl border-2 transition-all relative overflow-hidden group hover:scale-[1.02] ${plan.id === 'scholar_yearly' ? 'border-gold ring-8 ring-gold/5' : 'border-stone-100 dark:border-white/5'}`}>
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif font-bold text-sacred dark:text-gold">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-stone-400 text-sm italic">/ {plan.id === 'scholar_monthly' ? 'mês' : 'ano'}</span>
                </div>
              </div>

              <ul className="space-y-5 border-t border-stone-50 dark:border-white/5 pt-8">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-4 text-stone-600 dark:text-stone-400">
                    <Icons.Cross className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                    <span className="font-serif italic text-lg leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!loading}
                className={`w-full py-8 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 ${plan.id === 'scholar_yearly' ? 'bg-gold text-stone-900' : 'bg-stone-900 text-gold hover:bg-sacred hover:text-white'}`}
              >
                {loading === plan.id ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Adquirir Acesso</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 p-12 bg-stone-50 dark:bg-stone-900/50 rounded-[4rem] text-center border-2 border-dashed border-stone-200 dark:border-white/5">
         <p className="text-xl font-serif italic text-stone-400">"Dar-vos-ei pastores segundo o meu coração, que vos guiarão com inteligência e sabedoria." — Jeremias 3, 15</p>
      </div>
    </div>
  );
};

export default Checkout;
