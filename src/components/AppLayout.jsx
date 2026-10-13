import { AlertCircle, ArrowLeft, Calculator, FileText, Home, LogOut, Menu, RefreshCw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '../services/auth'
import { useSolicitudes } from '../hooks/useSolicitudes'
import { usePwaUpdates } from './PwaUpdates'

const navigation = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/solicitudes', label: 'Solicitudes', icon: FileText },
]

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerHidden, setHeaderHidden] = useState(false)
  const lastScrollY = useRef(0)
  const navigate = useNavigate()
  const location = useLocation()
  const session = getSession()
  const { storageError, clearStorageError } = useSolicitudes()
  const { checkForUpdates, checking } = usePwaUpdates()
  const initials = session?.email?.slice(0, 2).toUpperCase()
  const isSectionPage = /^\/solicitudes\/[^/]+\/(plan-pagos|flujo-caja|tamano-actividad|balance-general)$/.test(location.pathname)

  useEffect(() => {
    setHeaderHidden(false)
    lastScrollY.current = window.scrollY
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = Math.max(window.scrollY, 0)
      const difference = currentY - lastScrollY.current
      if (currentY <= 16) setHeaderHidden(false)
      else if (difference > 6) setHeaderHidden(true)
      else if (difference < -6) setHeaderHidden(false)
      if (Math.abs(difference) > 6) lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const backToSolicitudes = () => {
    if (document.documentElement.dataset.unsavedChanges === 'true'
      && !window.confirm('Tienes cambios sin guardar. Si sales ahora, se perderán.')) return
    navigate('/solicitudes')
  }

  return (
    <div className="app-shell">
      <header className={`mobile-header ${headerHidden && !menuOpen ? 'hidden' : ''}`}>
        <button type="button" className="icon-button light" onClick={() => { setMenuOpen(!menuOpen); setHeaderHidden(false) }} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
        <div className="brand compact-brand"><span className="brand-mark"><Calculator /></span><strong>Calculadora <em>Pyme</em></strong></div>
        {isSectionPage ? <button type="button" className="mobile-back-button" onClick={backToSolicitudes} aria-label="Volver a solicitudes"><ArrowLeft size={18} /><span>Volver</span></button> : <span className="mobile-header-spacer" aria-hidden="true" />}
      </header>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Calculator /></span><div><strong>Calculadora</strong><em>Pyme</em></div></div>
        <nav aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={20} />{label}</NavLink>)}
          <button type="button" className="nav-link nav-action" onClick={() => { setMenuOpen(false); void checkForUpdates({ manual: true }) }} disabled={checking}><RefreshCw size={20} />{checking ? 'Buscando actualizaciones…' : 'Buscar actualizaciones'}</button>
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="user-copy"><strong>Ejecutivo Pyme</strong><span title={session?.email}>{session?.email}</span></div>
          <button type="button" className="icon-button sidebar-logout" onClick={logout} aria-label="Cerrar sesión"><LogOut size={19} /></button>
        </div>
      </aside>
      {menuOpen && <button type="button" className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}
      <main className="app-main">
        {storageError && <div className="global-error" role="alert"><AlertCircle size={18} /><span>{storageError}</span><button type="button" onClick={clearStorageError} aria-label="Cerrar aviso"><X size={18} /></button></div>}
        <Outlet />
      </main>
    </div>
  )
}
