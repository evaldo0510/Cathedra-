
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

  public async scheduleDailyReminder() {
    if (Notification.permission !== 'granted') return;

    const lastReminder = localStorage.getItem('cathedra_last_reminder');
    const today = new Date().toLocaleDateString();

    if (lastReminder !== today) {
      // Em um ambiente web real, poderíamos agendar via Service Worker
      // Aqui simulamos o disparo quando o app abre pela primeira vez no dia
      this.sendLocalNotification(
        "Liturgia de Hoje Disponível 🏛️",
        "O pão espiritual do dia já está pronto no seu santuário."
      );
      localStorage.setItem('cathedra_last_reminder', today);
    }
  }

  public sendLocalNotification(title: string, body: string) {
    if (Notification.permission === 'granted' && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        // Fix: Cast to any as 'vibrate' is part of ServiceWorkerNotificationOptions but may be missing in DOM types
        registration.showNotification(title, {
          body,
          icon: 'https://img.icons8.com/ios-filled/512/d4af37/cross.png',
          badge: 'https://img.icons8.com/ios-filled/96/d4af37/cross.png',
          vibrate: [200, 100, 200]
        } as any);
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();
