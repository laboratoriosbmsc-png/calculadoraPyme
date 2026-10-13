function normalizeName(value) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

export function nombreReferenciaDuplicado(solicitudes, nombre, excludeId = null) {
  const normalized = normalizeName(nombre)
  return Boolean(normalized) && solicitudes.some((item) =>
    item.id !== excludeId && normalizeName(item.nombreReferencia) === normalized)
}
