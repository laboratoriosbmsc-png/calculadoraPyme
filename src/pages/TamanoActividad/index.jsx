import { ArrowLeft, BarChart3, Building, Building2, Factory, Save, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FieldErrorMark from '../../components/FieldErrorMark'
import SaveToast from '../../components/SaveToast'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning'
import { calcularIndiceTamano, clasificarTamano, formatIndex } from '../../services/calculos'
import { SECTORES_CAEDEC, TAMANO_FIELDS } from '../../types/constants'

const defaults = { sector: '', ingresosAnuales: '', patrimonio: '', personalOcupado: '' }

const RESULT_ICONS = {
  Microempresa: { icon: Store, color: 'micro' },
  'Pequeña Empresa': { icon: Building, color: 'small' },
  'Mediana Empresa': { icon: Building2, color: 'medium' },
  'Gran Empresa': { icon: Factory, color: 'large' },
}

export default function TamanoActividadPage() {
  const { id } = useParams()
  const { solicitud, updateSolicitud } = useSolicitud(id)
  const [campos, setCampos] = useState(() => ({ ...defaults, ...(solicitud?.tamanoActividad?.campos || {}) }))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  useUnsavedWarning(dirty)

  const hasRequiredData = Boolean(campos.sector && TAMANO_FIELDS.every(([name]) => campos[name] !== ''))
  const indice = useMemo(() => hasRequiredData ? calcularIndiceTamano(campos) : null, [campos, hasRequiredData])
  const resultadoFinal = indice === null ? null : clasificarTamano(indice)
  const resultVisual = resultadoFinal ? RESULT_ICONS[resultadoFinal] : null
  const ResultIcon = resultVisual?.icon
  if (!solicitud) return <Missing />

  const change = (name, value) => {
    setCampos((current) => ({ ...current, [name]: value }))
    setDirty(true)
    setSaved(false)
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!campos.sector) next.sector = 'Selecciona un sector CAEDEC.'
    TAMANO_FIELDS.forEach(([name, label]) => {
      if (campos[name] === '') next[name] = `${label} es obligatorio.`
      else if (Number(campos[name]) < 0) next[name] = 'El valor no puede ser negativo.'
      else if (!Number.isInteger(Number(campos[name]))) next[name] = 'Ingresa un número sin decimales.'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return
    const finalIndex = calcularIndiceTamano(campos)
    if (updateSolicitud(id, { tamanoActividad: { campos, indice: finalIndex, resultadoFinal: clasificarTamano(finalIndex) } })) {
      setDirty(false)
      setSaved(true)
    }
  }

  return (
    <div className="page-container form-page">
      <Link className="back-link" to="/solicitudes"><ArrowLeft size={17} />Volver a solicitudes</Link>
      <header className="form-header"><span className="eyebrow">{solicitud.nombreReferencia}</span><div className="form-title-row"><h1>Tamaño Actividad</h1><span className={`draft-label ${!dirty && solicitud.tamanoActividad ? 'completed' : ''}`}>{dirty ? 'Cambios sin guardar' : solicitud.tamanoActividad ? 'Sección completada' : 'Sección en blanco'}</span></div></header>
      {saved && <SaveToast onDismiss={setSaved} />}
      <form onSubmit={submit} noValidate>
        <section className="form-section surface"><div className="form-section-heading"><span>01</span><div><h2>Sector de la actividad</h2><p>Selecciona una sola opción del catálogo CAEDEC.</p></div></div><fieldset className="guarantee-fieldset"><legend className="field-label">Sector (CAEDEC)</legend><div className="visible-choice-grid three-options tamano-sector-grid">{SECTORES_CAEDEC.map((sector) => <label key={sector} className={`visible-choice ${campos.sector === sector ? 'selected' : ''}`}><input type="radio" name="sector" value={sector} checked={campos.sector === sector} onChange={(event) => change('sector', event.target.value)} /><span className="radio-control" /><strong>{sector}</strong></label>)}</div>{errors.sector && <p className="field-error">{errors.sector}</p>}</fieldset></section>

        <section className="form-section surface"><div className="form-section-heading"><span>02</span><div><h2>Datos de la actividad</h2><p>Todos los campos son obligatorios y aceptan valores enteros.</p></div></div><div className="form-grid tamano-form-grid">{TAMANO_FIELDS.map(([name, label]) => <div className="field-group" key={name}><label className="field-label" htmlFor={name}>{label} <FieldErrorMark error={errors[name]} id={`${name}-error`} /></label><div className={`number-input ${errors[name] ? 'invalid' : ''}`}><input id={name} type="number" min="0" step="1" inputMode="numeric" value={campos[name]} onChange={(event) => change(name, event.target.value)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} /><span>{name === 'personalOcupado' ? 'personas' : 'Bs'}</span></div></div>)}</div></section>

        <section className="form-section surface"><div className="form-section-heading"><span>03</span><div><h2>Resultado de clasificación</h2><p>El índice se actualiza automáticamente con los datos ingresados.</p></div></div><div className="readonly-grid tamano-results-grid"><div className="readonly-field"><span>Índice</span><strong>{indice === null ? '—' : formatIndex(indice)}</strong></div><div className={`readonly-field tamano-result ${resultVisual?.color || 'pending'}`}><span>Resultado Final</span><strong>{resultVisual ? <><span className="tamano-result-icon" aria-hidden="true"><ResultIcon /></span>{resultadoFinal}</> : '—'}</strong></div></div></section>
        <div className="form-footer right"><button className="button primary large-button"><Save size={19} />Guardar</button></div>
      </form>
    </div>
  )
}

function Missing() { return <div className="surface empty-state large-empty"><BarChart3 /><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver al listado</Link></div> }
