import { ArrowRight, BadgeCheck, CalendarDays, CalendarRange, FilePlus2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import NuevaSolicitudModal from '../../components/NuevaSolicitudModal'
import { useSolicitudes } from '../../hooks/useSolicitudes'
import { formatDate } from '../../services/calculos'
import { getSession } from '../../services/auth'

export default function DashboardPage() {
  const [newOpen, setNewOpen] = useState(false)
  const { solicitudesPropias } = useSolicitudes()
  const latest = [...solicitudesPropias].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)).slice(0, 5)
  const now = new Date()
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const createdInMonth = (item, year, month) => {
    const date = new Date(item.fechaCreacion)
    return date.getFullYear() === year && date.getMonth() === month
  }
  const currentMonthCount = solicitudesPropias.filter((item) => createdInMonth(item, now.getFullYear(), now.getMonth())).length
  const previousMonthCount = solicitudesPropias.filter((item) => createdInMonth(item, previousMonth.getFullYear(), previousMonth.getMonth())).length
  const completedCount = solicitudesPropias.filter((item) => item.planPagos && item.flujoCaja && item.tamanoActividad && item.balanceGeneral).length
  const sectionProgress = (item) => [item.planPagos, item.flujoCaja, item.tamanoActividad, item.balanceGeneral].filter(Boolean).length
  const firstName = getSession()?.email?.split('@')[0].split(/[._-]/)[0]

  return (
    <div className="page-container">
      <header className="page-heading dashboard-heading">
        <div><span className="eyebrow">Panel de gestión</span><h1>Hola, <span className="capitalize">{firstName}</span></h1><p>Este es el resumen de tus evaluaciones Pyme.</p></div>
        <button type="button" className="button primary" onClick={() => setNewOpen(true)}><Plus size={19} />Nueva solicitud</button>
      </header>

      <section className="metrics-grid" aria-label="Resumen de registros">
        <article className="metric-card green"><span className="metric-icon"><CalendarDays /></span><div><span>Solicitudes este mes</span><strong>{currentMonthCount}</strong><small>registradas en el mes actual</small></div></article>
        <article className="metric-card burgundy"><span className="metric-icon"><CalendarRange /></span><div><span>Solicitudes mes anterior</span><strong>{previousMonthCount}</strong><small>registradas el mes pasado</small></div></article>
        <article className="metric-card gold"><span className="metric-icon"><BadgeCheck /></span><div><span>Solicitudes completas</span><strong>{completedCount}</strong><small>4 secciones finalizadas</small></div></article>
      </section>

      <section className="dashboard-grid">
        <div className="surface recent-panel">
          <div className="section-heading"><div><h2>Últimas solicitudes</h2><p>Tus cinco evaluaciones más recientes</p></div><Link className="text-link" to="/solicitudes">Ver todas <ArrowRight size={16} /></Link></div>
          {latest.length ? <div className="recent-list">{latest.map((item) => (
            <Link className="recent-row" key={item.id} to="/solicitudes">
              <span className="reference-avatar">{item.nombreReferencia.slice(0, 2).toUpperCase()}</span>
              <span className="recent-main"><strong>{item.nombreReferencia}</strong><small>Creada {formatDate(item.fechaCreacion)}</small></span>
              <span className={`progress-badge ${sectionProgress(item) === 4 ? 'complete' : ''}`}>{sectionProgress(item)}/4 secciones</span>
              <ArrowRight className="row-arrow" size={18} />
            </Link>
          ))}</div> : <div className="empty-state"><span className="empty-icon"><FilePlus2 /></span><h3>Aún no tienes solicitudes</h3><p>Crea la primera evaluación y elige por qué sección comenzar.</p><button type="button" className="button primary small" onClick={() => setNewOpen(true)}>Crear solicitud</button></div>}
        </div>
        <aside className="surface quick-panel">
          <span className="eyebrow">Acceso rápido</span><h2>Comienza una evaluación</h2><p>Crea la referencia del cliente y completa las secciones en el orden que prefieras.</p>
          <button type="button" className="quick-action" onClick={() => setNewOpen(true)}><span><Plus /></span><div><strong>Nueva solicitud</strong><small>Completa las 4 secciones</small></div><ArrowRight size={18} /></button>
          <div className="quick-note"><span>Tip</span>La información se guarda únicamente cuando completas cada formulario.</div>
        </aside>
      </section>
      <NuevaSolicitudModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
