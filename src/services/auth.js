const SESSION_KEY = 'calculadoraPymeSession'

export function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

export function isCorporateEmail(value) {
  return /^[a-z0-9._%+-]+@bmsc\.com\.bo$/i.test(normalizeEmail(value))
}

export function createSession(email) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: normalizeEmail(email) }))
}

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
