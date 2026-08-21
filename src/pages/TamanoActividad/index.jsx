import { ArrowLeft, BarChart3, CheckCircle2, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning'
import { formatMoney, sumarCampos } from '../../services/calculos'
import { SECTORES_CAEDEC, TAMANO_FIELDS } from '../../types/constants'

const defaults = { sector: '', ingresosAnuales: '', patrimonio: '', personalOcupado: '' }

function clasificarTamano(indice) {
  if (indice <= 10) return 'MICRO EMPRESA'
  if (indice <= 20) return 'MEDIANA EMPRESA'
  return 'GRAN EMPRESA'
}

export default function TamanoActividadPage() {
  const { id } = useParams()
  const { solicitud, updateSolicitud } = useSolicitud(id)
  const [campos, setCampos] = useState(() => ({ ...defaults, ...(solicitud?.tamanoActividad?.campos || {}) }))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  useUnsavedWarning(dirty)

  const complete = Boolean(campos.sector && TAMANO_FIELDS.every(([name]) => campos[name] !== ''))
  const indice = useMemo(() => complete ? sumarCampos(campos, TAMANO_FIELDS.map(([name]) => name)) : null, [campos, complete])
  const resultadoFinal = indice === null ? null : clasificarTamano(indice)
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
    const finalIndex = sumarCampos(campos, TAMANO_FIELDS.map(([name]) => name))
    if (updateSolicitud(id, { tamanoActividad: { campos, indice: finalIndex, resultadoFinal: clasificarTamano(finalIndex) } })) {
      setDirty(false)
      setSaved(true)
    }
  }

  return (
    <div className="page-container form-page">
      <Link className="back-link" to="/solicitudes"><ArrowLeft size={17} />Volver a solicitudes</Link>
      <header className="form-header"><div><span className="eyebrow">{solicitud.nombreReferencia}</span><h1>Tamaño Actividad</h1><p>Clasifica el tamaño de la actividad económica mediante un índice provisional.</p></div><span className="draft-label">{dirty ? 'Cambios sin guardar' : solicitud.tamanoActividad ? 'Sección completada' : 'Sección en blanco'}</span></header>
      {saved && <div className="success-banner" role="status"><CheckCircle2 size={19} />La información se guardó correctamente.</div>}
      <form onSubmit={submit} noValidate>
        <section className="form-section surface"><div className="form-section-heading"><span>01</span><div><h2>Sector de la actividad</h2><p>Selecciona una sola opción del catálogo CAEDEC.</p></div></div><fieldset className="guarantee-fieldset"><legend className="field-label">Sector (CAEDEC)</legend><div className="visible-choice-grid three-options">{SECTORES_CAEDEC.map((sector) => <label key={sector} className={`visible-choice ${campos.sector === sector ? 'selected' : ''}`}><input type="radio" name="sector" value={sector} checked={campos.sector === sector} onChange={(event) => change('sector', event.target.value)} /><span className="radio-control" /><strong>{sector}</strong></label>)}</div>{errors.sector && <p className="field-error">{errors.sector}</p>}</fieldset></section>

        <section className="form-section surface"><div className="form-section-heading"><span>02</span><div><h2>Datos de la actividad</h2><p>Todos los campos son obligatorios y aceptan valores enteros.</p></div></div><div className="form-grid">{TAMANO_FIELDS.map(([name, label]) => <div className="field-group" key={name}><label className="field-label" htmlFor={name}>{label}</label><div className={`number-input ${errors[name] ? 'invalid' : ''}`}><input id={name} type="number" min="0" step="1" inputMode="numeric" value={campos[name]} onChange={(event) => change(name, event.target.value)} /><span>{name === 'personalOcupado' ? 'personas' : 'Bs'}</span></div>{errors[name] && <p className="field-error">{errors[name]}</p>}</div>)}</div></section>

        <section className="form-section surface"><div className="form-section-heading"><span>03</span><div><h2>Resultado de clasificación</h2><p>Se mostrará cuando completes todos los datos requeridos.</p></div></div><div className="readonly-grid"><div className="readonly-field"><span>Índice</span><strong>{indice === null ? '—' : formatMoney(indice)}</strong></div><div className="readonly-field"><span>Resultado Final</span><strong>{resultadoFinal || '—'}</strong></div></div></section>
        <div className="form-footer right"><button className="button primary large-button"><Save size={19} />Guardar</button></div>
      </form>
    </div>
  )
}

function Missing() { return <div className="surface empty-state large-empty"><BarChart3 /><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver al listado</Link></div> }
