import { ArrowLeft, Calculator, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning'
import { formatMoney, generarTablaDemo } from '../../services/calculos'
import { AMORTIZACIONES, PLAN_FIELDS } from '../../types/constants'

const defaults = {
  montoFinanciar: '', plazoAnios: '', tasaInteres: '', formaAmortizacion: '',
  tasaVariable: '', treMonedaNacional: '', seguroAnual: '',
}
const integerFields = ['montoFinanciar', 'plazoAnios']

export default function PlanPagosPage() {
  const { id } = useParams()
  const { solicitud, updateSolicitud } = useSolicitud(id)
  const [campos, setCampos] = useState(() => ({ ...defaults, ...(solicitud?.planPagos?.campos || {}) }))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const table = useMemo(
    () => solicitud?.planPagos?.tabla || generarTablaDemo(solicitud?.planPagos?.campos?.plazoAnios, solicitud?.planPagos?.campos?.formaAmortizacion),
    [solicitud?.planPagos],
  )
  useUnsavedWarning(dirty)
  if (!solicitud) return <Missing />

  const change = (name, value) => { setCampos((current) => ({ ...current, [name]: value })); setDirty(true); setErrors((current) => ({ ...current, [name]: '' })) }
  const validate = () => {
    const next = {}
    PLAN_FIELDS.forEach(([name, label]) => {
      if (campos[name] === '') next[name] = `${label} es obligatorio.`
      else if (Number(campos[name]) < 0) next[name] = 'El valor no puede ser negativo.'
      else if (integerFields.includes(name) && !Number.isInteger(Number(campos[name]))) next[name] = 'Ingresa un número sin decimales.'
    })
    if (!campos.formaAmortizacion) next.formaAmortizacion = 'Selecciona una forma de amortización.'
    setErrors(next)
    return Object.keys(next).length === 0
  }
  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return
    


     const tabla = generarTablaDemo(campos);
     console.log(campos["montoFinanciar"]);
/*
  const tabla =    Array.from({ length: 12 }, (_, index) => ({
      numeroCuota: index + 1,
      saldoCapital: 100000 - index * 8000,
      amortizacionCapital: 8000,
      intereses: Math.max(100 - index * 10, 0),
      seguros: seguros[index],
      cuotaTotal: 1000,
    }))*/


    if (updateSolicitud(id, { planPagos: { campos,  tabla } })) {
      setDirty(false)
      setResultOpen(true)
    }
  }

  return (
    <div className="page-container form-page">
      <Link className="back-link" to="/solicitudes"><ArrowLeft size={17} />Volver a solicitudes</Link>
      <header className="form-header"><div><span className="eyebrow">{solicitud.nombreReferencia}</span><h1>Plan de Pagos</h1><p>Registra las condiciones propuestas para el financiamiento.</p></div><span className="draft-label">{dirty ? 'Cambios sin guardar' : solicitud.planPagos ? 'Sección completada' : 'Sección en blanco'}</span></header>
      <form onSubmit={submit} noValidate>
        <section className="form-section surface"><div className="form-section-heading"><span>01</span><div><h2>Condiciones del financiamiento</h2><p>Todos los campos son obligatorios.</p></div></div>
          <div className="form-grid">
            {PLAN_FIELDS.map(([name, label]) => <NumberField key={name} name={name} label={label} value={campos[name]} onChange={change} error={errors[name]} integer={integerFields.includes(name)} suffix={name === 'montoFinanciar' ? 'Bs' : name === 'plazoAnios' ? 'años' : '%'} />)}
          </div>
        </section>
        <section className="form-section surface"><div className="form-section-heading"><span>02</span><div><h2>Forma de amortización</h2><p>Selecciona la frecuencia de pago propuesta.</p></div></div>
          <fieldset className="radio-fieldset"><legend className="sr-only">Forma de amortización</legend><div className="amortization-grid">{AMORTIZACIONES.map((option) => <label key={option} className={`radio-card ${campos.formaAmortizacion === option ? 'selected' : ''}`}><input type="radio" name="formaAmortizacion" value={option} checked={campos.formaAmortizacion === option} onChange={(event) => change('formaAmortizacion', event.target.value)} /><span className="radio-control" /><strong>{option}</strong></label>)}</div>{errors.formaAmortizacion && <p className="field-error">{errors.formaAmortizacion}</p>}</fieldset>
        </section>
        <div className="form-footer right">
          <button className="button primary large-button">
            <Calculator size={19} />Generar Plan de Pagos
          </button>
        </div>
      </form>
      {solicitud.planPagos && <PaymentTable rows={table} />}
      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Plan generado correctamente" description="La sección fue guardada y ya puedes consultar la tabla demostrativa.">
        <div className="modal-actions"><button type="button" className="button primary" onClick={() => setResultOpen(false)}>Ver plan generado</button></div>
      </Modal>
    </div>
  )
}

function NumberField({ name, label, value, onChange, error, integer, suffix }) {
  return <div className="field-group"><label className="field-label" htmlFor={name}>{label}</label><div className={`number-input ${error ? 'invalid' : ''}`}><input id={name} type="number" min="0" step={integer ? '1' : '0.01'} value={value} onChange={(event) => onChange(name, event.target.value)} inputMode={integer ? 'numeric' : 'decimal'} /><span>{suffix}</span></div>{error && <p className="field-error">{error}</p>}</div>
}

export function PaymentTable({ rows }) {
  const pageSize = 12
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const firstRow = (currentPage - 1) * pageSize
  const visibleRows = rows.slice(firstRow, firstRow + pageSize)

  useEffect(() => setPage(1), [rows])

  return <section className="surface table-section">
    <div className="section-heading"><div><h2>Plan de pago generado</h2></div></div>
    <div className="table-scroll"><table><thead><tr><th>Número cuota</th><th>Saldo capital</th><th>Amortización a capital</th><th>Intereses</th><th>Seguros</th><th>Cuota total</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.numeroCuota}><td><strong>{row.numeroCuota}</strong></td><td>{formatMoney(row.saldoCapital)}</td><td>{formatMoney(row.amortizacionCapital)}</td><td>{formatMoney(row.intereses)}</td><td>{formatMoney(row.seguros)}</td><td><strong>{formatMoney(row.cuotaTotal)}</strong></td></tr>)}</tbody></table></div>
    <div className="table-pagination">
      <span>Cuotas {rows.length ? firstRow + 1 : 0}–{Math.min(firstRow + pageSize, rows.length)} de {rows.length}</span>
      <div>
        <button type="button" className="pagination-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Página anterior"><ChevronLeft size={17} /></button>
        <strong>Página {currentPage} de {totalPages}</strong>
        <button type="button" className="pagination-button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} aria-label="Página siguiente"><ChevronRight size={17} /></button>
      </div>
    </div>
  </section>
}

function Missing() { return <div className="surface empty-state large-empty"><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver al listado</Link></div> }
