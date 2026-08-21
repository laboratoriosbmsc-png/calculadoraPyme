import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, KeyRound, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { createSession, getSession, isCorporateEmail, normalizeEmail } from '../../services/auth'

export default function LoginPage() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  if (getSession()?.email) return <Navigate to="/inicio" replace />

  const submitEmail = (event) => {
    event.preventDefault()
    if (!isCorporateEmail(email)) {
      setError('Ingresa un correo válido con el dominio @bmsc.com.bo.')
      return
    }
    setEmail(normalizeEmail(email))
    setError('')
    setStep('otp')
  }

  const submitOtp = (event) => {
    event.preventDefault()
    if (otp !== '111111') {
      setError('El código ingresado no es correcto. Inténtalo nuevamente.')
      return
    }
    createSession(email)
    navigate(location.state?.from || '/inicio', { replace: true })
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="brand-mark large"><Calculator /></span>
          <div><strong>Calculadora</strong><em>Pyme</em></div>
        </div>
        <div className="login-message">
          <span className="eyebrow light">Evaluaciones más ágiles</span>
          <h1>Decisiones claras para impulsar grandes ideas.</h1>
          <p>Una herramienta simple para organizar y evaluar las solicitudes de tus clientes Pyme.</p>
        </div>
        <div className="security-note"><LockKeyhole size={20} /><span><strong>Acceso corporativo</strong>Uso exclusivo para ejecutivos autorizados.</span></div>
        <div className="decorative-ring ring-one" /><div className="decorative-ring ring-two" />
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="mobile-login-logo"><span className="brand-mark"><Calculator /></span><strong>Calculadora <em>Pyme</em></strong></div>
          {step === 'email' ? (
            <>
              <span className="step-icon"><Mail /></span>
              <span className="eyebrow">Bienvenido</span>
              <h2>Ingresa a tu cuenta</h2>
              <p className="form-intro">Utiliza tu correo corporativo para continuar.</p>
              <form onSubmit={submitEmail} noValidate>
                <label className="field-label" htmlFor="email">Correo electrónico</label>
                <div className={`input-with-icon ${error ? 'invalid' : ''}`}><Mail size={19} /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoFocus placeholder="nombre@bmsc.com.bo" /></div>
                {error && <p className="field-error" role="alert">{error}</p>}
                <button className="button primary login-submit">Enviar código de acceso <ArrowRight size={18} /></button>
              </form>
              <p className="demo-hint"><CheckCircle2 size={16} />En esta demostración no se enviará ningún correo.</p>
            </>
          ) : (
            <>
              <button type="button" className="text-button login-back" onClick={() => { setStep('email'); setOtp(''); setError('') }}><ArrowLeft size={17} />Cambiar correo</button>
              <span className="step-icon"><KeyRound /></span>
              <span className="eyebrow">Verificación</span>
              <h2>Revisa tu código</h2>
              <p className="form-intro">Ingresa el código de 6 dígitos asociado a <strong>{email}</strong>.</p>
              <form onSubmit={submitOtp} noValidate>
                <label className="field-label" htmlFor="otp">Código de acceso</label>
                <input id="otp" className={`otp-input ${error ? 'invalid' : ''}`} inputMode="numeric" pattern="[0-9]*" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" autoFocus placeholder="••••••" />
                {error && <p className="field-error" role="alert">{error}</p>}
                <div className="demo-code"><span>Código para esta demostración</span><strong>111111</strong></div>
                <button className="button primary login-submit" disabled={otp.length !== 6}>Validar e ingresar <ArrowRight size={18} /></button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
