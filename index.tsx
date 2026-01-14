
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'katex/dist/katex.min.css';

// Handle PWA and Storage safely
const initStorage = () => {
  try {
    const sessionCount = parseInt(localStorage.getItem('ssc_sessions') || '0');
    localStorage.setItem('ssc_sessions', (sessionCount + 1).toString());
  } catch (e) {
    console.warn('Storage access restricted:', e);
  }
};

initStorage();

// PWA Registration with relative path fallback
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use simple relative path to avoid URL parsing errors in certain sandboxes
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('SSC SW Registered!', reg.scope))
      .catch(err => {
        // Log warning but do not crash application
        console.warn('SW Registration Warning:', err.message || err);
      });
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
