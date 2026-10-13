import { ArrowLeft, Calculator, CheckCircle2, Printer, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { calcularLimiteFinanciamientoBalance, formatDate, formatIndex, formatMoney, getResultadoCargaFinanciera } from '../../services/calculos'
import { BALANCE_ACTIVOS_FIELDS, BALANCE_PASIVOS_FIELDS, FLUJO_FIELDS, PLAN_FIELDS, TAMANO_FIELDS } from '../../types/constants'

export default function InformePage() {
  const { id } = useParams()
  const { solicitud } = useSolicitud(id)
  if (!solicitud) return <div className="report-page"><div className="empty-state"><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver</Link></div></div>
  const resultadoFlujo = getResultadoCargaFinanciera(solicitud.flujoCaja)
  const cargaPorcentaje = typeof solicitud.flujoCaja?.cargaFinanciera === 'number' ? solicitud.flujoCaja.cargaFinanciera : null
  return (
    <main className="report-page">
      <div className="report-toolbar no-print"><Link className="back-link" to="/solicitudes"><ArrowLeft size={17} />Volver a solicitudes</Link><button type="button" className="button primary" onClick={() => window.print()}><Printer size={18} />Imprimir o guardar PDF</button></div>
      <article className="report-sheet">
        <header className="report-header"><div className="report-brand"><span><Calculator /></span><strong>Calculadora <em>Pyme</em></strong></div><div><span>INFORME DE EVALUACIÓN</span></div></header>
        <section className="report-title"><span className="eyebrow">Solicitud Pyme</span><h1>{solicitud.nombreReferencia}</h1><div><span><small>Fecha de creación</small>{formatDate(solicitud.fechaCreacion)}</span><span><small>Última actualización</small>{formatDate(solicitud.fechaActualizacion)}</span></div></section>
        <ReportSection title="Plan de Pagos" status={solicitud.planPagos ? 'Completada' : 'Pendiente'}>
          {solicitud.planPagos ? <><dl className="report-data">{PLAN_FIELDS.map(([name, label]) => <div key={name}><dt>{label}</dt><dd>{solicitud.planPagos.campos[name]}</dd></div>)}<div><dt>Forma de amortización</dt><dd>{solicitud.planPagos.campos.formaAmortizacion}</dd></div></dl><div className="report-table"><table><thead><tr><th>Cuota</th><th>Saldo capital</th><th>Amortización</th><th>Intereses</th><th>Seguros</th><th>Cuota total</th></tr></thead><tbody>{solicitud.planPagos.tabla.map((row) => <tr key={row.numeroCuota}><td>{row.numeroCuota}</td><td>{formatMoney(row.saldoCapital)}</td><td>{formatMoney(row.amortizacionCapital)}</td><td>{formatMoney(row.intereses)}</td><td>{formatMoney(row.seguros)}</td><td>{formatMoney(row.cuotaTotal)}</td></tr>)}</tbody></table></div></> : <Pending />}
        </ReportSection>
        <ReportSection title="Flujo de Caja" status={resultadoFlujo === 'RECHAZADO' ? 'Rechazo' : solicitud.flujoCaja ? 'Completada' : 'Pendiente'}>
          {solicitud.flujoCaja ? <><dl className="report-data"><div><dt>Tipo de garantía</dt><dd>{solicitud.flujoCaja.campos.tipoGarantia}</dd></div>{FLUJO_FIELDS.filter(([name]) => solicitud.flujoCaja.campos.anadirActividad2 === 'SI' || !name.includes('Actividad2')).map(([name, label]) => <div key={name}><dt>{label}</dt><dd>{solicitud.flujoCaja.campos[name]}</dd></div>)}</dl><div className="report-result"><span>Total flujo neto <strong>Bs {formatMoney(solicitud.flujoCaja.totalFlujoNeto)}</strong></span>{cargaPorcentaje !== null && <span>Carga financiera <strong>{formatMoney(cargaPorcentaje)}%</strong></span>}<span className={(resultadoFlujo || '').toLowerCase()}>{resultadoFlujo === 'APROBADO' ? <CheckCircle2 /> : <XCircle />}<strong>{resultadoFlujo || 'Sin resultado'}</strong></span></div></> : <Pending />}
        </ReportSection>
        <ReportSection title="Tamaño Actividad" status={solicitud.tamanoActividad ? 'Completada' : 'Pendiente'}>
          {solicitud.tamanoActividad ? <><dl className="report-data"><div><dt>Sector (CAEDEC)</dt><dd>{solicitud.tamanoActividad.campos.sector}</dd></div>{TAMANO_FIELDS.map(([name, label]) => <div key={name}><dt>{label}</dt><dd>{name === 'personalOcupado' ? solicitud.tamanoActividad.campos[name] : `Bs ${formatMoney(solicitud.tamanoActividad.campos[name])}`}</dd></div>)}</dl><div className="report-result"><span>Índice <strong>{formatIndex(solicitud.tamanoActividad.indice)}</strong></span><span className="classification"><strong>{solicitud.tamanoActividad.resultadoFinal}</strong></span></div></> : <Pending />}
        </ReportSection>
        <ReportSection title="Balance General" status={solicitud.balanceGeneral ? 'Completada' : 'Pendiente'}>
          {solicitud.balanceGeneral ? <><dl className="report-data"><div><dt>Tipo de garantía</dt><dd>{solicitud.balanceGeneral.campos.tipoGarantia}</dd></div>{[...BALANCE_ACTIVOS_FIELDS, ...BALANCE_PASIVOS_FIELDS].map(([name, label]) => <div key={name}><dt>{label}</dt><dd>Bs {formatMoney(solicitud.balanceGeneral.campos[name])}</dd></div>)}</dl><div className="report-result report-balance-result"><span>Total activos <strong>Bs {formatMoney(solicitud.balanceGeneral.totalActivos)}</strong></span><span>Total pasivos <strong>Bs {formatMoney(solicitud.balanceGeneral.totalPasivos)}</strong></span><span>Total patrimonio <strong>Bs {formatMoney(solicitud.balanceGeneral.totalActivos - solicitud.balanceGeneral.totalPasivos)}</strong></span><span>Límite de financiamiento <strong>Bs {formatMoney(calcularLimiteFinanciamientoBalance(solicitud.balanceGeneral.totalActivos, solicitud.balanceGeneral.totalPasivos, solicitud.balanceGeneral.campos.tipoGarantia))}</strong></span></div></> : <Pending />}
        </ReportSection>
        <footer className="report-footer"><span>Calculadora Pyme · Uso interno</span></footer>
      </article>
    </main>
  )
}

function ReportSection({ title, status, children }) { return <section className="report-section"><div className="report-section-head"><h2>{title}</h2><span className={status.toLowerCase()}>{status}</span></div>{children}</section> }
function Pending() { return <p className="report-pending">Esta sección aún no fue completada.</p> }
