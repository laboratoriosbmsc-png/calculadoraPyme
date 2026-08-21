import { AlertCircle, Calculator, FileText, Home, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '../services/auth'
import { useSolicitudes } from '../hooks/useSolicitudes'

const navigation = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/solicitudes', label: 'Solicitudes', icon: FileText },
]

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const session = getSession()
  const { storageError, clearStorageError } = useSolicitudes()
  const initials = session?.email?.slice(0, 2).toUpperCase()

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <div className="brand compact-brand"><span className="brand-mark"><Calculator /></span><strong>Calculadora <em>Pyme</em></strong></div>
        <button type="button" className="icon-button light" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
      </header>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Calculator /></span><div><strong>Calculadora</strong><em>Pyme</em></div></div>
        <p className="sidebar-caption">Herramientas de evaluación</p>
        <nav aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={20} />{label}</NavLink>)}
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
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={20} /><span>{label}</span></NavLink>)}
        <button type="button" onClick={logout}><LogOut size={20} /><span>Salir</span></button>
      </nav>
    </div>
  )
}
