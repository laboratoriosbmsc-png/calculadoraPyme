import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SolicitudesProvider } from './hooks/useSolicitudes'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SolicitudesProvider>
        <App />
      </SolicitudesProvider>
    </BrowserRouter>
  </StrictMode>,
)
