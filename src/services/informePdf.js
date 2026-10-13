import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { calcularLimiteFinanciamientoBalance, formatDate, formatIndex, formatMoney, getResultadoCargaFinanciera } from './calculos'
import { BALANCE_ACTIVOS_FIELDS, BALANCE_PASIVOS_FIELDS, FLUJO_FIELDS, PLAN_FIELDS, TAMANO_FIELDS } from '../types/constants'

const green = [0, 99, 65]
const muted = [91, 106, 119]

function printable(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function fileNameFor(solicitud) {
  const clean = solicitud.nombreReferencia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'solicitud'
  return `informe-${clean}.pdf`
}

export function createInformePdf(solicitud) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  const ensureSpace = (height) => {
    if (y + height > 278) {
      doc.addPage()
      y = 20
    }
  }

  const section = (title, rows) => {
    ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...green)
    doc.text(title, 16, y)
    y += 4
    autoTable(doc, {
      startY: y,
      margin: { left: 16, right: 16 },
      body: rows.length ? rows.map(([label, value]) => [label, printable(value)]) : [['Estado', 'Pendiente']],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.3, lineColor: [222, 231, 227], lineWidth: 0.1, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 85, textColor: muted }, 1: { textColor: [19, 42, 35] } },
      alternateRowStyles: { fillColor: [247, 250, 248] },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  doc.setFillColor(...green)
  doc.rect(0, 0, pageWidth, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Calculadora Pyme', 16, 19)
  y = 43
  doc.setTextColor(...green)
  doc.setFontSize(17)
  doc.text('Informe de evaluación', 16, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...muted)
  doc.text(doc.splitTextToSize(solicitud.nombreReferencia, pageWidth - 32), 16, y)
  y += 8
  doc.text(`Creación: ${formatDate(solicitud.fechaCreacion)}    Actualización: ${formatDate(solicitud.fechaActualizacion)}`, 16, y)
  y += 12

  const plan = solicitud.planPagos
  section('Plan de Pagos', plan ? [
    ...PLAN_FIELDS.map(([name, label]) => [label, plan.campos?.[name]]),
    ['Forma de amortización', plan.campos?.formaAmortizacion],
  ] : [])
  if (plan?.tabla?.length) {
    ensureSpace(22)
    autoTable(doc, {
      startY: y,
      margin: { left: 16, right: 16 },
      head: [['Cuota', 'Saldo capital', 'Amortización', 'Intereses', 'Seguros', 'Cuota total']],
      body: plan.tabla.map((row) => [row.numeroCuota, formatMoney(row.saldoCapital), formatMoney(row.amortizacionCapital), formatMoney(row.intereses), formatMoney(row.seguros), formatMoney(row.cuotaTotal)]),
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.7, halign: 'right' },
      headStyles: { fillColor: green, textColor: [255, 255, 255] },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  const flujo = solicitud.flujoCaja
  section('Flujo de Caja', flujo ? [
    ['Tipo de garantía', flujo.campos?.tipoGarantia],
    ...FLUJO_FIELDS.filter(([name]) => flujo.campos?.anadirActividad2 === 'SI' || !name.includes('Actividad2')).map(([name, label]) => [label, flujo.campos?.[name]]),
    ['Total flujo neto', `Bs ${formatMoney(flujo.totalFlujoNeto)}`],
    ['Carga financiera', typeof flujo.cargaFinanciera === 'number' ? `${formatMoney(flujo.cargaFinanciera)}%` : '—'],
    ['Resultado', getResultadoCargaFinanciera(flujo) || 'Sin resultado'],
  ] : [])

  const tamano = solicitud.tamanoActividad
  section('Tamaño Actividad', tamano ? [
    ['Sector (CAEDEC)', tamano.campos?.sector],
    ...TAMANO_FIELDS.map(([name, label]) => [label, name === 'personalOcupado' ? tamano.campos?.[name] : `Bs ${formatMoney(tamano.campos?.[name])}`]),
    ['Índice', formatIndex(tamano.indice)],
    ['Resultado final', tamano.resultadoFinal],
  ] : [])

  const balance = solicitud.balanceGeneral
  section('Balance General', balance ? [
    ['Tipo de garantía', balance.campos?.tipoGarantia],
    ...[...BALANCE_ACTIVOS_FIELDS, ...BALANCE_PASIVOS_FIELDS].map(([name, label]) => [label, `Bs ${formatMoney(balance.campos?.[name])}`]),
    ['Total activos', `Bs ${formatMoney(balance.totalActivos)}`],
    ['Total pasivos', `Bs ${formatMoney(balance.totalPasivos)}`],
    ['Total patrimonio', `Bs ${formatMoney(balance.totalActivos - balance.totalPasivos)}`],
    ['Límite de financiamiento', `Bs ${formatMoney(calcularLimiteFinanciamientoBalance(balance.totalActivos, balance.totalPasivos, balance.campos?.tipoGarantia))}`],
  ] : [])

  const pages = doc.internal.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(...muted)
    doc.text('Calculadora Pyme · Uso interno', 16, 289)
    doc.text(`${page} / ${pages}`, pageWidth - 16, 289, { align: 'right' })
  }

  return { blob: doc.output('blob'), fileName: fileNameFor(solicitud) }
}
