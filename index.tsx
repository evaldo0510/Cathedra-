
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
    // Auto-recuperação: limpa cache e recarrega
    localStorage.clear();
    if ('serviceWorker' in navigator) {
      caches.keys().then(names => {
        for (let name of names) caches.delete(name);
      });
    }
    window.location.reload();
  }
};

// Garante que o DOM está pronto antes de iniciar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Registro de SW com tratamento de erro de origem e recarregamento automático
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usando caminho relativo explícito ./sw.js para evitar problemas de origin mismatch
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Cathedra] Nova versão disponível. Reiniciando...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(err => {
        // Log discreto do erro de SW, pois não deve impedir o funcionamento do app online
        console.debug('Service Worker falhou ao registrar (comum em sandboxes de desenvolvimento):', err.message);
      });
  });
}
