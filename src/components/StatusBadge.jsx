import { CheckCircle2, Circle, Clock3, XCircle } from 'lucide-react'

export default function StatusBadge({ status }) {
  const normalized = status.toLowerCase().replace(' ', '-')
  const Icon = status === 'Completada' ? CheckCircle2 : status === 'Rechazo' ? XCircle : status === 'En desarrollo' ? Clock3 : Circle
  return <span className={`status-badge ${normalized}`}><Icon size={14} aria-hidden="true" />{status}</span>
}
