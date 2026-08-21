import { ArrowLeft, CheckCircle2, Scale, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSolicitud } from '../../hooks/useSolicitudes'
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning'
import { formatMoney, sumarCampos } from '../../services/calculos'
import { BALANCE_ACTIVOS_FIELDS, BALANCE_PASIVOS_FIELDS, GARANTIAS_BALANCE } from '../../types/constants'

const defaults = Object.fromEntries([...BALANCE_ACTIVOS_FIELDS, ...BALANCE_PASIVOS_FIELDS].map(([name]) => [name, '']))
defaults.tipoGarantia = ''

export default function BalanceGeneralPage() {
  const { id } = useParams()
  const { solicitud, updateSolicitud } = useSolicitud(id)
  const [campos, setCampos] = useState(() => ({ ...defaults, ...(solicitud?.balanceGeneral?.campos || {}) }))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  useUnsavedWarning(dirty)

  const totalActivos = useMemo(() => sumarCampos(campos, BALANCE_ACTIVOS_FIELDS.map(([name]) => name)), [campos])
  const totalPasivos = useMemo(() => sumarCampos(campos, BALANCE_PASIVOS_FIELDS.map(([name]) => name)), [campos])
  const limiteFinanciamiento = campos.tipoGarantia ? totalActivos + totalPasivos + (campos.tipoGarantia === GARANTIAS_BALANCE[1] ? 100 : 0) : null
  if (!solicitud) return <Missing />

  const change = (name, value) => {
    setCampos((current) => ({ ...current, [name]: value }))
    setDirty(true)
    setSaved(false)
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    ;[...BALANCE_ACTIVOS_FIELDS, ...BALANCE_PASIVOS_FIELDS].forEach(([name, label]) => {
      if (campos[name] === '') next[name] = `${label} es obligatorio.`
      else if (Number(campos[name]) < 0) next[name] = 'El valor no puede ser negativo.'
    })
    if (!campos.tipoGarantia) next.tipoGarantia = 'Selecciona un tipo de garantía.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return
    const finalActivos = sumarCampos(campos, BALANCE_ACTIVOS_FIELDS.map(([name]) => name))
    const finalPasivos = sumarCampos(campos, BALANCE_PASIVOS_FIELDS.map(([name]) => name))
    const finalLimit = finalActivos + finalPasivos + (campos.tipoGarantia === GARANTIAS_BALANCE[1] ? 100 : 0)
    if (updateSolicitud(id, { balanceGeneral: { campos, totalActivos: finalActivos, totalPasivos: finalPasivos, limiteFinanciamiento: finalLimit } })) {
      setDirty(false)
      setSaved(true)
    }
  }

  return (
    <div className="page-container form-page">
      <Link className="back-link" to="/solicitudes"><ArrowLeft size={17} />Volver a solicitudes</Link>
      <header className="form-header"><div><span className="eyebrow">{solicitud.nombreReferencia}</span><h1>Balance General</h1><p>Registra activos, pasivos y el límite provisional de financiamiento.</p></div><span className="draft-label">{dirty ? 'Cambios sin guardar' : solicitud.balanceGeneral ? 'Sección completada' : 'Sección en blanco'}</span></header>
      {saved && <div className="success-banner" role="status"><CheckCircle2 size={19} />La información se guardó correctamente.</div>}
      <form onSubmit={submit} noValidate>
        <BalanceSection number="01" title="Activos" description="Registra los recursos y bienes de la empresa." fields={BALANCE_ACTIVOS_FIELDS} campos={campos} errors={errors} onChange={change} />
        <div className="section-total"><span>Total activos</span><strong>Bs {formatMoney(totalActivos)}</strong></div>
        <BalanceSection number="02" title="Pasivos" description="Registra las obligaciones y deudas vigentes." fields={BALANCE_PASIVOS_FIELDS} campos={campos} errors={errors} onChange={change} />
        <div className="section-total burgundy-total"><span>Total pasivos</span><strong>Bs {formatMoney(totalPasivos)}</strong></div>

        <section className="form-section surface"><div className="form-section-heading"><span>03</span><div><h2>Resumen</h2><p>Selecciona la garantía para calcular el límite provisional.</p></div></div><fieldset className="guarantee-fieldset"><legend className="field-label">Tipo de Garantía para relación Deuda/Patrimonio</legend><div className="visible-choice-grid">{GARANTIAS_BALANCE.map((garantia) => <label key={garantia} className={`visible-choice ${campos.tipoGarantia === garantia ? 'selected' : ''}`}><input type="radio" name="tipoGarantia" value={garantia} checked={campos.tipoGarantia === garantia} onChange={(event) => change('tipoGarantia', event.target.value)} /><span className="radio-control" /><strong>{garantia}</strong></label>)}</div>{errors.tipoGarantia && <p className="field-error">{errors.tipoGarantia}</p>}</fieldset><div className="readonly-grid summary-readonly"><div className="readonly-field full-result"><span>Límite de Financiamiento</span><strong>{limiteFinanciamiento === null ? '—' : `Bs ${formatMoney(limiteFinanciamiento)}`}</strong></div></div></section>
        <div className="form-footer right"><button className="button primary large-button"><Save size={19} />Guardar</button></div>
      </form>
    </div>
  )
}

function BalanceSection({ number, title, description, fields, campos, errors, onChange }) {
  return <section className="form-section surface"><div className="form-section-heading"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div><div className="form-grid">{fields.map(([name, label]) => <div className="field-group" key={name}><label className="field-label" htmlFor={name}>{label}</label><div className={`number-input ${errors[name] ? 'invalid' : ''}`}><input id={name} type="number" min="0" step="0.01" inputMode="decimal" value={campos[name]} onChange={(event) => onChange(name, event.target.value)} /><span>Bs</span></div>{errors[name] && <p className="field-error">{errors[name]}</p>}</div>)}</div></section>
}

function Missing() { return <div className="surface empty-state large-empty"><Scale /><h1>Solicitud no encontrada</h1><Link className="button primary" to="/solicitudes">Volver al listado</Link></div> }
