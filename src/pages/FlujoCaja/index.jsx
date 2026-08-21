import { ArrowLeft, CheckCircle2, Info, Save, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning'
import { formatMoney, sumarCampos } from '../../services/calculos'
import { FLUJO_FIELDS, GARANTIAS } from '../../types/constants'

const defaults = {
  tipoGarantia: '', ingresosActividad1: '', costosActividad1: '', margenActividad1: '',
  anadirActividad2: '', ingresosActividad2: '', costosActividad2: '', margenActividad2: '',
  otrosIngresos: '', gastosFamiliares: '', margenOperativoTotal: '', cuotaPropuesta: '', cuotaSistemaFinanciero: '',
}
const decimalFields = ['cuotaSistemaFinanciero']

export default function FlujoCajaPage() {
  const { id } = useParams()
  const { solicitud, updateSolicitud } = useSolicitud(id)
  const [campos, setCampos] = useState(() => ({ ...defaults, ...(solicitud?.flujoCaja?.campos || {}) }))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  useUnsavedWarning(dirty)
  const activeNames = useMemo(() => FLUJO_FIELDS.map(([name]) => name).filter((name) => campos.anadirActividad2 === 'SI' || !name.includes('Actividad2')), [campos.anadirActividad2])
  const complete = Boolean(campos.tipoGarantia && campos.anadirActividad2 && activeNames.every((name) => campos[name] !== ''))
  const total = complete ? sumarCampos(campos, activeNames) : null
  const carga = total === null ? null : total >= 10 ? 'APROBADO' : 'RECHAZADO'
  if (!solicitud) return <Missing />

  const change = (name, value) => {
    setCampos((current) => ({ ...current, [name]: value, ...(name === 'anadirActividad2' && value === 'NO' ? { ingresosActividad2: '', costosActividad2: '', margenActividad2: '' } : {}) }))
    setDirty(true); setSaved(false); setErrors((current) => ({ ...current, [name]: '' }))
  }
  const validate = () => {
    const next = {}
    if (!campos.tipoGarantia) next.tipoGarantia = 'Selecciona un tipo de garantía.'
    if (!campos.anadirActividad2) next.anadirActividad2 = 'Selecciona Sí o No.'
    activeNames.forEach((name) => {
      const label = FLUJO_FIELDS.find(([key]) => key === name)?.[1]
      if (campos[name] === '') next[name] = `${label} es obligatorio.`
      else if (Number(campos[name]) < 0) next[name] = 'El valor no puede ser negativo.'
      else if (!decimalFields.includes(name) && !Number.isInteger(Number(campos[name]))) next[name] = 'Ingresa un número sin decimales.'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }
  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return
    const finalTotal = sumarCampos(campos, activeNames)
    const finalCarga = finalTotal >= 10 ? 'APROBADO' : 'RECHAZADO'
    if (updateSolicitud(id, { flujoCaja: { campos, totalFlujoNeto: finalTotal, cargaFinanciera: finalCarga } })) { setDirty(false); setSaved(true) }
  }

  return (
    <div className="page-container form-page">
      <Link className="back-link" to="/solicitudes"><ArrowLeft size={17} />Volver a solicitudes</Link>
      <header className="form-header"><div><span className="eyebrow">{solicitud.nombreReferencia}</span><h1>Flujo de Caja</h1><p>Registra la información mensual para evaluar la carga financiera.</p></div><span className="draft-label">{dirty ? 'Cambios sin guardar' : solicitud.flujoCaja ? 'Sección completada' : 'Sección en blanco'}</span></header>
      {saved && <div className="success-banner" role="status"><CheckCircle2 size={19} />La información se guardó correctamente.</div>}
      <form onSubmit={submit} noValidate>
        <section className="form-section surface"><div className="form-section-heading"><span>01</span><div><h2>Garantía</h2><p>Selecciona la condición que aplica a la operación.</p></div></div><fieldset className="guarantee-fieldset"><legend className="field-label">Tipo de garantía</legend><div className="guarantee-options">{GARANTIAS.map((option) => <label key={option} className={`guarantee-option ${campos.tipoGarantia === option ? 'selected' : ''}`}><input type="radio" name="tipoGarantia" value={option} checked={campos.tipoGarantia === option} onChange={(event) => change('tipoGarantia', event.target.value)} /><span className="radio-control" /><strong>{option}</strong></label>)}</div>{errors.tipoGarantia && <p className="field-error">{errors.tipoGarantia}</p>}</fieldset></section>
        <section className="form-section surface"><div className="form-section-heading"><span>02</span><div><h2>Actividad económica principal</h2><p>Datos mensuales de la primera actividad.</p></div></div><div className="form-grid">{FLUJO_FIELDS.slice(0, 3).map(([name, label]) => <FlowField key={name} name={name} label={label} value={campos[name]} onChange={change} error={errors[name]} />)}</div></section>
        <section className="form-section surface"><div className="form-section-heading"><span>03</span><div><h2>Segunda actividad</h2><p>Agrega otra fuente de actividad cuando corresponda.</p></div></div><fieldset className="yes-no-fieldset"><legend>¿Desea añadir una 2da actividad?</legend><div><label className={campos.anadirActividad2 === 'SI' ? 'selected' : ''}><input type="radio" name="anadirActividad2" value="SI" checked={campos.anadirActividad2 === 'SI'} onChange={(event) => change('anadirActividad2', event.target.value)} />Sí</label><label className={campos.anadirActividad2 === 'NO' ? 'selected' : ''}><input type="radio" name="anadirActividad2" value="NO" checked={campos.anadirActividad2 === 'NO'} onChange={(event) => change('anadirActividad2', event.target.value)} />No</label></div>{errors.anadirActividad2 && <p className="field-error">{errors.anadirActividad2}</p>}</fieldset>{campos.anadirActividad2 === 'SI' && <div className="form-grid activity-two">{FLUJO_FIELDS.slice(3, 6).map(([name, label]) => <FlowField key={name} name={name} label={label} value={campos[name]} onChange={change} error={errors[name]} />)}</div>}</section>
        <section className="form-section surface"><div className="form-section-heading"><span>04</span><div><h2>Resumen financiero mensual</h2><p>Completa los datos restantes de la evaluación.</p></div></div><div className="form-grid">{FLUJO_FIELDS.slice(6).map(([name, label]) => <FlowField key={name} name={name} label={label} value={campos[name]} onChange={change} error={errors[name]} decimal={decimalFields.includes(name)} />)}</div></section>
        <section className="calculation-panel"><div className="calculation-copy"><span className="eyebrow light">Resultado provisional</span><h2>Total, flujo neto de fondos</h2><p><Info size={16} />La función suma todos los campos numéricos de esta demostración.</p></div><div className="calculation-value"><span>Total calculado</span><strong>{total === null ? '—' : `Bs ${formatMoney(total)}`}</strong></div><div className={`financial-status ${carga ? carga.toLowerCase() : 'pending'}`}>{carga === 'APROBADO' ? <CheckCircle2 /> : carga === 'RECHAZADO' ? <XCircle /> : <Info />}<span><small>Carga financiera</small><strong>{carga || 'Pendiente'}</strong></span></div></section>
        <div className="form-footer right"><button className="button primary large-button"><Save size={19} />Guardar</button></div>
      </form>
    </div>
  )
}

function FlowField({ name, label, value, onChange, error, decimal }) {
  return <div className="field-group"><label className="field-label" htmlFor={name}>{label}</label><div className={`number-input ${error ? 'invalid' : ''}`}><input id={name} type="number" min="0" step={decimal ? '0.01' : '1'} value={value} onChange={(event) => onChange(name, event.target.value)} inputMode={decimal ? 'decimal' : 'numeric'} /><span>Bs</span></div>{error && <p className="field-error">{error}</p>}</div>
}

function Missing() { return <div className="surface empty-state large-empty"><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver al listado</Link></div> }
