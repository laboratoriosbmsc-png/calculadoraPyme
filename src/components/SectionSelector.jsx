import { LayoutGrid } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import SectionsModal from './SectionsModal'
import { SolicitudActionDialogs, useSolicitudActions } from './SolicitudActions'

const unsavedMessage = 'Tienes cambios sin guardar. Si sales ahora, se perderán.'

export function SectionSelectorButton({ onClick, dirty = false }) {
  const openSelector = () => {
    if (dirty && !window.confirm(unsavedMessage)) return
    onClick()
  }
  return <button type="button" className="button secondary large-button section-selector-button" onClick={openSelector}><LayoutGrid size={19} />Selecciona una sección</button>
}

export function SectionSelectorDialog({ open, onClose, solicitud, dirty }) {
  const navigate = useNavigate()
  const location = useLocation()
  const actions = useSolicitudActions(() => navigate('/solicitudes'))

  const navigateFromSelector = (path) => {
    onClose()
    if (path !== location.pathname) navigate(path)
  }

  const viewReport = () => navigateFromSelector(`/solicitudes/${solicitud.id}/informe`)
  const shareReport = () => {
    if (dirty && !window.confirm('El PDF incluirá solo los datos guardados. Los cambios actuales permanecerán en pantalla. ¿Deseas compartirlo?')) return
    onClose()
    actions.shareReport(solicitud)
  }
  const editName = () => {
    onClose()
    actions.openEdit(solicitud)
  }
  const deleteRequest = () => {
    onClose()
    actions.setDeleteTarget(solicitud)
  }

  return <>
    {open && <SectionsModal solicitud={solicitud} currentPath={location.pathname} onClose={onClose} onNavigate={navigateFromSelector} actions={{ onView: viewReport, onShare: shareReport, onEdit: editName, onDelete: deleteRequest, sharingId: actions.sharingId }} />}
    <SolicitudActionDialogs actions={actions} />
  </>
}
