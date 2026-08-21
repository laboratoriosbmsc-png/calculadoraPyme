import { Banknote, BarChart3, Download, ExternalLink, FilePlus2, MoreVertical, Pencil, Plus, Scale, Search, Trash2, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal'
import NuevaSolicitudModal from '../../components/NuevaSolicitudModal'
import StatusBadge from '../../components/StatusBadge'
import { useSolicitudes } from '../../hooks/useSolicitudes'
import { formatDate } from '../../services/calculos'

export default function SolicitudesPage() {
  const [newOpen, setNewOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [sectionsTarget, setSectionsTarget] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const { solicitudesPropias, deleteSolicitud, updateSolicitud } = useSolicitudes()
  const navigate = useNavigate()
  const filtered = useMemo(() => solicitudesPropias.filter((item) => item.nombreReferencia.toLowerCase().includes(query.toLowerCase())).sort((a, b) => new Date(b.fechaActualizacion) - new Date(a.fechaActualizacion)), [solicitudesPropias, query])

  useEffect(() => {
    const closeMenu = (event) => {
      if (!event.target.closest('.card-menu-container')) setMenuOpenId(null)
    }
    const closeOnEscape = (event) => event.key === 'Escape' && setMenuOpenId(null)
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const remove = () => {
    if (deleteSolicitud(deleteTarget.id)) setDeleteTarget(null)
  }

  const openEdit = (item) => {
    setMenuOpenId(null)
    setEditTarget(item)
    setEditName(item.nombreReferencia)
    setEditError('')
  }

  const saveName = (event) => {
    event.preventDefault()
    const clean = editName.trim()
    if (!clean) return setEditError('El nombre es obligatorio.')
    if (clean.length > 50) return setEditError('El nombre no puede superar los 50 caracteres.')
    if (!/^[\p{L}\p{N} .,'&()-]+$/u.test(clean)) return setEditError('Usa únicamente letras, números y signos comunes.')
    if (updateSolicitud(editTarget.id, { nombreReferencia: clean })) setEditTarget(null)
  }

  const requestDelete = (item) => {
    setMenuOpenId(null)
    setDeleteTarget(item)
  }

  return (
    <div className="page-container">
      <header className="page-heading"><div><span className="eyebrow">Evaluaciones</span><h1>Solicitudes</h1><p>Gestiona los análisis registrados para tus clientes.</p></div><button type="button" className="button primary" onClick={() => setNewOpen(true)}><Plus size={19} />Nueva solicitud</button></header>
      <div className="toolbar surface"><div className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre de referencia" aria-label="Buscar solicitudes" /></div><span className="result-count">{filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'}</span></div>
      {filtered.length ? (
        <div className="requests-grid">{filtered.map((item) => {
          const flujoStatus = item.flujoCaja?.cargaFinanciera === 'RECHAZADO' ? 'Rechazo' : item.flujoCaja ? 'Completada' : 'En blanco'
          return (
            <article className="request-card" key={item.id}>
              <div className="request-card-head">
                <span className="reference-avatar large-avatar">{item.nombreReferencia.slice(0, 2).toUpperCase()}</span>
                <div><h2>{item.nombreReferencia}</h2><p>Actualizada {formatDate(item.fechaActualizacion)}</p></div>
                <div className="card-menu-container">
                  <button type="button" className="icon-button card-menu-trigger" onClick={() => setMenuOpenId((current) => current === item.id ? null : item.id)} aria-label={`Opciones de ${item.nombreReferencia}`} aria-expanded={menuOpenId === item.id} aria-haspopup="menu"><MoreVertical size={20} /></button>
                  {menuOpenId === item.id && <div className="card-menu-popover" role="menu"><button type="button" role="menuitem" onClick={() => openEdit(item)}><Pencil size={17} />Editar nombre</button><button type="button" role="menuitem" className="danger" onClick={() => requestDelete(item)}><Trash2 size={17} />Eliminar</button></div>}
                </div>
              </div>
              <div className="request-dates"><span><small>Creación</small><strong>{formatDate(item.fechaCreacion, false)}</strong></span><span><small>Última edición</small><strong>{formatDate(item.fechaActualizacion, false)}</strong></span></div>
              <div className="section-status-list">
                <Link to={`/solicitudes/${item.id}/plan-pagos`} aria-label={`Ir a Plan de Pagos de ${item.nombreReferencia}`}><span>Plan de Pagos</span><StatusBadge status={item.planPagos ? 'Completada' : 'En blanco'} /></Link>
                <Link to={`/solicitudes/${item.id}/flujo-caja`} aria-label={`Ir a Flujo de Caja de ${item.nombreReferencia}`}><span>Flujo de Caja</span><StatusBadge status={flujoStatus} /></Link>
                <Link to={`/solicitudes/${item.id}/tamano-actividad`} aria-label={`Ir a Tamaño Actividad de ${item.nombreReferencia}`}><span>Tamaño Actividad</span><StatusBadge status={item.tamanoActividad ? 'Completada' : 'En blanco'} /></Link>
                <Link to={`/solicitudes/${item.id}/balance-general`} aria-label={`Ir a Balance General de ${item.nombreReferencia}`}><span>Balance General</span><StatusBadge status={item.balanceGeneral ? 'Completada' : 'En blanco'} /></Link>
              </div>
              <div className="request-actions"><button type="button" className="button primary small grow" onClick={() => setSectionsTarget(item)}><ExternalLink size={17} />Abrir</button><button type="button" className="icon-button bordered" onClick={() => navigate(`/solicitudes/${item.id}/informe`)} aria-label={`Exportar ${item.nombreReferencia}`}><Download size={18} /></button></div>
            </article>
          )
        })}</div>
      ) : <div className="surface empty-state large-empty"><span className="empty-icon"><FilePlus2 /></span><h2>{query ? 'No encontramos coincidencias' : 'Aún no tienes solicitudes'}</h2><p>{query ? 'Prueba con otro nombre de referencia.' : 'Crea una solicitud para comenzar una nueva evaluación.'}</p>{!query && <button type="button" className="button primary" onClick={() => setNewOpen(true)}><Plus size={18} />Nueva solicitud</button>}</div>}

      <NuevaSolicitudModal open={newOpen} onClose={() => setNewOpen(false)} />
      <SectionsModal solicitud={sectionsTarget} onClose={() => setSectionsTarget(null)} onNavigate={(path) => { setSectionsTarget(null); navigate(path) }} />

      <Modal open={Boolean(editTarget)} onClose={() => setEditTarget(null)} title="Editar nombre de referencia" description="Este nombre identifica la solicitud en toda la aplicación.">
        <form onSubmit={saveName}><label className="field-label" htmlFor="editNombre">Nombre de referencia</label><input id="editNombre" className={`text-input ${editError ? 'invalid' : ''}`} value={editName} onChange={(event) => { setEditName(event.target.value); setEditError('') }} maxLength="50" autoFocus />{editError && <p className="field-error">{editError}</p>}<div className="field-meta"><small>Cliente o empresa · máximo 50 caracteres</small><small>{editName.length}/50</small></div><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setEditTarget(null)}>Cancelar</button><button className="button primary">Guardar cambios</button></div></form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Eliminar solicitud" description="Esta acción es permanente y no puede deshacerse.">
        <div className="delete-message"><span className="danger-icon"><Trash2 /></span><p>¿Estás seguro de que deseas eliminar la solicitud de <strong>{deleteTarget?.nombreReferencia}</strong> y toda la información de sus secciones?</p></div>
        <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button><button type="button" className="button danger-button" onClick={remove}>Eliminar definitivamente</button></div>
      </Modal>
    </div>
  )
}

function SectionsModal({ solicitud, onClose, onNavigate }) {
  if (!solicitud) return null
  const flujoStatus = solicitud.flujoCaja?.cargaFinanciera === 'RECHAZADO' ? 'Rechazo' : solicitud.flujoCaja ? 'Completada' : 'En blanco'
  const sections = [
    { title: 'Plan de Pagos', icon: Banknote, color: 'green', status: solicitud.planPagos ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/plan-pagos` },
    { title: 'Flujo de Caja', icon: TrendingUp, color: 'burgundy', status: flujoStatus, path: `/solicitudes/${solicitud.id}/flujo-caja` },
    { title: 'Tamaño Actividad', icon: BarChart3, color: 'blue', status: solicitud.tamanoActividad ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/tamano-actividad` },
    { title: 'Balance General', icon: Scale, color: 'gold', status: solicitud.balanceGeneral ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/balance-general` },
  ]
  return <Modal open onClose={onClose} title="Selecciona una sección" description={solicitud.nombreReferencia} size="large"><div className="section-modal-grid">{sections.map(({ title, icon: Icon, color, status, path }) => <button type="button" key={title} className="section-modal-option" onClick={() => onNavigate(path)}><span className={`section-icon ${color}`}><Icon /></span><span className="section-modal-copy"><strong>{title}</strong><small>{status === 'En blanco' ? 'Pendiente de completar' : 'Información registrada'}</small></span><StatusBadge status={status} /></button>)}</div></Modal>
}
