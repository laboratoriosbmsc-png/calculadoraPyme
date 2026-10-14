import { Banknote, BarChart3, Scale, TrendingUp } from 'lucide-react'
import Modal from './Modal'
import { SolicitudActionsMenu } from './SolicitudActions'
import StatusBadge from './StatusBadge'
import { getResultadoCargaFinanciera } from '../services/calculos'

export default function SectionsModal({ solicitud, onClose, onNavigate, actions, currentPath }) {
  if (!solicitud) return null
  const flujoStatus = getResultadoCargaFinanciera(solicitud.flujoCaja) === 'RECHAZADO' ? 'Rechazo' : solicitud.flujoCaja ? 'Completada' : 'En blanco'
  const sections = [
    { title: 'Plan de Pagos', icon: Banknote, color: 'green', status: solicitud.planPagos ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/plan-pagos` },
    { title: 'Flujo de Caja', icon: TrendingUp, color: 'burgundy', status: flujoStatus, path: `/solicitudes/${solicitud.id}/flujo-caja` },
    { title: 'Tamaño Actividad', icon: BarChart3, color: 'blue', status: solicitud.tamanoActividad ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/tamano-actividad` },
    { title: 'Balance General', icon: Scale, color: 'gold', status: solicitud.balanceGeneral ? 'Completada' : 'En blanco', path: `/solicitudes/${solicitud.id}/balance-general` },
  ]
  return <Modal open onClose={onClose} title="Selecciona una sección" description={solicitud.nombreReferencia} size="large" headerActions={<SolicitudActionsMenu solicitud={solicitud} {...actions} />}>
    <div className="section-modal-grid">{sections.map(({ title, icon: Icon, color, status, path }) => {
      const isCurrent = currentPath === path
      return <button type="button" key={title} className={`section-modal-option ${isCurrent ? 'is-current' : ''}`} aria-current={isCurrent ? 'page' : undefined} onClick={() => onNavigate(path)}><span className={`section-icon ${color}`}><Icon /></span><span className="section-modal-copy"><strong>{title}</strong><small>{isCurrent ? 'Sección actual' : status === 'En blanco' ? 'Pendiente de completar' : 'Información registrada'}</small></span><StatusBadge status={status} /></button>
    })}</div>
  </Modal>
}
