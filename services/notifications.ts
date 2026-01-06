
import { getDailyBundle } from './gemini';

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
      "Que a luz de Cristo ilumine sua jornada. Você receberá a liturgia e o santo do dia aqui."
    );
  }

  public async scheduleDailyReminder(lang: any = 'pt') {
    if (Notification.permission !== 'granted') return;

    const lastReminder = localStorage.getItem('cathedra_last_reminder');
    const today = new Date().toLocaleDateString('pt-BR');

    if (lastReminder !== today) {
      try {
        const bundle = await getDailyBundle(lang);
        const title = `Lumen Diei: ${bundle.saint.name} 🏛️`;
        const body = `Hoje celebramos ${bundle.saint.name}. Liturgia: ${bundle.gospel.reference}. Clique para meditar.`;
        
        await this.sendLocalNotification(title, body);
        localStorage.setItem('cathedra_last_reminder', today);
      } catch (e) {
        await this.sendLocalNotification(
          "Cathedra: Alimento Espiritual",
          "A liturgia e o santo do dia já estão disponíveis para sua meditação."
        );
        localStorage.setItem('cathedra_last_reminder', today);
      }
    }

    this.setupMidnightTimer(lang);
  }

  private setupMidnightTimer(lang: any) {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    setTimeout(() => this.scheduleDailyReminder(lang), msUntilMidnight + 5000); 
  }

  public async sendLocalNotification(title: string, body: string) {
    if (Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          icon: 'https://img.icons8.com/ios-filled/512/d4af37/cross.png',
          badge: 'https://img.icons8.com/ios-filled/96/d4af37/cross.png',
          vibrate: [200, 100, 200],
          tag: 'daily-bread',
          renotify: true,
          data: { url: '/' }
        } as any);
      } catch (e) {
        new Notification(title, { body, icon: 'https://img.icons8.com/ios-filled/512/d4af37/cross.png' });
      }
    } else {
      new Notification(title, { body, icon: 'https://img.icons8.com/ios-filled/512/d4af37/cross.png' });
    }
  }
}

export const notificationService = NotificationService.getInstance();
