
import { useState, useEffect, useCallback } from 'react';

export interface ConnectivityState {
  isOnline: boolean;
  isSyncing: boolean;
  wasOffline: boolean;
  connectionType?: string;
}

export const useOfflineMode = (): ConnectivityState => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<string | undefined>(
    (navigator as any).connection?.effectiveType
  );

  const triggerBackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-theological-data');
      } catch (e) {
        console.debug('[Offline] Sync registration failed:', e);
      }
    }
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setIsSyncing(true);
    triggerBackgroundSync();
    
    // Simula o tempo de re-estabilização e sincronização
    setTimeout(() => {
      setIsSyncing(false);
      setWasOffline(false);
    }, 4000);
  }, [triggerBackgroundSync]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitorar mudanças na qualidade da rede (4G, WiFi, etc)
    const conn = (navigator as any).connection;
    if (conn) {
      const updateConn = () => setConnectionType(conn.effectiveType);
      conn.addEventListener('change', updateConn);
    }

    // Ping sutil para evitar falsos positivos de conectividade
    const heartBeat = setInterval(() => {
      if (navigator.onLine) {
        fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
          .then(() => { if (!isOnline) handleOnline(); })
          .catch(() => { if (isOnline) handleOffline(); });
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartBeat);
    };
  }, [isOnline, handleOnline, handleOffline]);

  return { isOnline, isSyncing, wasOffline, connectionType };
};
