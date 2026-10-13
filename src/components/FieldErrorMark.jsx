import { AlertCircle } from 'lucide-react'

export default function FieldErrorMark({ error, id }) {
  if (!error) return null

  return <span id={id} className="compact-error-mark" title={error} role="alert"><AlertCircle size={14} aria-hidden="true" /><span className="sr-only">{error}</span></span>
}
