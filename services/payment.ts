
/**
 * Cathedra Digital - Payment Service (Stripe Integration)
 * Este serviço gerencia a ponte com o Stripe para assinaturas do plano Scholar.
 */

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export const PLANS: PricingPlan[] = [
  {
    id: 'scholar_monthly',
    name: 'Scholar Mensal',
    price: 19.90,
    interval: 'month',
    features: [
      'Acesso ilimitado ao Cathedra AI',
      'Biblioteca do Aquinate (Disputatio)',
      'Sincronização Cloud com Supabase',
      'Histórico de Estudos Ilimitado',
      'Exportação de Artigos em PDF'
    ],
    stripePriceId: 'price_monthly_placeholder'
  },
  {
    id: 'scholar_yearly',
    name: 'Scholar Anual',
    price: 199.00,
    interval: 'year',
    features: [
      'Tudo do plano mensal',
      '2 meses de bônus',
      'Acesso antecipado a novos módulos',
      'Suporte prioritário via WhatsApp'
    ],
    stripePriceId: 'price_yearly_placeholder'
  }
];

class PaymentService {
  private static instance: PaymentService;
  private stripe: any = null;

  private constructor() {
    // Inicialização do Stripe seria aqui: this.stripe = window.Stripe(process.env.STRIPE_PUBLIC_KEY);
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Simula ou inicia a sessão de checkout do Stripe
   */
  public async createCheckoutSession(planId: string, userEmail?: string) {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) throw new Error("Plano inválido");

    console.log(`[Stripe] Iniciando checkout para ${plan.name}...`);
    
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));

    // No futuro: Chamar sua API local ou Supabase Edge Function para criar a Session
    // const { sessionId } = await fetch('/api/create-checkout', { ... }).then(r => r.json());
    // await this.stripe.redirectToCheckout({ sessionId });

    return { url: 'https://checkout.stripe.com/pay/simulated_session', success: true };
  }

  public async getSubscriptionStatus(userId: string) {
    // Integração com Supabase para verificar status da assinatura
    return { isActive: true, plan: 'scholar' };
  }
}

export const paymentService = PaymentService.getInstance();
