import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Fontes embutidas no app (nenhuma requisição a servidores de terceiros)
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

// PWA: registra o service worker só em produção, fora de iframes
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.self === window.top && !import.meta.env.VITE_SINGLEFILE) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}))
}
