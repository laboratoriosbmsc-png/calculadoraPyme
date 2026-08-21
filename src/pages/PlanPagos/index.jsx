import { ArrowLeft, Calculator, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning'
import { formatMoney, generarTablaDemo, sumarCampos } from '../../services/calculos'
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
  const [savedResult, setSavedResult] = useState(solicitud?.planPagos?.resultadoSuma ?? null)
  const table = useMemo(() => solicitud?.planPagos?.tabla || generarTablaDemo(), [solicitud?.planPagos?.tabla])
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
    const resultadoSuma = sumarCampos(campos, PLAN_FIELDS.map(([name]) => name))
    const tabla = generarTablaDemo()
    if (updateSolicitud(id, { planPagos: { campos, resultadoSuma, tabla } })) {
      setSavedResult(resultadoSuma)
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
        <div className="form-footer"><div className="info-inline"><Info size={18} /><span>El resultado y la tabla son demostrativos; no constituyen un cálculo financiero real.</span></div><button className="button primary large-button"><Calculator size={19} />Generar Plan de Pagos</button></div>
      </form>
      {solicitud.planPagos && <PaymentTable rows={table} />}
      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Plan generado correctamente" description="La sección fue guardada y ya puedes consultar la tabla demostrativa.">
        <div className="result-panel"><span>Resultado de la suma provisional</span><strong>Bs {formatMoney(savedResult)}</strong><small>Incluye únicamente los campos numéricos editables.</small></div><div className="modal-actions"><button type="button" className="button primary" onClick={() => setResultOpen(false)}>Ver plan generado</button></div>
      </Modal>
    </div>
  )
}

function NumberField({ name, label, value, onChange, error, integer, suffix }) {
  return <div className="field-group"><label className="field-label" htmlFor={name}>{label}</label><div className={`number-input ${error ? 'invalid' : ''}`}><input id={name} type="number" min="0" step={integer ? '1' : '0.01'} value={value} onChange={(event) => onChange(name, event.target.value)} inputMode={integer ? 'numeric' : 'decimal'} /><span>{suffix}</span></div>{error && <p className="field-error">{error}</p>}</div>
}

export function PaymentTable({ rows }) {
  return <section className="surface table-section"><div className="section-heading"><div><h2>Plan de pago generado</h2><p>Datos de ejemplo para validar la presentación.</p></div><span className="demo-pill">DEMO</span></div><div className="table-scroll"><table><thead><tr><th>Número cuota</th><th>Saldo capital</th><th>Amortización a capital</th><th>Intereses</th><th>Seguros</th><th>Cuota total</th></tr></thead><tbody>{rows.map((row) => <tr key={row.numeroCuota}><td><strong>{row.numeroCuota}</strong></td><td>{formatMoney(row.saldoCapital)}</td><td>{formatMoney(row.amortizacionCapital)}</td><td>{formatMoney(row.intereses)}</td><td>{formatMoney(row.seguros)}</td><td><strong>{formatMoney(row.cuotaTotal)}</strong></td></tr>)}</tbody></table></div></section>
}

function Missing() { return <div className="surface empty-state large-empty"><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver al listado</Link></div> }
