import { RefreshCw, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const PwaUpdatesContext = createContext(null)

function isUpdateBlocked() {
  return document.documentElement.dataset.unsavedChanges === 'true'
    || Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'))
}

export function PwaUpdatesProvider({ children }) {
  const [registration, setRegistration] = useState(null)
  const [updateBlocked, setUpdateBlocked] = useState(isUpdateBlocked)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState('')
  const [updateNoticeDismissed, setUpdateNoticeDismissed] = useState(false)
  const [controllerUpdated, setControllerUpdated] = useState(false)
  const checkingRef = useRef(false)
  const applyingRef = useRef(false)

  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, activeRegistration) {
      setRegistration(activeRegistration || null)
    },
    onRegisterError() {
      setNotice('No se pudo preparar la aplicación para usarla sin conexión.')
    },
    onNeedReload() {
      if (isUpdateBlocked()) setControllerUpdated(true)
      else window.location.reload()
    },
  })

  useEffect(() => {
    const observer = new MutationObserver(() => setUpdateBlocked(isUpdateBlocked()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-unsaved-changes'],
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (offlineReady) setNotice('Los archivos de la aplicación ya están disponibles sin conexión.')
  }, [offlineReady])

  useEffect(() => {
    if (needRefresh || controllerUpdated) setUpdateNoticeDismissed(false)
  }, [needRefresh, controllerUpdated])

  useEffect(() => {
    if (controllerUpdated && !updateBlocked && !isUpdateBlocked()) window.location.reload()
  }, [controllerUpdated, updateBlocked])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 5000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const checkForUpdates = useCallback(async ({ manual = false } = {}) => {
    if (!registration) {
      if (manual) setNotice('La comprobación de actualizaciones aún no está disponible.')
      return
    }
    if (!navigator.onLine) {
      if (manual) setNotice('Conéctate a internet para buscar actualizaciones.')
      return
    }
    if (checkingRef.current) return

    checkingRef.current = true
    setChecking(true)
    if (manual) setNotice('Buscando actualizaciones…')

    try {
      await registration.update()
      if (manual) setNotice('Comprobación finalizada. Si hay una nueva versión, se instalará al estar lista.')
    } catch {
      if (manual) setNotice('No se pudo comprobar si hay actualizaciones. Inténtalo de nuevo.')
    } finally {
      checkingRef.current = false
      setChecking(false)
    }
  }, [registration])

  useEffect(() => {
    if (!registration) return undefined

    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') void checkForUpdates()
    }
    const checkWhenOnline = () => void checkForUpdates()

    checkWhenVisible()
    document.addEventListener('visibilitychange', checkWhenVisible)
    window.addEventListener('online', checkWhenOnline)
    const interval = window.setInterval(checkWhenVisible, 60 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', checkWhenVisible)
      window.removeEventListener('online', checkWhenOnline)
      window.clearInterval(interval)
    }
  }, [registration, checkForUpdates])

  useEffect(() => {
    if (!needRefresh || updateBlocked || isUpdateBlocked() || applyingRef.current) return
    applyingRef.current = true
    updateServiceWorker(true).catch(() => {
      applyingRef.current = false
      setNotice('No se pudo aplicar la actualización. Inténtalo de nuevo desde el menú.')
    })
  }, [needRefresh, updateBlocked, updateServiceWorker])

  const showUpdateNotice = (needRefresh || controllerUpdated) && updateBlocked && !updateNoticeDismissed

  return (
    <PwaUpdatesContext.Provider value={{ checkForUpdates, checking }}>
      {children}
      {(showUpdateNotice || notice) && (
        <div className="pwa-update-notice" role="status" aria-live="polite">
          <RefreshCw size={19} aria-hidden="true" />
          <span>{showUpdateNotice
            ? 'Hay una nueva versión lista. Guarda tus cambios o cierra el cuadro abierto para actualizar sin perder lo que estás haciendo.'
            : notice}</span>
          <button
            type="button"
            onClick={() => showUpdateNotice ? setUpdateNoticeDismissed(true) : setNotice('')}
            aria-label="Cerrar aviso"
          ><X size={18} /></button>
        </div>
      )}
    </PwaUpdatesContext.Provider>
  )
}

export function usePwaUpdates() {
  const context = useContext(PwaUpdatesContext)
  if (!context) throw new Error('usePwaUpdates requiere PwaUpdatesProvider')
  return context
}
