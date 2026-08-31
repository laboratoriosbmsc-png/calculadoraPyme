import { createContext, useContext, useMemo, useState } from 'react'
import { getSession } from '../services/auth'
import { loadSolicitudes, saveSolicitudes } from '../storage/solicitudes'

const SolicitudesContext = createContext(null)

export function SolicitudesProvider({ children }) {
  const [solicitudes, setSolicitudes] = useState(loadSolicitudes)
  const [storageError, setStorageError] = useState('')

  const persist = (next) => {
    try {
      saveSolicitudes(next)
      setSolicitudes(next)
      setStorageError('')
      return true
    } catch {
      setStorageError('No se pudieron guardar los cambios en este navegador. Revisa el espacio disponible e inténtalo de nuevo.')
      return false
    }
  }

  const value = useMemo(() => ({
    solicitudes,
    storageError,
    clearStorageError: () => setStorageError(''),
    createSolicitud(nombreReferencia) {
      const now = new Date().toISOString()
      const solicitud = {
        id: crypto.randomUUID(),
        propietarioEmail: getSession()?.email,
        nombreReferencia: nombreReferencia.trim(),
        fechaCreacion: now,
        fechaActualizacion: now,
        planPagos: null,
        flujoCaja: null,
        tamanoActividad: null,
        balanceGeneral: null,
      }
      return persist([solicitud, ...solicitudes]) ? solicitud : null
    },
    updateSolicitud(id, changes) {
      const email = getSession()?.email
      const next = solicitudes.map((item) => item.id === id && item.propietarioEmail === email
        ? { ...item, ...changes, fechaActualizacion: new Date().toISOString() }
        : item)
      return persist(next)
    },
    deleteSolicitud(id) {
      const email = getSession()?.email
      return persist(solicitudes.filter((item) => !(item.id === id && item.propietarioEmail === email)))
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [solicitudes, storageError])

  return <SolicitudesContext.Provider value={value}>{children}</SolicitudesContext.Provider>
}

export function useSolicitudes() {
  const context = useContext(SolicitudesContext)
  if (!context) throw new Error('useSolicitudes requiere SolicitudesProvider')
  const email = getSession()?.email
  const solicitudesPropias = context.solicitudes.filter((item) => item.propietarioEmail === email)

  
  return { ...context, solicitudesPropias }
}

export function useSolicitud(id) {
  const { solicitudesPropias, ...rest } = useSolicitudes()
  return { solicitud: solicitudesPropias.find((item) => item.id === id), solicitudesPropias, ...rest }
}
