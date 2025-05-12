import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Garante que o elemento root existe
const rootElement = document.getElementById('root')
if (!rootElement) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

ReactDOM.createRoot(rootElement ?? document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
) 