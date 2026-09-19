import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const redirectPath = sessionStorage.getItem('redirectPath');
if (redirectPath) {
    sessionStorage.removeItem('redirectPath');
    window.history.replaceState(null, '', redirectPath);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
