import { ArrowLeft, CheckCircle2, Save, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CalculationHelp from '../../components/CalculationHelp'
import FieldErrorMark from '../../components/FieldErrorMark'
import { SectionSelectorButton, SectionSelectorDialog } from '../../components/SectionSelector'
import SaveToast from '../../components/SaveToast'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning'
import { focusFirstInvalid } from '../../services/focusFirstInvalid'
import { formatMoney } from '../../services/calculos'
import { FLUJO_ACTIVIDAD_1_FIELDS, FLUJO_ACTIVIDAD_2_FIELDS, FLUJO_FIELDS, FLUJO_RESUMEN_FIELDS, GARANTIAS } from '../../types/constants'

const defaults = {
  tipoGarantia: '', ingresosActividad1: '', costosActividad1: '', gastosOperativosActividad1: '', margenActividad1: '',
  anadirActividad2: 'NO', ingresosActividad2: '', costosActividad2: '', gastosOperativosActividad2: '', margenActividad2: '',
  otrosIngresos: '', gastosFamiliares: '', margenOperativoTotal: '', margenTotalOperativo: '', cuotaPropuesta: '', cuotaSistemaFinanciero: '',
}
const decimalFields = ['cuotaSistemaFinanciero']
const actividad1Editables = FLUJO_ACTIVIDAD_1_FIELDS.filter(([name]) => name !== 'margenActividad1')
const actividad2Editables = FLUJO_ACTIVIDAD_2_FIELDS.filter(([name]) => name !== 'margenActividad2')

function calcularMargen(campos, fields) {
  const names = fields.map(([name]) => name)
  if (!names.every((name) => campos[name] !== '')) return null
  return Number(campos[names[0]]) - Number(campos[names[1]]) - Number(campos[names[2]])
}

export default function FlujoCajaPage() {
  const { id } = useParams()
  const { solicitud, updateSolicitud } = useSolicitud(id)
  const [campos, setCampos] = useState(() => {
    const saved = solicitud?.flujoCaja?.campos || {}
    return { ...defaults, ...saved, anadirActividad2: saved.anadirActividad2 || 'NO' }
  })
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  useUnsavedWarning(dirty)
  const actividad2Activa = campos.anadirActividad2 === 'SI'
  const margenActividad1 = useMemo(() => calcularMargen(campos, actividad1Editables), [campos])
  const margenActividad2 = useMemo(() => actividad2Activa ? calcularMargen(campos, actividad2Editables) : 0, [campos, actividad2Activa])
  const margenOperativoTotal = margenActividad1 === null || margenActividad2 === null ? null : margenActividad1 + margenActividad2
  const resumenBaseCompleto = margenOperativoTotal !== null && campos.otrosIngresos !== '' && campos.gastosFamiliares !== ''
  const margenTotalOperativo = resumenBaseCompleto ? margenOperativoTotal + Number(campos.otrosIngresos) - Number(campos.gastosFamiliares) : null
  const camposCalculados = {
    ...campos,
    margenActividad1: margenActividad1 ?? '',
    margenActividad2: margenActividad2 ?? '',
    margenOperativoTotal: margenOperativoTotal ?? '',
    margenTotalOperativo: margenTotalOperativo ?? '',
  }
  const editableNames = [
    ...actividad1Editables.map(([name]) => name),
    ...(actividad2Activa ? actividad2Editables.map(([name]) => name) : []),
    ...FLUJO_RESUMEN_FIELDS.map(([name]) => name),
  ]
  const complete = Boolean(campos.tipoGarantia && campos.anadirActividad2 && editableNames.every((name) => campos[name] !== ''))
  const totalFlujoNeto = complete ? margenTotalOperativo - Number(campos.cuotaPropuesta) - Number(campos.cuotaSistemaFinanciero) : null
  const cargaFinanciera = complete && margenTotalOperativo > 0
    ? ((Number(campos.cuotaPropuesta) + Number(campos.cuotaSistemaFinanciero)) / margenTotalOperativo) * 100
    : null
  const cuotasTotales = Number(campos.cuotaPropuesta) + Number(campos.cuotaSistemaFinanciero)
  const limiteGarantia = campos.tipoGarantia ? Number(campos.tipoGarantia.match(/<=\s*(\d+(?:[.,]\d+)?)%/)?.[1]?.replace(',', '.')) : null
  const resultadoCarga = complete
    ? margenTotalOperativo > 0 && cargaFinanciera <= limiteGarantia ? 'APROBADO' : 'RECHAZADO'
    : null
  if (!solicitud) return <Missing />

  const change = (name, value) => {
    setCampos((current) => ({ ...current, [name]: value, ...(name === 'anadirActividad2' && value === 'NO' ? { ingresosActividad2: '', costosActividad2: '', gastosOperativosActividad2: '', margenActividad2: '' } : {}) }))
    setDirty(true); setSaved(false); setErrors((current) => ({ ...current, [name]: '' }))
  }
  const validate = (form) => {
    const next = {}
    if (!campos.tipoGarantia) next.tipoGarantia = 'Selecciona un tipo de garantía.'
    if (!campos.anadirActividad2) next.anadirActividad2 = 'Selecciona Sí o No.'
    editableNames.forEach((name) => {
      const label = FLUJO_FIELDS.find(([key]) => key === name)?.[1]
      if (campos[name] === '') next[name] = `${label} es obligatorio.`
      else if (Number(campos[name]) < 0) next[name] = 'El valor no puede ser negativo.'
      else if (!decimalFields.includes(name) && !Number.isInteger(Number(campos[name]))) next[name] = 'Ingresa un número sin decimales.'
    })
    setErrors(next)
    focusFirstInvalid(form, next)
    return Object.keys(next).length === 0
  }
  const submit = (event) => {
    event.preventDefault()
    if (!validate(event.currentTarget)) return
    if (updateSolicitud(id, {
      flujoCaja: {
        campos: camposCalculados,
        totalFlujoNeto,
        cargaFinanciera,
        resultadoCargaFinanciera: resultadoCarga,
        limiteGarantia,
      },
    })) { setDirty(false); setSaved(true) }
  }

  return (
    <div className="page-container form-page">
      <Link className="back-link" to="/solicitudes"><ArrowLeft size={17} />Volver a solicitudes</Link>
      <header className="form-header"><span className="eyebrow">{solicitud.nombreReferencia}</span><div className="form-title-row"><h1>Flujo de Caja</h1><span className={`draft-label ${!dirty && solicitud.flujoCaja ? 'completed' : ''}`}>{dirty ? 'Cambios sin guardar' : solicitud.flujoCaja ? 'Sección completada' : 'Sección en blanco'}</span></div></header>
      {saved && <SaveToast onDismiss={setSaved} />}
      <form onSubmit={submit} noValidate>
        <section className="form-section surface compact-guarantee-section"><div className="form-section-heading"><span>01</span><div><h2>Garantía</h2><p>Selecciona la condición que aplica a la operación.</p></div></div><fieldset className="guarantee-fieldset"><legend className="field-label">Tipo de garantía <FieldErrorMark error={errors.tipoGarantia} /></legend><div className="guarantee-options">{GARANTIAS.map((option) => <label key={option} className={`guarantee-option ${campos.tipoGarantia === option ? 'selected' : ''}`}><input type="radio" name="tipoGarantia" value={option} checked={campos.tipoGarantia === option} onChange={(event) => change('tipoGarantia', event.target.value)} aria-invalid={Boolean(errors.tipoGarantia)} /><span className="radio-control" /><strong>{option}</strong></label>)}</div></fieldset></section>
        <section className="form-section surface">
          <div className="form-section-heading">
            <span>02</span>
            <div>
              <h2>Actividad económica principal</h2>
              <p>Datos mensuales de la primera actividad.</p>
            </div>
          </div>
          <div className="form-grid flow-form-grid">{actividad1Editables.map(([name, label]) => <FlowField key={name} name={name} label={label} value={campos[name]} onChange={change} error={errors[name]} />)}
            <FlowField name="margenActividad1" label="Margen operativo actividad 1" value={margenActividad1 ?? ''} readOnly />
          </div>
        </section>
        <section className="form-section surface"><div className="form-section-heading"><span>03</span><div><h2>Segunda actividad</h2><p>Agrega otra fuente de actividad cuando corresponda.</p></div></div><fieldset className="yes-no-fieldset"><legend>¿Desea añadir una 2da actividad? <FieldErrorMark error={errors.anadirActividad2} /></legend><div><label className={campos.anadirActividad2 === 'SI' ? 'selected' : ''}><input type="radio" name="anadirActividad2" value="SI" checked={campos.anadirActividad2 === 'SI'} onChange={(event) => change('anadirActividad2', event.target.value)} />Sí</label><label className={campos.anadirActividad2 === 'NO' ? 'selected' : ''}><input type="radio" name="anadirActividad2" value="NO" checked={campos.anadirActividad2 === 'NO'} onChange={(event) => change('anadirActividad2', event.target.value)} />No</label></div></fieldset>{actividad2Activa && <div className="form-grid flow-form-grid activity-two">{actividad2Editables.map(([name, label]) => <FlowField key={name} name={name} label={label} value={campos[name]} onChange={change} error={errors[name]} />)}<FlowField name="margenActividad2" label="Margen operativo actividad 2" value={margenActividad2 ?? ''} readOnly /></div>}</section>
        <section className="form-section surface"><div className="form-section-heading"><span>04</span><div><h2>Margen operativo Total</h2><p>Suma de los márgenes operativos de las actividades registradas.</p></div></div><div className="form-grid flow-form-grid"><FlowField name="margenOperativoTotal" label="Margen operativo total" value={margenOperativoTotal ?? ''} readOnly /></div></section>
        <section className="form-section surface"><div className="form-section-heading"><span>05</span><div><h2>Resumen financiero mensual</h2><p>Completa los datos restantes de la evaluación.</p></div></div><div className="form-grid flow-form-grid flow-summary-grid"><FlowField name="otrosIngresos" label="Otros ingresos" value={campos.otrosIngresos} onChange={change} error={errors.otrosIngresos} /><FlowField name="gastosFamiliares" label="Gastos familiares mensuales" value={campos.gastosFamiliares} onChange={change} error={errors.gastosFamiliares} /><FlowField name="margenTotalOperativo" label="Margen total operativo" value={margenTotalOperativo ?? ''} readOnly className="flow-full-row" /><FlowField name="cuotaPropuesta" label="Cuota mensual propuesta" value={campos.cuotaPropuesta} onChange={change} error={errors.cuotaPropuesta} /><FlowField name="cuotaSistemaFinanciero" label="Cuota en sistema financiero" value={campos.cuotaSistemaFinanciero} onChange={change} error={errors.cuotaSistemaFinanciero} decimal /></div></section>
        <section className="form-section surface flow-result-section"><div className="form-section-heading"><span>06</span><div><h2>Resultado provisional</h2><p>Comparación de la carga financiera con el límite de la garantía seleccionada.</p></div></div><div className="form-grid flow-form-grid"><FlowField name="totalFlujoNeto" label="Total flujo Neto de fondos" value={totalFlujoNeto ?? ''} readOnly /><FlowField name="cargaFinanciera" label="Carga financiera" value={cargaFinanciera === null ? '' : Number(cargaFinanciera.toFixed(2))} suffix="%" readOnly /></div><div className={`flow-result-status ${resultadoCarga ? resultadoCarga.toLowerCase() : 'pending'}`}>{resultadoCarga === 'APROBADO' ? <CheckCircle2 /> : resultadoCarga === 'RECHAZADO' ? <XCircle /> : <span className="status-placeholder" />}<span><small>{limiteGarantia ? `Límite de garantía: ${limiteGarantia}%` : 'Selecciona una garantía y completa los datos'}</small><strong>{resultadoCarga || 'PENDIENTE'}</strong></span></div><p className="result-disclaimer">Estimación basada en los datos ingresados; no constituye una aprobación crediticia.</p><CalculationHelp>{!complete
          ? <p>Completa los campos y selecciona una garantía para ver el cálculo con tus importes.</p>
          : <>
          <p><b>Margen total operativo =</b> margen de actividades + otros ingresos − gastos familiares: Bs {formatMoney(margenOperativoTotal)} + Bs {formatMoney(campos.otrosIngresos)} − Bs {formatMoney(campos.gastosFamiliares)} = <strong>Bs {formatMoney(margenTotalOperativo)}</strong>.</p>
          <p><b>Cuotas =</b> cuota propuesta + cuota en sistema: Bs {formatMoney(campos.cuotaPropuesta)} + Bs {formatMoney(campos.cuotaSistemaFinanciero)} = <strong>Bs {formatMoney(cuotasTotales)}</strong>.</p>
          <p><b>Flujo neto =</b> margen total − cuotas: Bs {formatMoney(margenTotalOperativo)} − Bs {formatMoney(cuotasTotales)} = <strong>Bs {formatMoney(totalFlujoNeto)}</strong>.</p>{cargaFinanciera === null
            ? <p>Con un margen no positivo no se calcula el porcentaje de carga. El resultado provisional es rechazo.</p>
            : <p><b>Carga financiera =</b> cuotas ÷ margen × 100: Bs {formatMoney(cuotasTotales)} ÷ Bs {formatMoney(margenTotalOperativo)} × 100 = <strong>{formatMoney(cargaFinanciera)}%</strong>. Se compara con el límite de {limiteGarantia}%.</p>}</>}
        </CalculationHelp></section>
        <div className="form-footer section-selector-footer"><SectionSelectorButton onClick={() => setSectionsOpen(true)} dirty={dirty} /><button className="button primary large-button"><Save size={19} />Guardar</button></div>
      </form>
      <SectionSelectorDialog open={sectionsOpen} onClose={() => setSectionsOpen(false)} solicitud={solicitud} dirty={dirty} />
    </div>
  )
}

function FlowField({ name, label, value, onChange, error, decimal, readOnly = false, suffix = 'Bs', className = '' }) {
  return <div className={`field-group ${className}`}><label className="field-label" htmlFor={name}>{label} <FieldErrorMark error={error} id={`${name}-error`} /></label><div className={`number-input ${readOnly ? 'readonly-number-input' : ''} ${error ? 'invalid' : ''}`}><input id={name} type="number" min={readOnly ? undefined : '0'} step={decimal ? '0.01' : '1'} value={value} onChange={readOnly ? undefined : (event) => onChange(name, event.target.value)} inputMode={decimal ? 'decimal' : 'numeric'} readOnly={readOnly} aria-readonly={readOnly} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} placeholder={readOnly ? '—' : undefined} /><span>{suffix}</span></div></div>
}

function Missing() { return <div className="surface empty-state large-empty"><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver al listado</Link></div> }
