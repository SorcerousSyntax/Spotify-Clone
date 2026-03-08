import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Disable SW for now and clean stale caches to prevent deploy hash mismatch blank screens.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const cleanupKey = 'raabta-sw-cleanup-v1';
    if (sessionStorage.getItem(cleanupKey)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
    if (window.caches?.keys) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('music-app-') || key.startsWith('music-audio-'))
          .map((key) => caches.delete(key))
      );
    }
    sessionStorage.setItem(cleanupKey, '1');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
