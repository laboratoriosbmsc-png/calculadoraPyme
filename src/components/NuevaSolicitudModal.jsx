import { useState } from 'react'
import { Banknote, BarChart3, Scale, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSolicitudes } from '../hooks/useSolicitudes'
import Modal from './Modal'

export default function NuevaSolicitudModal({ open, onClose }) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const { createSolicitud } = useSolicitudes()
  const navigate = useNavigate()

  const resetAndClose = () => {
    setNombre('')
    setError('')
    setStep(1)
    onClose()
  }

  const validate = () => {
    const clean = nombre.trim()
    if (!clean) return setError('Ingresa el nombre del cliente o empresa.'), false
    if (clean.length > 50) return setError('El nombre no puede superar los 50 caracteres.'), false
    if (!/^[\p{L}\p{N} .,'&()-]+$/u.test(clean)) return setError('Usa únicamente letras, números y signos comunes.'), false
    setError('')
    return true
  }

  const choose = (path) => {
    const solicitud = createSolicitud(nombre)
    if (!solicitud) return
    resetAndClose()
    navigate(`/solicitudes/${solicitud.id}/${path}`)
  }

  return (
    <Modal open={open} onClose={resetAndClose} title={step === 1 ? 'Nueva solicitud' : '¿Por dónde deseas comenzar?'} description={step === 1 ? 'Crea la referencia principal de la evaluación.' : nombre.trim()}>
      {step === 1 ? (
        <form onSubmit={(event) => { event.preventDefault(); if (validate()) setStep(2) }}>
          <label className="field-label" htmlFor="nombreReferencia">Nombre de referencia</label>
          <input id="nombreReferencia" className={`text-input ${error ? 'invalid' : ''}`} value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength="50" autoFocus placeholder="Ej. Distribuidora Andina" aria-describedby="nombre-help nombre-error" />
          <div className="field-meta"><small id="nombre-help">Cliente o empresa · máximo 50 caracteres</small><small>{nombre.length}/50</small></div>
          {error && <p id="nombre-error" className="field-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="button secondary" onClick={resetAndClose}>Cancelar</button><button className="button primary">Continuar</button></div>
        </form>
      ) : (
        <div className="choice-grid">
          <button type="button" className="choice-card" onClick={() => choose('plan-pagos')}><span className="choice-icon green"><Banknote /></span><strong>Plan de Pagos</strong><small>Simula las condiciones del financiamiento.</small></button>
          <button type="button" className="choice-card" onClick={() => choose('flujo-caja')}><span className="choice-icon burgundy"><TrendingUp /></span><strong>Flujo de Caja</strong><small>Evalúa el flujo neto y la carga financiera.</small></button>
          <button type="button" className="choice-card" onClick={() => choose('tamano-actividad')}><span className="choice-icon blue"><BarChart3 /></span><strong>Tamaño Actividad</strong><small>Clasifica la actividad según su índice provisional.</small></button>
          <button type="button" className="choice-card" onClick={() => choose('balance-general')}><span className="choice-icon gold"><Scale /></span><strong>Balance General</strong><small>Registra activos, pasivos y límite de financiamiento.</small></button>
          <button type="button" className="text-button back-choice" onClick={() => setStep(1)}>Volver a editar la referencia</button>
        </div>
      )}
    </Modal>
  )
}
