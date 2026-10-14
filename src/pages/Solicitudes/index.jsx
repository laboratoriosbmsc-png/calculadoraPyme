import { Banknote, BarChart3, ChevronLeft, ChevronRight, FilePlus2, Pencil, Plus, Scale, Search, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NuevaSolicitudModal from '../../components/NuevaSolicitudModal'
import SectionsModal from '../../components/SectionsModal'
import { SolicitudActionDialogs, SolicitudActionsMenu, useSolicitudActions } from '../../components/SolicitudActions'
import { useSolicitudes } from '../../hooks/useSolicitudes'
import { formatDate, getResultadoCargaFinanciera } from '../../services/calculos'

export default function SolicitudesPage() {
  const [newOpen, setNewOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sectionsTarget, setSectionsTarget] = useState(null)
  const [page, setPage] = useState(1)
  const { solicitudesPropias } = useSolicitudes()
  const actions = useSolicitudActions()
  const navigate = useNavigate()
  const filtered = useMemo(() => solicitudesPropias.filter((item) => item.nombreReferencia.toLowerCase().includes(query.toLowerCase())).sort((a, b) => new Date(b.fechaActualizacion) - new Date(a.fechaActualizacion)), [solicitudesPropias, query])
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const firstRow = (currentPage - 1) * pageSize
  const visibleRequests = filtered.slice(firstRow, firstRow + pageSize)

  useEffect(() => setPage(1), [query])

  return (
    <div className="page-container">
      <header className="page-heading"><div><h1>Solicitudes</h1><p>Gestiona los análisis registrados para tus clientes.</p></div><button type="button" className="button primary" onClick={() => setNewOpen(true)}><Plus size={19} />Nueva solicitud</button></header>
      <div className="toolbar surface"><div className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre de referencia" aria-label="Buscar solicitudes" /></div><span className="result-count">{filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'}</span></div>
      {filtered.length ? (
        <div className="surface requests-table-panel">
          <div className="requests-table-scroll">
            <table className="requests-table">
              <colgroup><col className="request-client-column" /><col /></colgroup>
              <thead><tr><th>Solicitud</th><th>Secciones</th></tr></thead>
              <tbody>{visibleRequests.map((item) => <tr key={item.id}>
                <td><div className="request-table-identity"><div><button type="button" className="request-name-button" onClick={() => setSectionsTarget(item)}>{item.nombreReferencia}</button><small><Pencil size={10} aria-hidden="true" />{formatDate(item.fechaActualizacion)}</small></div></div></td>
                <td><div className="request-sections-cell"><RequestSectionLinks item={item} /><SolicitudActionsMenu solicitud={item} onView={() => navigate(`/solicitudes/${item.id}/informe`)} onShare={() => actions.shareReport(item)} onEdit={() => actions.openEdit(item)} onDelete={() => actions.setDeleteTarget(item)} sharingId={actions.sharingId} /></div></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="table-pagination requests-pagination">
            <span>Solicitudes {firstRow + 1}–{Math.min(firstRow + pageSize, filtered.length)} de {filtered.length}</span>
            <div>
              <button type="button" className="pagination-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Página anterior"><ChevronLeft size={17} /></button>
              <strong>Página {currentPage} de {totalPages}</strong>
              <button type="button" className="pagination-button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} aria-label="Página siguiente"><ChevronRight size={17} /></button>
            </div>
          </div>
        </div>
      ) : <div className="surface empty-state large-empty"><span className="empty-icon"><FilePlus2 /></span><h2>{query ? 'No encontramos coincidencias' : 'Aún no tienes solicitudes'}</h2><p>{query ? 'Prueba con otro nombre de referencia.' : 'Crea una solicitud para comenzar una nueva evaluación.'}</p>{!query && <button type="button" className="button primary" onClick={() => setNewOpen(true)}><Plus size={18} />Nueva solicitud</button>}</div>}

      <NuevaSolicitudModal open={newOpen} onClose={() => setNewOpen(false)} />
      <SectionsModal solicitud={sectionsTarget} onClose={() => setSectionsTarget(null)} onNavigate={(path) => { setSectionsTarget(null); navigate(path) }} actions={{ onView: () => { setSectionsTarget(null); navigate(`/solicitudes/${sectionsTarget.id}/informe`) }, onShare: () => { const item = sectionsTarget; setSectionsTarget(null); actions.shareReport(item) }, onEdit: () => { const item = sectionsTarget; setSectionsTarget(null); actions.openEdit(item) }, onDelete: () => { const item = sectionsTarget; setSectionsTarget(null); actions.setDeleteTarget(item) }, sharingId: actions.sharingId }} />
      <SolicitudActionDialogs actions={actions} />
    </div>
  )
}

function RequestSectionLinks({ item }) {
  const flujoStatus = getResultadoCargaFinanciera(item.flujoCaja) === 'RECHAZADO' ? 'Rechazo' : item.flujoCaja ? 'Completada' : 'En blanco'
  const sections = [
    { title: 'Plan de Pagos', description: 'Simula las condiciones del financiamiento.', icon: Banknote, path: 'plan-pagos', status: item.planPagos ? 'Completada' : 'En blanco' },
    { title: 'Flujo de Caja', description: 'Evalúa el flujo neto y la carga financiera.', icon: TrendingUp, path: 'flujo-caja', status: flujoStatus },
    { title: 'Tamaño Actividad', description: 'Clasifica la actividad según su índice.', icon: BarChart3, path: 'tamano-actividad', status: item.tamanoActividad ? 'Completada' : 'En blanco' },
    { title: 'Balance General', description: 'Registra activos, pasivos y límite de financiamiento.', icon: Scale, path: 'balance-general', status: item.balanceGeneral ? 'Completada' : 'En blanco' },
  ]
  return <div className="request-section-icons">{sections.map(({ title, description, icon: Icon, path, status }) => {
    const statusClass = status.toLowerCase().replace(' ', '-')
    const tooltip = `${title}: ${description} Estado: ${status}.`
    return <Link key={path} to={`/solicitudes/${item.id}/${path}`} className={`request-section-icon ${statusClass}`} aria-label={`Ir a ${title} de ${item.nombreReferencia}. ${tooltip}`} title={tooltip}><Icon size={18} /><span aria-hidden="true" /></Link>
  })}</div>
}
