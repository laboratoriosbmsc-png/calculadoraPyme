import { CheckCircle2 } from 'lucide-react'
import { useEffect } from 'react'

export default function SaveToast({ onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(false), 2600)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return <div className="success-banner save-toast" role="status" aria-live="polite"><CheckCircle2 size={19} />La información se guardó correctamente.</div>
}
