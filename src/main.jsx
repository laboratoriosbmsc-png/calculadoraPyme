import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { PwaUpdatesProvider } from './components/PwaUpdates'
import { SolicitudesProvider } from './hooks/useSolicitudes'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PwaUpdatesProvider>
        <SolicitudesProvider>
          <App />
        </SolicitudesProvider>
      </PwaUpdatesProvider>
    </BrowserRouter>
  </StrictMode>,
)
