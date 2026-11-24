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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // procura atualização ao abrir e sempre que o app volta para a tela
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update())
      })
      .catch(() => {})
  })
  // quando uma versão nova assume, recarrega uma vez para mostrá-la
  let reloaded = false
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload() }
  })
}
