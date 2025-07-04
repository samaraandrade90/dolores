import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('✅ Service Worker registrado com sucesso:', registration);
    })
    .catch((err) => {
      console.error('❌ Erro ao registrar o service worker:', err);
    });
}