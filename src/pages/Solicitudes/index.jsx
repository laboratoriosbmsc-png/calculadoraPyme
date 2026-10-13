import { Banknote, BarChart3, ChevronLeft, ChevronRight, Ellipsis, Eye, FilePlus2, Pencil, Plus, Scale, Search, Share2, Trash2, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal'
import NuevaSolicitudModal from '../../components/NuevaSolicitudModal'
import StatusBadge from '../../components/StatusBadge'
import { useSolicitudes } from '../../hooks/useSolicitudes'
import { formatDate, getResultadoCargaFinanciera } from '../../services/calculos'
import { nombreReferenciaDuplicado } from '../../services/nombreReferencia'

export default function SolicitudesPage() {
  const [newOpen, setNewOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [sectionsTarget, setSectionsTarget] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [menuPosition, setMenuPosition] = useState(null)
  const [sharePdf, setSharePdf] = useState(null)
  const [sharingId, setSharingId] = useState(null)
  const [shareNotice, setShareNotice] = useState('')
  const [page, setPage] = useState(1)
  const { solicitudesPropias, deleteSolicitud, updateSolicitud } = useSolicitudes()
  const navigate = useNavigate()
  const filtered = useMemo(() => solicitudesPropias.filter((item) => item.nombreReferencia.toLowerCase().includes(query.toLowerCase())).sort((a, b) => new Date(b.fechaActualizacion) - new Date(a.fechaActualizacion)), [solicitudesPropias, query])
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const firstRow = (currentPage - 1) * pageSize
  const visibleRequests = filtered.slice(firstRow, firstRow + pageSize)

  useEffect(() => setPage(1), [query])

  useEffect(() => {
    if (!shareNotice) return undefined
    const timeout = window.setTimeout(() => setShareNotice(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [shareNotice])

  useEffect(() => {
    const closeMenu = (event) => {
      if (!event.target.closest('.request-actions-menu, .request-actions-popover')) setMenuOpenId(null)
    }
    const closeOnEscape = (event) => event.key === 'Escape' && setMenuOpenId(null)
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  useEffect(() => {
    if (!menuOpenId) return undefined
    const closeFloatingMenu = () => setMenuOpenId(null)
    window.addEventListener('resize', closeFloatingMenu)
    window.addEventListener('scroll', closeFloatingMenu, true)
    return () => {
      window.removeEventListener('resize', closeFloatingMenu)
      window.removeEventListener('scroll', closeFloatingMenu, true)
    }
  }, [menuOpenId])

  const toggleActionsMenu = (item, event) => {
    if (menuOpenId === item.id) {
      setMenuOpenId(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 190
    const menuHeight = window.matchMedia('(max-width: 900px)').matches ? 186 : 144
    const gap = 6
    const openUp = window.innerHeight - rect.bottom < menuHeight + gap
    setMenuPosition({
      top: openUp ? Math.max(8, rect.top - menuHeight - gap) : rect.bottom + gap,
      left: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth)),
    })
    setMenuOpenId(item.id)
  }

  const shareReport = async (item) => {
    if (sharingId) return
    setMenuOpenId(null)
    setShareNotice('')
    const cachedFile = sharePdf?.itemId === item.id && sharePdf.updatedAt === item.fechaActualizacion ? sharePdf.file : null
    if (!cachedFile) setSharingId(item.id)
    try {
      let file = cachedFile
      if (!file) {
        const { createInformePdf } = await import('../../services/informePdf')
        const { blob, fileName } = await createInformePdf(item)
        file = new File([blob], fileName, { type: 'application/pdf' })
      }
      setSharingId(null)
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        try {
          await navigator.share({ files: [file], title: `Informe de ${item.nombreReferencia}` })
          setSharePdf(null)
        } catch (error) {
          if (error.name === 'AbortError') {
            setSharePdf(null)
          } else if (error.name === 'NotAllowedError' && !cachedFile) {
            setSharePdf({ itemId: item.id, updatedAt: item.fechaActualizacion, file })
            setShareNotice('El PDF está listo. Abre el menú y pulsa Compartir informe otra vez.')
          } else {
            throw error
          }
        }
      } else {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        setSharePdf(null)
        setShareNotice('Tu navegador no permite compartir archivos; se descargó el PDF.')
      }
    } catch (error) {
      setSharePdf(null)
      if (error.name !== 'AbortError') setShareNotice('No se pudo compartir el PDF. Inténtalo de nuevo.')
    } finally {
      setSharingId(null)
    }
  }

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
    if (nombreReferenciaDuplicado(solicitudesPropias, clean, editTarget.id)) return setEditError('Ya existe una solicitud con ese nombre. Usa otro nombre.')
    if (updateSolicitud(editTarget.id, { nombreReferencia: clean })) setEditTarget(null)
  }

  const requestDelete = (item) => {
    setMenuOpenId(null)
    setDeleteTarget(item)
  }

  return (
    <div className="page-container">
      <header className="page-heading"><div><h1>Solicitudes</h1><p>Gestiona los análisis registrados para tus clientes.</p></div><button type="button" className="button primary" onClick={() => setNewOpen(true)}><Plus size={19} />Nueva solicitud</button></header>
      {(sharingId || shareNotice) && <div className="share-report-notice" role="status">{sharingId ? 'Preparando el PDF para compartir…' : shareNotice}</div>}
      <div className="toolbar surface"><div className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre de referencia" aria-label="Buscar solicitudes" /></div><span className="result-count">{filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'}</span></div>
      {filtered.length ? (
        <div className="surface requests-table-panel">
          <div className="requests-table-scroll">
            <table className="requests-table">
              <colgroup><col className="request-client-column" /><col /></colgroup>
              <thead><tr><th>Solicitud</th><th>Secciones</th></tr></thead>
              <tbody>{visibleRequests.map((item) => <tr key={item.id}>
                <td><div className="request-table-identity"><div><button type="button" className="request-name-button" onClick={() => setSectionsTarget(item)}>{item.nombreReferencia}</button><small><Pencil size={10} aria-hidden="true" />{formatDate(item.fechaActualizacion)}</small></div></div></td>
                <td><div className="request-sections-cell"><RequestSectionLinks item={item} /><div className="card-menu-container request-actions-menu">
                    <button type="button" className="icon-button card-menu-trigger" onClick={(event) => toggleActionsMenu(item, event)} aria-label={`Opciones de ${item.nombreReferencia}`} aria-expanded={menuOpenId === item.id} aria-haspopup="menu"><Ellipsis size={20} /></button>
                    {menuOpenId === item.id && menuPosition && createPortal(<div className="card-menu-popover request-actions-popover" role="menu" style={menuPosition}>
                      <button type="button" role="menuitem" onClick={() => { setMenuOpenId(null); navigate(`/solicitudes/${item.id}/informe`) }}><Eye size={17} />Ver informe</button>
                      <button type="button" role="menuitem" className="share-report-option" disabled={Boolean(sharingId)} onClick={() => shareReport(item)}><Share2 size={17} />Compartir informe</button>
                      <button type="button" role="menuitem" onClick={() => openEdit(item)}><Pencil size={17} />Editar nombre</button>
                      <button type="button" role="menuitem" className="danger" onClick={() => requestDelete(item)}><Trash2 size={17} />Eliminar</button>
                    </div>, document.body)}
                  </div></div></td>
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

function SectionsModal({ solicitud, onClose, onNavigate }) {
  if (!solicitud) return null
  const flujoStatus = getResultadoCargaFinanciera(solicitud.flujoCaja) === 'RECHAZADO' ? 'Rechazo' : solicitud.flujoCaja ? 'Completada' : 'En blanco'
  const sections = [
    { title: 'Plan de Pagos', icon: Banknote, color: 'green', status: solicitud.planPagos ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/plan-pagos` },
    { title: 'Flujo de Caja', icon: TrendingUp, color: 'burgundy', status: flujoStatus, path: `/solicitudes/${solicitud.id}/flujo-caja` },
    { title: 'Tamaño Actividad', icon: BarChart3, color: 'blue', status: solicitud.tamanoActividad ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/tamano-actividad` },
    { title: 'Balance General', icon: Scale, color: 'gold', status: solicitud.balanceGeneral ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/balance-general` },
  ]
  return <Modal open onClose={onClose} title="Selecciona una sección" description={solicitud.nombreReferencia} size="large"><div className="section-modal-grid">{sections.map(({ title, icon: Icon, color, status, path }) => <button type="button" key={title} className="section-modal-option" onClick={() => onNavigate(path)}><span className={`section-icon ${color}`}><Icon /></span><span className="section-modal-copy"><strong>{title}</strong><small>{status === 'En blanco' ? 'Pendiente de completar' : 'Información registrada'}</small></span><StatusBadge status={status} /></button>)}</div></Modal>
}
