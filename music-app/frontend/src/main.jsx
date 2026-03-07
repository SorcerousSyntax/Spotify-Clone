import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Keep service worker only for production builds.
// In dev, unregister stale workers to avoid cache-related blank screens.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
      return;
    }

    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
    if (window.caches?.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
