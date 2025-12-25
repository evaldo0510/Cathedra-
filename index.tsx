
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Registro Profissional do Service Worker (PWA)
 * Corrigido para usar caminhos relativos (./) evitando erros de Origin Mismatch em sandboxes.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usamos './sw.js' para garantir que o script seja buscado na mesma origem do app
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.log('[Cathedra PWA] Ativado com sucesso no escopo:', registration.scope);
        
        // Lógica de verificação de atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Cathedra PWA] Nova versão detectada. O app será atualizado no próximo acesso.');
              }
            });
          }
        });
      })
      .catch(err => {
        // Log silencioso em produção para não afetar UX
        console.debug('[Cathedra PWA] Otimização offline indisponível no momento:', err.message);
      });
  });

  // Listener para troca de controle (quando o novo SW assume)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Cathedra PWA] App atualizado com sucesso.');
  });
}
