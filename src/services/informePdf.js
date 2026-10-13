import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { jsPDF } from 'jspdf'
import { ReportSheet } from '../pages/Solicitudes/Informe'

function fileNameFor(solicitud) {
  const clean = solicitud.nombreReferencia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'solicitud'
  return 'informe-' + clean + '.pdf'
}

// The on-screen report is the single source for both the viewed and shared PDF.
export async function createInformePdf(solicitud) {
  const container = document.createElement('div')
  container.className = 'pdf-render-root'
  container.innerHTML = renderToStaticMarkup(createElement(ReportSheet, { solicitud }))
  document.body.appendChild(container)

  try {
    await document.fonts.ready
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    await doc.html(container.querySelector('.report-sheet'), {
      margin: [12, 12, 12, 12],
      autoPaging: 'text',
      width: 186,
      windowWidth: 703,
      html2canvas: { backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
    })
    return { blob: doc.output('blob'), fileName: fileNameFor(solicitud) }
  } finally {
    container.remove()
  }
}
