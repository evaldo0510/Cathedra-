
import { getDailyBundle } from './gemini';
import { AppRoute } from '../types';

export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.sendWelcomeNotification();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erro ao solicitar permissão:", e);
      return false;
    }
  }

  public async initNotifications(lang: any = 'pt') {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      await this.scheduleDailyReminder(lang);
    }
  }

  private async sendWelcomeNotification() {
    await this.sendLocalNotification(
      "Santuário Ativado 🏛️",
      "Bem-vindo ao Cathedra. O depósito da fé está agora ao alcance de seus dedos.",
      AppRoute.DASHBOARD
    );
  }

  public async scheduleDailyReminder(lang: any = 'pt') {
    if (Notification.permission !== 'granted') return;

    const today = new Date().toLocaleDateString('pt-BR');
    const lastReminder = localStorage.getItem('cathedra_last_reminder_date');

    if (lastReminder !== today) {
      try {
        const bundle = await getDailyBundle(lang);
        const title = `Lumen Diei: ${bundle.saint.name} 🏛️`;
        const body = `Celebramos hoje: ${bundle.saint.name}. Evangelho: ${bundle.gospel.reference}.`;
        
        await this.sendLocalNotification(title, body, AppRoute.DAILY_LITURGY, {
          data: { url: AppRoute.DAILY_LITURGY }
        });
        localStorage.setItem('cathedra_last_reminder_date', today);
      } catch (e) {
        // Fallback silencioso se a IA falhar
      }
    }
  }

  public async sendLocalNotification(title: string, body: string, url: string = '/', extra: any = {}) {
    if (Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body,
        icon: 'https://img.icons8.com/ios-filled/512/d4af37/throne.png',
        badge: 'https://img.icons8.com/ios-filled/96/d4af37/throne.png',
        vibrate: [200, 100, 200],
        data: { url },
        ...extra
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();
