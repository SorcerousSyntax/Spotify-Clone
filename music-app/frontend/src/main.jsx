import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register SW in production for offline shell support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const cleanupKey = 'raabta-sw-cleanup-v3';

    if (!sessionStorage.getItem(cleanupKey)) {
      const regs = await navigator.serviceWorker.getRegistrations();

      if (!import.meta.env.PROD) {
        await Promise.all(regs.map((reg) => reg.unregister()));
      }

      if (window.caches?.keys) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith('music-app-') || key.startsWith('music-audio-'))
            .map((key) => caches.delete(key))
        );
      }

      sessionStorage.setItem(cleanupKey, '1');
    }

    if (import.meta.env.PROD) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
      } catch (err) {
        console.warn('Service Worker registration failed:', err?.message || err);
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
