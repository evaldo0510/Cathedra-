
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
        alert("Simulação: Redirecionando para o Stripe Checkout...");
        // window.location.href = result.url;
      }
    } catch (err) {
      alert("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <button onClick={onBack} className="mb-10 flex items-center gap-3 text-stone-400 hover:text-[#d4af37] transition-colors group">
        <Icons.Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Voltar ao Santuário</span>
      </button>

      <header className="text-center space-y-6 mb-20">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-[#d4af37] tracking-tight">Eleve seu Estudo</h2>
        <p className="text-stone-500 italic text-2xl max-w-2xl mx-auto">
          Torne-se um <span className="text-[#8b0000] dark:text-[#d4af37] font-bold">Membro Scholar</span> e acesse a plenitude da Tradição com o suporte da IA teológica.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-10">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white dark:bg-stone-900 rounded-[4rem] p-12 shadow-2xl border-2 transition-all relative overflow-hidden group hover:scale-[1.02] ${plan.id === 'scholar_yearly' ? 'border-[#d4af37] ring-8 ring-[#d4af37]/5' : 'border-stone-100 dark:border-stone-800'}`}>
            {plan.id === 'scholar_yearly' && (
              <div className="absolute top-10 right-[-35px] bg-[#d4af37] text-stone-900 px-12 py-1 rotate-45 text-[9px] font-black uppercase tracking-widest shadow-xl">
                Mais Popular
              </div>
            )}

            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif font-bold text-[#8b0000] dark:text-[#d4af37]">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-stone-400 text-sm italic">/ {plan.interval === 'month' ? 'mês' : 'ano'}</span>
                </div>
              </div>

              <ul className="space-y-5">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-4 text-stone-600 dark:text-stone-400">
                    <Icons.Cross className="w-4 h-4 text-[#d4af37] mt-1 flex-shrink-0" />
                    <span className="font-serif italic text-lg leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!loading}
                className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 ${plan.id === 'scholar_yearly' ? 'bg-[#d4af37] text-stone-900 hover:bg-[#b8952e]' : 'bg-[#1a1a1a] text-[#d4af37] hover:bg-stone-800'}`}
              >
                {loading === plan.id ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.Feather className="w-4 h-4" />
                    <span>Assinar Agora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-20 text-center space-y-6 opacity-60">
        <div className="flex justify-center gap-10">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Pagamento Seguro via Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.Globe className="w-6 h-6 text-[#d4af37]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Cancelamento Instantâneo</span>
          </div>
        </div>
        <p className="text-[9px] max-w-xl mx-auto text-stone-400">
          Ao assinar, você concorda com nossos Termos de Uso. O processamento é realizado de forma segura e criptografada. Dúvidas? suporte@cathedra.com
        </p>
      </footer>
    </div>
  );
};

export default Checkout;
