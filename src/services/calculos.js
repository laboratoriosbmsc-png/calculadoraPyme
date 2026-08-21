const seguros = [10, 9.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5]

export function sumarCampos(campos, nombres) {
  return nombres.reduce((total, nombre) => total + (Number(campos[nombre]) || 0), 0)
}

export function generarTablaDemo() {
  return Array.from({ length: 12 }, (_, index) => ({
    numeroCuota: index + 1,
    saldoCapital: 100000 - index * 8000,
    amortizacionCapital: 8000,
    intereses: Math.max(100 - index * 10, 0),
    seguros: seguros[index],
    cuotaTotal: 1000,
  }))
}

export function formatMoney(value) {
  return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

export function formatDate(value, includeTime = true) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}
