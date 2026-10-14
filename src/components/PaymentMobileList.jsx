import { ChevronDown } from 'lucide-react'
import { formatMoney } from '../services/calculos'

export default function PaymentMobileList({ rows }) {
  return <div className="payment-mobile-list">
    {rows.map((row) => <details className="payment-mobile-item" key={row.numeroCuota}>
      <summary>
        <span><strong>Cuota {row.numeroCuota}</strong><small>Saldo capital: Bs {formatMoney(row.saldoCapital)}</small></span>
        <span className="payment-mobile-total"><small>Cuota total</small><strong>Bs {formatMoney(row.cuotaTotal)}</strong></span>
        <ChevronDown className="payment-mobile-chevron" size={17} aria-hidden="true" />
      </summary>
      <dl>
        <div><dt>Amortización a capital</dt><dd>Bs {formatMoney(row.amortizacionCapital)}</dd></div>
        <div><dt>Intereses</dt><dd>Bs {formatMoney(row.intereses)}</dd></div>
        <div><dt>Seguros</dt><dd>Bs {formatMoney(row.seguros)}</dd></div>
      </dl>
    </details>)}
  </div>
}
