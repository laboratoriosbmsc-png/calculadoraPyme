export const STORAGE_KEY = 'solicitudes'

export function loadSolicitudes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSolicitudes(solicitudes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes))
}
