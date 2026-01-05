
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
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Agenda ou dispara o lembrete diário.
   * Em um PWA, se o app estiver aberto à meia-noite, ele dispara.
   * Se for a primeira vez que abre no dia, ele dispara o conteúdo de hoje.
   */
  public async scheduleDailyReminder(lang: any = 'pt') {
    if (Notification.permission !== 'granted') return;

    const lastReminder = localStorage.getItem('cathedra_last_reminder');
    const today = new Date().toLocaleDateString();

    if (lastReminder !== today) {
      try {
        const bundle = await getDailyBundle(lang);
        const title = `Lumen Diei: ${bundle.saint.name} 🏛️`;
        const body = `Hoje celebramos ${bundle.saint.name}. Liturgia: ${bundle.gospel.reference}. Clique para meditar.`;
        
        this.sendLocalNotification(title, body);
        localStorage.setItem('cathedra_last_reminder', today);
      } catch (e) {
        // Fallback caso falhe a rede
        this.sendLocalNotification(
          "Cathedra: Nova Liturgia",
          "O pão espiritual de hoje está pronto. Venha meditar."
        );
      }
    }

    // Configura um timer para verificar a virada do dia se o app ficar aberto
    this.setupMidnightTimer(lang);
  }

  private setupMidnightTimer(lang: any) {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.scheduleDailyReminder(lang);
    }, msUntilMidnight + 1000); // +1s para garantir que já é outro dia
  }

  public sendLocalNotification(title: string, body: string) {
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: 'https://img.icons8.com/ios-filled/512/d4af37/cross.png',
          badge: 'https://img.icons8.com/ios-filled/96/d4af37/cross.png',
          vibrate: [200, 100, 200],
          tag: 'daily-bread',
          renotify: true
        } as any);
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();
