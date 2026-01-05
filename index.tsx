
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => {
        // Verifica atualizações a cada 5 minutos
        setInterval(() => {
          reg.update();
        }, 1000 * 60 * 5);

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Notifica o App.tsx via evento customizado para mostrar o toast de update
                window.dispatchEvent(new CustomEvent('pwa-update-available'));
              }
            };
          }
        };
      })
      .catch(err => console.debug('SW Registration failed:', err));
  });

  // Recarrega automaticamente quando o novo SW assume o controle
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
