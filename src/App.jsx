import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import BalanceGeneralPage from './pages/BalanceGeneral'
import DashboardPage from './pages/Dashboard'
import FlujoCajaPage from './pages/FlujoCaja'
import LoginPage from './pages/Login'
import PlanPagosPage from './pages/PlanPagos'
import InformePage from './pages/Solicitudes/Informe'
import SolicitudesPage from './pages/Solicitudes'
import TamanoActividadPage from './pages/TamanoActividad'
import { getSession } from './services/auth'

function ProtectedRoute() {
  const location = useLocation()
  return getSession()?.email ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

function NotFound() {
  return (
    <div className="centered-page">
      <div className="empty-state compact">
        <span className="eyebrow">Error 404</span>
        <h1>Página no encontrada</h1>
        <p>La dirección no existe o fue movida.</p>
        <a className="button primary" href="/inicio">Volver a Inicio</a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/solicitudes/:id/informe" element={<InformePage />} />
        <Route element={<AppLayout />}>
          <Route path="/inicio" element={<DashboardPage />} />
          <Route path="/solicitudes" element={<SolicitudesPage />} />
          <Route path="/solicitudes/:id" element={<Navigate to="/solicitudes" replace />} />
          <Route path="/solicitudes/:id/plan-pagos" element={<PlanPagosPage />} />
          <Route path="/solicitudes/:id/flujo-caja" element={<FlujoCajaPage />} />
          <Route path="/solicitudes/:id/tamano-actividad" element={<TamanoActividadPage />} />
          <Route path="/solicitudes/:id/balance-general" element={<BalanceGeneralPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to={getSession()?.email ? '/inicio' : '/login'} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
