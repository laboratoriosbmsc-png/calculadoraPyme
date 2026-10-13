import { useEffect } from 'react'

export function useUnsavedWarning(isDirty) {
  useEffect(() => {
    if (!isDirty) {
      delete document.documentElement.dataset.unsavedChanges
      return undefined
    }
    document.documentElement.dataset.unsavedChanges = 'true'
    const beforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const click = (event) => {
      const anchor = event.target.closest?.('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.href === window.location.href) return
      if (!window.confirm('Tienes cambios sin guardar. Si sales ahora, se perderán.')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', click, true)
    return () => {
      delete document.documentElement.dataset.unsavedChanges
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', click, true)
    }
  }, [isDirty])
}
