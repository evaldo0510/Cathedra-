
import { useState, useEffect, useCallback } from 'react';

export interface ConnectivityState {
  isOnline: boolean;
  isSyncing: boolean;
  wasOffline: boolean;
}

export const useOfflineMode = (): ConnectivityState => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setIsSyncing(true);
    // Simula o tempo de re-estabilização e sync de dados pendentes
    setTimeout(() => {
      setIsSyncing(false);
      setWasOffline(false);
    }, 4000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificação periódica de "falsa conectividade" (ping sutil)
    const heartBeat = setInterval(() => {
      if (navigator.onLine) {
        fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
          .then(() => { if (!isOnline) handleOnline(); })
          .catch(() => { if (isOnline) handleOffline(); });
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartBeat);
    };
  }, [isOnline, handleOnline, handleOffline]);

  return { isOnline, isSyncing, wasOffline };
};
