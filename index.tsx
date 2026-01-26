
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Erro fatal no carregamento:", err);
    localStorage.clear();
    window.location.reload();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Registro defensivo do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Apenas tenta registrar se as origens forem compatíveis ou se estiver em prod
    try {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => {
          console.debug('SW registrado:', reg.scope);
          
          setInterval(() => { reg.update(); }, 1000 * 60 * 5);

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent('pwa-update-available'));
                }
              };
            }
          };
        })
        .catch(err => {
          // Ignora erros de origem mismatch em ambientes de sandbox/preview
          if (err.message.includes('origin')) {
            console.debug('ServiceWorker desativado: Conflito de origem em ambiente de sandbox.');
          } else {
            console.debug('SW falhou:', err.message);
          }
        });
    } catch (e) {
      console.debug('ServiceWorker não suportado nesta origem.');
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
